import { git, gitLines } from "./git.js";
import {
  collectAuthors,
  groupAuthors,
  matchesIdentity,
  normalizeEmail,
  normalizeName,
  type Author,
  type IdentityConfig,
} from "./identity.js";
import { readCommits } from "./scan.js";
import type { Bundle } from "./schema.js";

export type CheckStatus = "ok" | "divergent" | "absent";

export interface Check {
  readonly label: string;
  readonly status: CheckStatus;
  /** Ce que l'attestation affirme. */
  readonly claimed: string;
  /** Ce que le dépôt dit réellement. */
  readonly found: string;
}

export interface Verification {
  readonly repositoryName: string;
  readonly checks: readonly Check[];
  readonly verdict: "confirmée" | "réfutée";
  /** Compteurs que cette version ne sait pas encore recalculer. */
  readonly notVerified: readonly string[];
}

const eq = (label: string, claimed: number, found: number): Check => ({
  label,
  status: claimed === found ? "ok" : "divergent",
  claimed: String(claimed),
  found: String(found),
});

/**
 * Recalcule une attestation à partir du dépôt et la confronte à ce qu'elle
 * affirme.
 *
 * Point capital : la vérification s'appuie sur les **signatures déclarées dans
 * le bundle**, jamais sur la configuration locale. Un recruteur qui n'a jamais
 * lancé Récade doit pouvoir vérifier sans rien configurer.
 *
 * Tout est recalculé depuis `headSha`, pas depuis l'état courant du dépôt :
 * l'attestation décrit un instant précis, et cet instant reste vérifiable même
 * si le projet a continué d'avancer depuis.
 */
export async function verifyBundle(root: string, bundle: Bundle): Promise<Verification> {
  const { repository: repo, contribution: claim } = bundle;
  const checks: Check[] = [];

  // --- 1. Le dépôt est-il bien celui décrit ? ---
  const headExists = await objectExists(root, repo.headSha);
  if (!headExists) {
    return {
      repositoryName: repo.name,
      verdict: "réfutée",
      notVerified: [],
      checks: [
        {
          label: "Commit d'ancrage",
          status: "absent",
          claimed: repo.headSha.slice(0, 10),
          found: "introuvable dans ce dépôt",
        },
      ],
    };
  }

  const rootExists = await objectExists(root, repo.firstCommitSha);
  checks.push({
    label: "Premier commit",
    status: rootExists ? "ok" : "absent",
    claimed: repo.firstCommitSha.slice(0, 10),
    found: rootExists ? repo.firstCommitSha.slice(0, 10) : "introuvable",
  });

  // --- 2. Recompte depuis l'ancrage, avec les signatures déclarées ---
  const identity: IdentityConfig = {
    version: 1,
    emails: claim.signatures.map((s) => normalizeEmail(s.email)),
    names: claim.signatures.map((s) => normalizeName(s.name)),
  };

  const commits = await readCommits(root, repo.headSha);
  const authors = await collectAuthors(root, repo.headSha);
  const groups = groupAuthors(authors);
  const mine = commits.filter((c) => matchesIdentity(c.author, identity));

  checks.push(eq("Commits du dépôt", repo.totalCommits, commits.length));
  checks.push(eq("Contributeurs", repo.contributors, groups.length));
  checks.push(eq("Commits signés", claim.commits, mine.length));

  const others = groups.filter((g) => !g.signatures.some((s) => matchesIdentity(s, identity)));
  const rank = others.filter((g) => g.commits > mine.length).length + 1;
  checks.push(eq("Rang", claim.rank, rank));

  // --- 3. Chaque fusion revendiquée existe-t-elle vraiment ? ---
  const mergeLines = await gitLines(root, [
    "log",
    repo.headSha,
    "--merges",
    "--format=%H%x00%ae%x00%an",
  ]);
  const realMerges = new Set<string>();
  for (const line of mergeLines) {
    const [sha, email, name] = line.split("\0");
    if (!sha || email === undefined || name === undefined) continue;
    const author: Author = { name: name.trim(), email: email.trim().toLowerCase(), commits: 1 };
    if (matchesIdentity(author, identity)) realMerges.add(sha);
  }

  const claimedMerges = new Set(claim.mergeShas);
  const fabricated = [...claimedMerges].filter((sha) => !realMerges.has(sha));

  checks.push({
    label: "Fusions revendiquées",
    status: fabricated.length === 0 && claimedMerges.size === claim.mergesIntegrated ? "ok" : "divergent",
    claimed: `${claim.mergesIntegrated} (${claimedMerges.size} SHA)`,
    found:
      fabricated.length > 0
        ? `${realMerges.size} réelles · ${fabricated.length} SHA non retrouvés`
        : `${realMerges.size} réelles`,
  });

  if (claimedMerges.size !== realMerges.size) {
    checks.push(eq("Fusions recomptées", claim.mergesIntegrated, realMerges.size));
  }

  const verdict = checks.every((c) => c.status === "ok") ? "confirmée" : "réfutée";

  return {
    repositoryName: repo.name,
    checks,
    verdict,
    // Le volume est mesuré sur l'arbre de travail au moment du scan. Le
    // recalculer exigerait de relire l'arbre du commit d'ancrage — prévu, mais
    // pas encore fait. On le dit plutôt que de laisser croire qu'il est vérifié.
    notVerified: bundle.volume.length > 0 ? ["Volume du dépôt", "Stack détectée"] : ["Stack détectée"],
  };
}

async function objectExists(root: string, sha: string): Promise<boolean> {
  if (!/^[0-9a-f]{7,40}$/i.test(sha)) return false;
  try {
    const type = await git(root, ["cat-file", "-t", sha]);
    return type.trim() === "commit";
  } catch {
    return false;
  }
}
