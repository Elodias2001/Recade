import { basename } from "node:path";
import { git, gitLines, hasCommits } from "./git.js";
import {
  collectAuthors,
  groupAuthors,
  matchesIdentity,
  type Author,
  type IdentityConfig,
} from "./identity.js";
import type { Bundle, LanguageVolume } from "./schema.js";

export interface Commit {
  readonly sha: string;
  readonly date: string;
  readonly author: Author;
}

/** Fichiers dont les lignes ne prouvent rien : générés, verrouillés, minifiés. */
const EXCLUDED_BASENAMES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "bun.lockb",
  "composer.lock",
  "Cargo.lock",
  "poetry.lock",
  "go.sum",
  "Gemfile.lock",
]);

const EXCLUDED_PATTERNS = [/\.min\.(js|css)$/i, /\.map$/i, /(^|\/)(dist|build)\//i];

/**
 * Code de tiers embarqué dans le dépôt. Il ne prouve rien sur son auteur : CIR
 * embarque un plugin Traefik en Go, et le compter ferait attester « Go » à
 * quelqu'un qui n'a jamais écrit une ligne de Go. Un faux positif sur une
 * attestation coûte plus cher qu'un oubli.
 */
const VENDORED_SEGMENTS = new Set([
  "vendor",
  "vendored",
  "third_party",
  "thirdparty",
  "node_modules",
  "Godeps",
  "github.com",
  "gopkg.in",
  "golang.org",
  "gitlab.com",
  "bitbucket.org",
]);

function isVendored(path: string): boolean {
  return path.split("/").some((segment) => VENDORED_SEGMENTS.has(segment));
}

const LANGUAGES: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  vue: "Vue",
  svelte: "Svelte",
  php: "PHP",
  py: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  java: "Java",
  kt: "Kotlin",
  swift: "Swift",
  c: "C",
  h: "C",
  cpp: "C++",
  cs: "C#",
  sql: "SQL",
  sh: "Shell",
  bash: "Shell",
  css: "CSS",
  scss: "CSS",
  html: "HTML",
  yml: "YAML",
  yaml: "YAML",
};

/** Indices de pile, lus dans les fichiers de manifeste — pas dans le code. */
const STACK_MARKERS: ReadonlyArray<readonly [file: string, marker: RegExp, label: string]> = [
  ["package.json", /"next"\s*:/, "Next.js"],
  ["package.json", /"react"\s*:/, "React"],
  ["package.json", /"hono"\s*:/, "Hono"],
  ["package.json", /"vue"\s*:/, "Vue"],
  ["package.json", /"nuxt"\s*:/, "Nuxt"],
  ["package.json", /"drizzle-orm"\s*:/, "Drizzle ORM"],
  ["package.json", /"prisma"\s*:/, "Prisma"],
  ["package.json", /"expo"\s*:/, "Expo"],
  ["package.json", /"tailwindcss"\s*:/, "Tailwind CSS"],
  ["composer.json", /laravel\/framework/, "Laravel"],
  ["Cargo.toml", /\[package\]/, "Rust"],
  ["go.mod", /^module /m, "Go"],
];

function extensionOf(path: string): string {
  const dot = path.lastIndexOf(".");
  const slash = path.lastIndexOf("/");
  return dot > slash ? path.slice(dot + 1).toLowerCase() : "";
}

function isCountable(path: string): boolean {
  if (isVendored(path)) return false;
  if (EXCLUDED_BASENAMES.has(basename(path))) return false;
  if (EXCLUDED_PATTERNS.some((re) => re.test(path))) return false;
  return LANGUAGES[extensionOf(path)] !== undefined;
}

export async function readCommits(root: string, rev: string): Promise<Commit[]> {
  const lines = await gitLines(root, ["log", rev, "--format=%H%x00%aI%x00%an%x00%ae"]);
  const commits: Commit[] = [];
  for (const line of lines) {
    const [sha, date, name, email] = line.split("\0");
    if (!sha || !date || name === undefined || email === undefined) continue;
    commits.push({
      sha,
      date,
      author: { name: name.trim(), email: email.trim().toLowerCase(), commits: 1 },
    });
  }
  return commits;
}

/**
 * Compte les lignes **dans l'arbre du commit**, jamais sur le disque.
 *
 * Un commit est une photographie scellée : `git grep -cI "" <sha>` compte les
 * lignes à l'intérieur de cette photo. Le dossier de travail, lui, contient du
 * non-commité — CIR a un dossier `spoon/` qui n'est dans aucun commit — et n'est
 * reproductible par personne d'autre.
 *
 * Bénéfice secondaire : Git compte juste. Découper le texte sur les sauts de
 * ligne en JavaScript renvoie toujours un morceau de trop, ce qui gonflait le
 * total de ~1 ligne par fichier (874 sur CIR).
 *
 * `-I` écarte les binaires, `-c ""` compte toutes les lignes.
 */
