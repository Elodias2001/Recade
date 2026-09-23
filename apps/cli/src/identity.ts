import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { gitLines } from "./git.js";

/** Une signature d'auteur telle qu'elle apparaît dans l'historique. */
export interface Author {
  readonly name: string;
  readonly email: string;
  readonly commits: number;
}

/** Plusieurs signatures qu'on a des raisons de croire être la même personne. */
export interface AuthorGroup {
  /** Clé de regroupement : l'adresse normalisée la plus fréquente. */
  readonly key: string;
  readonly signatures: readonly Author[];
  readonly commits: number;
}

export interface IdentityConfig {
  readonly version: 1;
  /** Adresses qui sont les miennes, normalisées en minuscules. */
  readonly emails: readonly string[];
  /** Noms qui sont les miens, pour les commits faits sous une adresse de machine. */
  readonly names: readonly string[];
}

const CONFIG_DIR = join(homedir(), ".recade");
const CONFIG_PATH = join(CONFIG_DIR, "identities.json");

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();
export const normalizeName = (name: string): string => name.trim();

/**
 * Relève toutes les signatures de l'historique, toutes références confondues.
 *
 * Séparateur NUL entre les champs : un nom d'auteur peut contenir à peu près
 * n'importe quoi — « Elodias ADIMOU - TCM » contient déjà un tiret et des
 * espaces — mais jamais un NUL ni un saut de ligne.
 */
export async function collectAuthors(root: string): Promise<Author[]> {
  const lines = await gitLines(root, ["log", "--all", "--format=%an%x00%ae"]);

  const tally = new Map<string, { name: string; email: string; commits: number }>();
  for (const line of lines) {
    const sep = line.indexOf("\0");
    if (sep === -1) continue;
    const name = normalizeName(line.slice(0, sep));
    const email = normalizeEmail(line.slice(sep + 1));
    const key = `${name}\0${email}`;
    const seen = tally.get(key);
    if (seen) seen.commits += 1;
    else tally.set(key, { name, email, commits: 1 });
  }

  return [...tally.values()].sort((a, b) => b.commits - a.commits);
}

/**
 * Regroupe les signatures qui se recouvrent, par adresse **ou** par nom.
 *
 * Sur CIR, `elodias-dev` et `Elodias ADIMOU - TCM` partagent une adresse ;
 * `Elodias TCM <elodiastcm@MacBook-Pro-de-Elodias.local>` ne partage que le
 * début du nom. On propose le rapprochement, on ne le décide pas : c'est à
 * l'utilisateur de confirmer.
 */
export function groupAuthors(authors: readonly Author[]): AuthorGroup[] {
  const parent = new Map<number, number>();
  const find = (i: number): number => {
    let r = i;
    while (parent.get(r) !== undefined && parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  const union = (a: number, b: number): void => {
    const [ra, rb] = [find(a), find(b)];
    if (ra !== rb) parent.set(rb, ra);
  };

  authors.forEach((_, i) => parent.set(i, i));

  const byEmail = new Map<string, number>();
  const byName = new Map<string, number>();
  authors.forEach((a, i) => {
    const e = byEmail.get(a.email);
    if (e !== undefined) union(e, i);
    else byEmail.set(a.email, i);

    const n = byName.get(a.name.toLowerCase());
    if (n !== undefined) union(n, i);
    else byName.set(a.name.toLowerCase(), i);
  });

  const buckets = new Map<number, Author[]>();
  authors.forEach((a, i) => {
    const root = find(i);
    const bucket = buckets.get(root);
    if (bucket) bucket.push(a);
    else buckets.set(root, [a]);
  });

  return [...buckets.values()]
    .map((signatures) => {
      const commits = signatures.reduce((sum, s) => sum + s.commits, 0);
      const dominant = [...signatures].sort((a, b) => b.commits - a.commits)[0]!;
      return { key: dominant.email, signatures, commits };
    })
    .sort((a, b) => b.commits - a.commits);
}

/** Vrai si cette signature appartient à l'utilisateur, d'après sa configuration. */
export function matchesIdentity(author: Author, config: IdentityConfig): boolean {
  if (config.emails.includes(normalizeEmail(author.email))) return true;
  const name = normalizeName(author.name).toLowerCase();
  return config.names.some((n) => normalizeName(n).toLowerCase() === name);
}

export async function loadIdentityConfig(): Promise<IdentityConfig | null> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !Array.isArray((parsed as { emails?: unknown }).emails)
    ) {
      return null;
    }
    const obj = parsed as { emails: unknown[]; names?: unknown[] };
    return {
      version: 1,
      emails: obj.emails.filter((e): e is string => typeof e === "string").map(normalizeEmail),
      names: (obj.names ?? []).filter((n): n is string => typeof n === "string").map(normalizeName),
    };
  } catch {
    return null;
  }
}

export async function saveIdentityConfig(config: IdentityConfig): Promise<string> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return CONFIG_PATH;
}

export const identityConfigPath = CONFIG_PATH;
