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
import { countLinesAtRev, detectStackAtRev, filesAtRev, readCommits } from "./scan.js";
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

  // --- 4. Volume et stack, recalculés dans l'arbre du commit d'ancrage ---
  const notVerified: string[] = [];

  if (bundle.volume.length > 0) {
    const volume = await countLinesAtRev(root, repo.headSha);
    const found = new Map(volume.map((v) => [v.language, v.lines]));
    for (const claimed of bundle.volume) {
      const real = found.get(claimed.language) ?? 0;
      checks.push(eq(`Lignes ${claimed.language}`, claimed.lines, real));
    }
    const extra = volume.filter((v) => !bundle.volume.some((c) => c.language === v.language));
    for (const v of extra) {
      checks.push({
        label: `Lignes ${v.language}`,
        status: "divergent",
        claimed: "non déclaré",
        found: String(v.lines),
      });
    }
  } else {
    notVerified.push("Volume du dépôt");
  }

  const files = await filesAtRev(root, repo.headSha);
  const stack = await detectStackAtRev(root, repo.headSha, files);
  const claimedStack = [...bundle.stack].sort();
  const sameStack =
    claimedStack.length === stack.length && claimedStack.every((v, i) => v === stack[i]);
  checks.push({
    label: "Stack détectée",
    status: sameStack ? "ok" : "divergent",
    claimed: claimedStack.join(" · ") || "aucune",
    found: stack.join(" · ") || "aucune",
  });

  const verdict = checks.every((c) => c.status === "ok") ? "confirmée" : "réfutée";

  return { repositoryName: repo.name, checks, verdict, notVerified };
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

export interface PortfolioVerification {
  readonly repositoryName: string;
  readonly verification: Verification | null;
  /** Renseigné quand aucun dépôt fourni ne contient le commit d'ancrage. */
  readonly unreachable?: string;
}

/**
 * Vérifie un dossier contre les dépôts qu'on veut bien lui présenter.
 *
 * Chaque attestation retrouve **son** dépôt par son commit d'ancrage, pas par
 * son nom : un dossier peut être renommé, un SHA non.
 *
 * Une attestation dont le dépôt n'est pas fourni n'est pas un échec — c'est le
 * cas normal. Un recruteur n'a accès qu'à une partie des dépôts, parfois
 * aucun. On distingue « réfuté » de « non vérifiable ici », parce que les
 * confondre reviendrait à accuser à tort.
 */
export async function verifyPortfolio(
  roots: readonly string[],
  portfolio: { attestations: readonly Bundle[] },
): Promise<PortfolioVerification[]> {
  const results: PortfolioVerification[] = [];

  for (const bundle of portfolio.attestations) {
    let matched: string | null = null;
    for (const root of roots) {
      if (await objectExists(root, bundle.repository.headSha)) {
        matched = root;
        break;
      }
    }

    if (!matched) {
      results.push({
        repositoryName: bundle.repository.name,
        verification: null,
        unreachable: bundle.repository.remote ?? "dépôt non fourni",
      });
      continue;
    }

    results.push({
      repositoryName: bundle.repository.name,
      verification: await verifyBundle(matched, bundle),
    });
  }

  return results;
}