export async function countLinesAtRev(root: string, rev: string): Promise<LanguageVolume[]> {
  // `git grep` sort 1 quand rien ne correspond : ce n'est pas une erreur.
  const out = await git(root, ["grep", "-cI", "", rev]).catch(() => "");
  const totals = new Map<string, number>();

  for (const line of out.split("\n")) {
    if (line.length === 0) continue;
    // Format : <rev>:<chemin>:<nombre>. Le chemin peut contenir « : »,
    // on découpe donc par les extrémités, pas par split.
    const firstColon = line.indexOf(":");
    const lastColon = line.lastIndexOf(":");
    if (firstColon === -1 || lastColon <= firstColon) continue;

    const path = line.slice(firstColon + 1, lastColon);
    const count = Number.parseInt(line.slice(lastColon + 1), 10);
    if (!Number.isFinite(count) || !isCountable(path)) continue;

    const lang = LANGUAGES[extensionOf(path)]!;
    totals.set(lang, (totals.get(lang) ?? 0) + count);
  }

  return [...totals.entries()]
    .map(([language, lines]) => ({ language, lines }))
    .sort((a, b) => b.lines - a.lines);
}

/** Liste les chemins présents dans l'arbre du commit (et non dans l'index). */
export async function filesAtRev(root: string, rev: string): Promise<string[]> {
  return gitLines(root, ["ls-tree", "-r", "--name-only", rev]);
}

/** Lit un fichier **tel qu'il était dans le commit**, sans toucher au disque. */
async function showAtRev(root: string, rev: string, path: string): Promise<string | null> {
  return git(root, ["show", `${rev}:${path}`]).catch(() => null);
}

export async function detectStackAtRev(
  root: string,
  rev: string,
  files: readonly string[],
): Promise<string[]> {
  const found = new Set<string>();
  const own = files.filter((p) => !isVendored(p));
  const manifests = new Set(STACK_MARKERS.map(([file]) => file));
  const candidates = own.filter((p) => manifests.has(basename(p)));

  for (const path of candidates.slice(0, 40)) {
    const content = await showAtRev(root, rev, path);
    if (content === null) continue;
    for (const [file, marker, label] of STACK_MARKERS) {
      if (basename(path) === file && marker.test(content)) found.add(label);
    }
  }

  if (own.some((p) => /^(docker-compose|compose)[.\w-]*\.ya?ml$/i.test(basename(p))))
    found.add("Docker");
  if (own.some((p) => p.startsWith(".github/workflows/"))) found.add("GitHub Actions");

  return [...found].sort();
}

export interface ScanOptions {
  readonly root: string;
  readonly identity: IdentityConfig;
  readonly countLines?: boolean;
}

export async function scanRepository(options: ScanOptions): Promise<Bundle> {
  const { root, identity } = options;

  if (!(await hasCommits(root))) {
    throw new Error("Ce dépôt n'a aucun commit — il n'y a rien à attester.");
  }

  // Tout est compté depuis `headSha`, jamais depuis `--all` : les références
  // bougent et se suppriment, un SHA non. C'est ce qui rend `recade verify`
  // possible — sans cet ancrage, aucun chiffre n'est reproductible.
  const headSha = (await git(root, ["rev-parse", "HEAD"])).trim();

  const [commits, mergeShaLines, tracked] = await Promise.all([
    readCommits(root, headSha),
    gitLines(root, ["log", headSha, "--merges", "--format=%H%x00%ae%x00%an"]),
    filesAtRev(root, headSha),
  ]);

  const authors = await collectAuthors(root, headSha);
  const groups = groupAuthors(authors);

  const mine = commits.filter((c) => matchesIdentity(c.author, identity));
  if (mine.length === 0) {
    const known = authors
      .slice(0, 8)
      .map((a) => `  ${a.name} <${a.email}>`)
      .join("\n");
    throw new Error(
      `Aucun commit ne correspond à vos identités.\n\nAuteurs présents dans ce dépôt :\n${known}\n\n` +
        `Déclarez les vôtres avec « recade whoami --add <email> » ou « recade scan --me <email> ».`,
    );
  }

  const myMergeShas: string[] = [];
  for (const line of mergeShaLines) {
    const [sha, email, name] = line.split("\0");
    if (!sha || email === undefined || name === undefined) continue;
    const author: Author = { name: name.trim(), email: email.trim().toLowerCase(), commits: 1 };
    if (matchesIdentity(author, identity)) myMergeShas.push(sha);
  }

  const sortedDates = [...commits].sort((a, b) => a.date.localeCompare(b.date));
  const myDates = [...mine].sort((a, b) => a.date.localeCompare(b.date));

  // Le rang se calcule sur les identités regroupées, pas sur les signatures :
  // sinon quatre signatures d'une même personne la font passer 4ᵉ au lieu de 1ʳᵉ.
  const myGroupCommits = mine.length;
  const otherGroups = groups.filter(
    (g) => !g.signatures.some((s) => matchesIdentity(s, identity)),
  );
  const rank = otherGroups.filter((g) => g.commits > myGroupCommits).length + 1;

  const volume = options.countLines === false ? [] : await countLinesAtRev(root, headSha);
  const stack = await detectStackAtRev(root, headSha, tracked);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repository: {
      name: basename(root),
      headSha,
      firstCommitSha: sortedDates[0]!.sha,
      firstCommitDate: sortedDates[0]!.date,
      lastCommitDate: sortedDates[sortedDates.length - 1]!.date,
      totalCommits: commits.length,
      contributors: groups.length,
      trackedFiles: tracked.length,
    },
    contribution: {
      signatures: authors
        .filter((a) => matchesIdentity(a, identity))
        .map((a) => ({ name: a.name, email: a.email, commits: a.commits })),
      commits: mine.length,
      rank,
      firstCommitDate: myDates[0]!.date,
      lastCommitDate: myDates[myDates.length - 1]!.date,
      mergesIntegrated: myMergeShas.length,
      mergeShas: myMergeShas,
    },
    volume,
    stack,
  };
}
