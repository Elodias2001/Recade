import { Command } from "commander";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pc from "picocolors";
import { git, repoRoot } from "./git.js";
import {
  collectAuthors,
  groupAuthors,
  identityConfigPath,
  loadIdentityConfig,
  matchesIdentity,
  normalizeEmail,
  saveIdentityConfig,
  type IdentityConfig,
} from "./identity.js";
import { renderAuthors, renderBundle, renderVerification } from "./render.js";
import { scanRepository } from "./scan.js";
import { bundleSchema } from "./schema.js";
import { verifyBundle } from "./verify.js";
import { readFile } from "node:fs/promises";

export const VERSION = "0.0.0";

function fail(message: string): never {
  process.stderr.write(`\n  ${pc.red("✗")} ${message}\n\n`);
  process.exit(1);
}

async function resolveRoot(path: string): Promise<string> {
  const abs = resolve(path);
  const root = await repoRoot(abs);
  if (!root) fail(`${abs} n'est pas un dépôt Git.`);
  return root;
}

/**
 * Détermine les identités à compter, dans l'ordre : `--me`, puis la
 * configuration globale, puis en dernier recours le `user.email` du dépôt.
 */
async function resolveIdentity(root: string, me: string[] | undefined): Promise<IdentityConfig> {
  if (me && me.length > 0) {
    return { version: 1, emails: me.map(normalizeEmail), names: [] };
  }

  const stored = await loadIdentityConfig();
  if (stored && stored.emails.length > 0) return stored;

  const local = await git(root, ["config", "--get", "user.email"]).catch(() => "");
  const email = local.trim();
  if (!email) {
    fail(
      "Aucune identité connue.\n    Déclarez la vôtre : " +
        pc.yellow("recade whoami --add <email>") +
        `\n    (stockée dans ${identityConfigPath})`,
    );
  }

  process.stderr.write(
    `  ${pc.yellow("!")} ${pc.dim(`aucune identité configurée — repli sur le user.email du dépôt : ${email}`)}\n`,
  );
  return { version: 1, emails: [email.toLowerCase()], names: [] };
}

const program = new Command();

program
  .name("recade")
  .description("Atteste ce que tu as construit — sans faire sortir une ligne de code.")
  .version(VERSION);

program
  .command("scan")
  .description("Compte votre contribution dans un dépôt et produit l'attestation")
  .argument("[chemin]", "chemin du dépôt", ".")
  .option("--me <email...>", "adresses à compter comme vôtres, pour ce scan seulement")
  .option("--json", "écrit le bundle JSON sur la sortie standard")
  .option("-o, --out <fichier>", "écrit le bundle JSON dans un fichier")
  .option("--no-lines", "n'ouvre aucun fichier : compteurs Git seulement")
  .action(
    async (
      chemin: string,
      opts: { me?: string[]; json?: boolean; out?: string; lines: boolean },
    ) => {
      const root = await resolveRoot(chemin);
      const identity = await resolveIdentity(root, opts.me);

      const bundle = await scanRepository({ root, identity, countLines: opts.lines }).catch(
        (error: unknown) => fail(error instanceof Error ? error.message : String(error)),
      );

      // On valide notre propre sortie : le bundle est un contrat, pas un objet libre.
      const parsed = bundleSchema.safeParse(bundle);
      if (!parsed.success) {
        fail(`Le bundle produit est invalide :\n${parsed.error.message}`);
      }

      if (opts.out) {
        await writeFile(resolve(opts.out), `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");
        process.stderr.write(`  ${pc.green("✓")} bundle écrit dans ${pc.bold(opts.out)}\n`);
      }

      if (opts.json) process.stdout.write(`${JSON.stringify(parsed.data, null, 2)}\n`);
      else process.stdout.write(`${renderBundle(parsed.data)}\n`);
    },
  );

program
  .command("whoami")
  .description("Liste les auteurs d'un dépôt et déclare lesquels sont les vôtres")
  .argument("[chemin]", "chemin du dépôt", ".")
  .option("--add <email...>", "ajoute ces adresses à votre configuration")
  .option("--add-name <nom...>", "ajoute ces noms (commits faits sous une adresse machine)")
  .action(async (chemin: string, opts: { add?: string[]; addName?: string[] }) => {
    const stored = (await loadIdentityConfig()) ?? { version: 1 as const, emails: [], names: [] };

    if (opts.add || opts.addName) {
      const next: IdentityConfig = {
        version: 1,
        emails: [...new Set([...stored.emails, ...(opts.add ?? []).map(normalizeEmail)])],
        names: [...new Set([...stored.names, ...(opts.addName ?? []).map((n) => n.trim())])],
      };
      const path = await saveIdentityConfig(next);
      process.stdout.write(
        `\n  ${pc.green("✓")} identités enregistrées dans ${pc.bold(path)}\n` +
          next.emails.map((e) => `    ${pc.yellow("·")} ${e}\n`).join("") +
          next.names.map((n) => `    ${pc.yellow("·")} ${n} ${pc.dim("(nom)")}\n`).join("") +
          "\n",
      );
      return;
    }

    const root = await resolveRoot(chemin);
    const authors = await collectAuthors(root);
    const groups = groupAuthors(authors);
    const mine = new Set(authors.filter((a) => matchesIdentity(a, stored)).map((a) => a.email));

    process.stdout.write(renderAuthors(groups, mine));
    if (mine.size === 0) {
      process.stdout.write(
        `  ${pc.dim("Aucune de ces signatures n'est déclarée comme vôtre.")}\n` +
          `  ${pc.dim("Déclarez-la :")} ${pc.yellow("recade whoami --add <email>")}\n\n`,
      );
    }
  });

program
  .command("verify")
  .description("Recalcule une attestation depuis le dépôt et la confronte à ce qu'elle affirme")
  .argument("<bundle>", "fichier JSON de l'attestation")
  .argument("[chemin]", "dépôt à confronter", ".")
  .action(async (bundlePath: string, chemin: string) => {
    let raw: string;
    try {
      raw = await readFile(resolve(bundlePath), "utf8");
    } catch {
      fail(`Attestation introuvable : ${bundlePath}`);
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      fail(`${bundlePath} n'est pas du JSON valide.`);
    }

    const parsed = bundleSchema.safeParse(json);
    if (!parsed.success) {
      fail(`Attestation malformée — elle ne respecte pas le schéma v1 :\n${parsed.error.message}`);
    }

    const root = await resolveRoot(chemin);
    const result = await verifyBundle(root, parsed.data);
    process.stdout.write(`${renderVerification(result)}\n`);
    if (result.verdict === "réfutée") process.exitCode = 1;
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
