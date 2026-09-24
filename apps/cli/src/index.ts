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
import {
  renderAuthors,
  renderBundle,
  renderPortfolioVerification,
  renderVerification,
} from "./render.js";
import { scanRepository } from "./scan.js";
import { bundleSchema, portfolioSchema } from "./schema.js";
import { buildPortfolio } from "./portfolio.js";
import { verifyBundle, verifyPortfolio } from "./verify.js";
import { renderHtmlAttestation, renderHtmlPortfolio } from "./html.js";
import { htmlToPdf, NoBrowserError } from "./pdf.js";
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
  .argument("[chemins...]", "un ou plusieurs dépôts")
  .option("--me <email...>", "adresses à compter comme vôtres, pour ce scan seulement")
  .option("--json", "écrit le bundle JSON sur la sortie standard")
  .option("-o, --out <fichier>", "écrit le bundle JSON dans un fichier")
  .option("--html <fichier>", "écrit une attestation HTML autonome (vérifiable)")
  .option("--pdf <fichier>", "écrit une attestation PDF (pour joindre à un dossier)")
  .option("--no-lines", "ne compte pas les lignes : compteurs de commits seulement")
  .action(
    async (
      chemins: string[],
      opts: {
        me?: string[];
        json?: boolean;
        out?: string;
        html?: string;
        pdf?: string;
        lines: boolean;
      },
    ) => {
      const paths = chemins.length > 0 ? chemins : ["."];
      const roots: string[] = [];
      for (const p of paths) roots.push(await resolveRoot(p));

      const identity = await resolveIdentity(roots[0]!, opts.me);

      const bundles = [];
      for (const root of roots) {
        bundles.push(
          await scanRepository({ root, identity, countLines: opts.lines }).catch(
            (error: unknown) => fail(error instanceof Error ? error.message : String(error)),
          ),
        );
      }

      // On valide notre propre sortie : le document est un contrat, pas un objet libre.
      const single = bundles.length === 1;
      const schema = single ? bundleSchema : portfolioSchema;
      const parsed = schema.safeParse(single ? bundles[0] : buildPortfolio(bundles));
      if (!parsed.success) {
        fail(`Le document produit est invalide :\n${parsed.error.message}`);
      }

      if (opts.out) {
        await writeFile(resolve(opts.out), `${JSON.stringify(parsed.data, null, 2)}\n`, "utf8");
        process.stderr.write(`  ${pc.green("✓")} bundle écrit dans ${pc.bold(opts.out)}\n`);
      }

      if (opts.html || opts.pdf) {
        const html =
          "kind" in parsed.data
            ? renderHtmlPortfolio(parsed.data)
            : renderHtmlAttestation(parsed.data);

        if (opts.html) {
          await writeFile(resolve(opts.html), html, "utf8");
          process.stderr.write(`  ${pc.green("✓")} attestation écrite dans ${pc.bold(opts.html)}\n`);
        }

        if (opts.pdf) {
          try {
            await htmlToPdf(html, resolve(opts.pdf));
            process.stderr.write(`  ${pc.green("✓")} PDF écrit dans ${pc.bold(opts.pdf)}\n`);
            if (!opts.html) {
              process.stderr.write(
                `  ${pc.yellow("!")} ${pc.dim("le PDF se lit mais ne se vérifie pas — ajoutez --html pour la version réfutable")}\n`,
              );
            }
          } catch (error) {
            if (error instanceof NoBrowserError) fail(error.message);
            throw error;
          }
        }
      }

      if (opts.json) process.stdout.write(`${JSON.stringify(parsed.data, null, 2)}\n`);
      else if ("kind" in parsed.data)
        for (const b of parsed.data.attestations)
          process.stdout.write(`${renderBundle(b)}\n`);
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
  .argument("<attestation>", "attestation à vérifier (.json ou .html)")
  .argument("[chemins...]", "dépôt(s) à confronter")
  .action(async (bundlePath: string, chemins: string[]) => {
    let raw: string;
    try {
      raw = await readFile(resolve(bundlePath), "utf8");
    } catch {
      fail(`Attestation introuvable : ${bundlePath}`);
    }

    // Une attestation HTML embarque son bundle : le fichier HTML *est*
    // l'attestation, pas une image de celle-ci.
    const embedded = /<script type="application\/json" id="recade-bundle">([\s\S]*?)<\/script>/.exec(
      raw,
    );
    const source = embedded?.[1] ?? raw;

    let json: unknown;
    try {
      json = JSON.parse(source.replaceAll("\\u003c", "<"));
    } catch {
      fail(
        `${bundlePath} ne contient pas d'attestation lisible.\n` +
          `    Attendu : un bundle JSON, ou un HTML produit par « recade scan --html ».`,
      );
    }

    const paths = chemins.length > 0 ? chemins : ["."];
    const roots: string[] = [];
    for (const p of paths) roots.push(await resolveRoot(p));

    const asPortfolio = portfolioSchema.safeParse(json);
    if (asPortfolio.success) {
      const results = await verifyPortfolio(roots, asPortfolio.data);
      process.stdout.write(`${renderPortfolioVerification(results)}\n`);
      if (results.some((r) => r.verification?.verdict === "réfutée")) process.exitCode = 1;
      return;
    }

    const parsed = bundleSchema.safeParse(json);
    if (!parsed.success) {
      fail(`Document malformé — ni attestation ni dossier au schéma v1 :\n${parsed.error.message}`);
    }

    const result = await verifyBundle(roots[0]!, parsed.data);
    process.stdout.write(`${renderVerification(result)}\n`);
    if (result.verdict === "réfutée") process.exitCode = 1;
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
