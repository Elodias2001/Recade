import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scanRepository } from "./scan.js";
import { verifyBundle } from "./verify.js";
import type { Bundle, IdentityConfig } from "./schema.js";

/**
 * Tests d'intégration : un vrai dépôt Git, fabriqué puis mesuré.
 *
 * Les tests unitaires couvrent le regroupement d'identités et les cumuls, mais
 * `scan` et `verify` ne touchaient jusqu'ici aucun dépôt. Or ce sont eux qui
 * produisent les chiffres publiés : un outil de preuve dont le moteur n'est pas
 * testé de bout en bout ne vaut pas grand-chose.
 */

const run = promisify(execFile);

/** Dates fixes : sans elles, les périodes du bundle varieraient à chaque essai. */
const DATE = "2026-01-15T10:00:00+01:00";

async function git(cwd: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<string> {
  const { stdout } = await run("git", args, {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: DATE,
      GIT_COMMITTER_DATE: DATE,
      GIT_CONFIG_NOSYSTEM: "1",
      HOME: cwd, // isole du ~/.gitconfig de la machine
      ...env,
    },
  });
  return stdout;
}

async function commit(
  cwd: string,
  opts: { name: string; email: string; message: string; files?: Record<string, string> },
): Promise<void> {
  for (const [path, content] of Object.entries(opts.files ?? {})) {
    const full = join(cwd, path);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, content, "utf8");
  }
  await git(cwd, ["add", "-A"]);
  await git(cwd, [
    "-c",
    "commit.gpgsign=false",
    "-c",
    `user.name=${opts.name}`,
    "-c",
    `user.email=${opts.email}`,
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    opts.message,
  ]);
}

const ligne = (n: number): string => `${Array.from({ length: n }, (_, i) => `const x${i} = ${i};`).join("\n")}\n`;

let repo: string;

/**
 * Le dépôt de référence reproduit les cas réels rencontrés sur CIR :
 * deux signatures pour une même personne, un tiers, du code vendorisé,
 * un fichier de verrouillage, et une fusion.
 */
beforeAll(async () => {
  repo = await mkdtemp(join(tmpdir(), "recade-it-"));
  await git(repo, ["init", "-q", "-b", "main"]);

  // 3 commits sous la première signature
  await commit(repo, {
    name: "moi-dev",
    email: "moi@exemple.io",
    message: "feat: départ",
    files: { "src/a.ts": ligne(10), "package.json": '{"dependencies":{"hono":"^4"}}\n' },
  });
  await commit(repo, {
    name: "moi-dev",
    email: "moi@exemple.io",
    message: "feat: suite",
    files: { "src/b.ts": ligne(20) },
  });
  await commit(repo, {
    name: "moi-dev",
    email: "moi@exemple.io",
    message: "feat: encore",
    files: { "src/c.ts": ligne(5) },
  });

  // 2 commits sous une SECONDE signature, même adresse : doit fusionner
  await commit(repo, {
    name: "Moi ADIMOU - TCM",
    email: "moi@exemple.io",
    message: "feat: autre machine",
    files: { "src/d.ts": ligne(15) },
  });
  await commit(repo, {
    name: "Moi ADIMOU - TCM",
    email: "moi@exemple.io",
    message: "chore: bruit",
    files: {
      "pnpm-lock.yaml": ligne(5000), // verrouillage : ne doit pas compter
      "vendor/tiers/gros.ts": ligne(9000), // vendorisé : ne doit pas compter
      "vendor/tiers/go.mod": "module tiers\n", // ne doit pas faire attester « Go »
    },
  });

  // 1 commit d'un tiers
  await commit(repo, {
    name: "Quelqu'un",
    email: "autre@exemple.io",
    message: "fix: correctif",
    files: { "src/e.ts": ligne(8) },
  });

  // une fusion, sous ma signature
  await git(repo, ["checkout", "-q", "-b", "sujet"]);
  await commit(repo, {
    name: "moi-dev",
    email: "moi@exemple.io",
    message: "feat: branche",
    files: { "src/f.ts": ligne(12) },
  });
  await git(repo, ["checkout", "-q", "main"]);
  await git(repo, [
    "-c",
    "commit.gpgsign=false",
    "-c",
    "user.name=moi-dev",
    "-c",
    "user.email=moi@exemple.io",
    "merge",
    "-q",
    "--no-ff",
    "sujet",
    "-m",
    "Merge branch 'sujet'",
  ]);

  // une branche JAMAIS fusionnée : ne doit pas être comptée
  await git(repo, ["checkout", "-q", "-b", "abandonnee"]);
  await commit(repo, {
    name: "moi-dev",
    email: "moi@exemple.io",
    message: "wip: abandonné",
    files: { "src/z.ts": ligne(999) },
  });
  await git(repo, ["checkout", "-q", "main"]);
}, 60_000);

afterAll(async () => {
  if (repo) await rm(repo, { recursive: true, force: true });
});

const moi: IdentityConfig = { version: 1, emails: ["moi@exemple.io"], names: [] };

async function scan(): Promise<Bundle> {
  return scanRepository({ root: repo, identity: moi });
}

describe("scan sur un dépôt réel", () => {
  it("compte les commits depuis HEAD, sans les branches abandonnées", async () => {
    const b = await scan();
    // 7 commits + 1 fusion = 8 sur main. Le commit « wip » ne compte pas.
    expect(b.repository.totalCommits).toBe(8);
    expect(b.contribution.commits).toBe(7); // tout sauf celui du tiers
  });

  it("fusionne les deux signatures d'une même personne", async () => {
    const b = await scan();
    expect(b.contribution.signatures).toHaveLength(2);
    expect(b.contribution.signatures.map((s) => s.name).sort()).toEqual([
      "Moi ADIMOU - TCM",
      "moi-dev",
    ]);
    expect(b.repository.contributors).toBe(2); // moi + le tiers
    expect(b.contribution.rank).toBe(1);
  });

  it("compte les fusions intégrées et en garde les SHA", async () => {
    const b = await scan();
    expect(b.contribution.mergesIntegrated).toBe(1);
    expect(b.contribution.mergeShas).toHaveLength(1);
    expect(b.contribution.mergeShas[0]).toMatch(/^[0-9a-f]{40}$/);
  });

  it("écarte le code vendorisé et les fichiers de verrouillage du volume", async () => {
    const b = await scan();
    const ts = b.volume.find((v) => v.language === "TypeScript")?.lines ?? 0;
    // a(10) + b(20) + c(5) + d(15) + e(8) + f(12) = 70 lignes.
    // Les 9 000 lignes vendorisées et les 5 000 du lock sont exclues.
    expect(ts).toBe(70);
    expect(b.volume.find((v) => v.language === "YAML")).toBeUndefined();
  });

  it("n'atteste pas une technologie qui n'est que vendorisée", async () => {
    const b = await scan();
    expect(b.stack).toContain("Hono");
    expect(b.stack).not.toContain("Go"); // le go.mod est sous vendor/
  });

  it("mesure l'arbre du commit, pas le dossier de travail", async () => {
    // LE test qui protège la reproductibilité. On salit un fichier **suivi** :
    // une implémentation qui lit le disque compterait les 5 000 lignes, alors
    // qu'elles ne sont dans aucun commit. Un fichier simplement non suivi ne
    // suffirait pas à démasquer l'erreur — `git ls-files` ne l'aurait pas listé
    // non plus.
    const avant = await scan();
    const suivi = join(repo, "src", "a.ts");
    const original = await readFile(suivi, "utf8");

    await writeFile(suivi, ligne(5000), "utf8");
    const saleSuivi = await scan();

    await writeFile(join(repo, "src", "jamais-ajoute.ts"), ligne(3000), "utf8");
    const saleNonSuivi = await scan();

    await writeFile(suivi, original, "utf8");
    await rm(join(repo, "src", "jamais-ajoute.ts"), { force: true });

    expect(saleSuivi.volume).toEqual(avant.volume);
    expect(saleNonSuivi.volume).toEqual(avant.volume);
    expect(saleNonSuivi.repository.trackedFiles).toBe(avant.repository.trackedFiles);
  });

  it("refuse de compter quand aucune identité ne correspond", async () => {
    await expect(
      scanRepository({ root: repo, identity: { version: 1, emails: ["inconnu@x.io"], names: [] } }),
    ).rejects.toThrow(/Aucun commit ne correspond/);
  });
});

describe("verify sur un dépôt réel", () => {
  it("confirme une attestation authentique", async () => {
    const v = await verifyBundle(repo, await scan());
    expect(v.verdict).toBe("confirmée");
    expect(v.checks.every((c) => c.status === "ok")).toBe(true);
  });

  it("réfute des commits gonflés", async () => {
    const b = await scan();
    b.contribution.commits = 999;
    const v = await verifyBundle(repo, b);
    expect(v.verdict).toBe("réfutée");
    expect(v.checks.find((c) => c.label === "Commits signés")?.status).toBe("divergent");
  });

  it("réfute une fusion fabriquée", async () => {
    const b = await scan();
    b.contribution.mergeShas = ["0".repeat(40)];
    b.contribution.mergesIntegrated = 1;
    const v = await verifyBundle(repo, b);
    expect(v.verdict).toBe("réfutée");
  });

  it("réfute un volume gonflé", async () => {
    const b = await scan();
    b.volume = [{ language: "TypeScript", lines: 500_000 }];
    const v = await verifyBundle(repo, b);
    expect(v.verdict).toBe("réfutée");
  });

  it("réfute une pile inventée", async () => {
    const b = await scan();
    b.stack = [...b.stack, "Kubernetes"];
    const v = await verifyBundle(repo, b);
    expect(v.verdict).toBe("réfutée");
  });

  it("signale un ancrage introuvable plutôt que de recompter à côté", async () => {
    const b = await scan();
    b.repository.headSha = "f".repeat(40);
    const v = await verifyBundle(repo, b);
    expect(v.verdict).toBe("réfutée");
    expect(v.checks[0]?.status).toBe("absent");
  });

  it("vérifie sans la configuration locale, depuis les seules signatures du bundle", async () => {
    // Un tiers n'a jamais lancé « whoami » : la vérification doit tenir debout
    // avec ce que porte l'attestation, et rien d'autre.
    const b = await scan();
    expect(b.contribution.signatures.length).toBeGreaterThan(0);
    const v = await verifyBundle(repo, b);
    expect(v.verdict).toBe("confirmée");
  });
});
