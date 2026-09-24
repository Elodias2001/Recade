import type { Bundle, LanguageVolume, Portfolio, Signature } from "./schema.js";

/**
 * Réunit plusieurs attestations en un dossier et en calcule les cumuls.
 *
 * Aucun cumul n'est une moyenne ni une estimation : ce sont des sommes de
 * compteurs eux-mêmes réfutables. Si une attestation du dossier tombe, le cumul
 * tombe avec elle — c'est voulu.
 */
export function buildPortfolio(attestations: readonly Bundle[]): Portfolio {
  if (attestations.length === 0) {
    throw new Error("Un dossier ne peut pas être vide.");
  }

  // Une même signature apparaît dans plusieurs dépôts : on l'additionne une
  // seule fois par couple (nom, adresse).
  const bySignature = new Map<string, Signature>();
  for (const bundle of attestations) {
    for (const sig of bundle.contribution.signatures) {
      const key = `${sig.name}\u0000${sig.email}`;
      const seen = bySignature.get(key);
      bySignature.set(
        key,
        seen ? { ...seen, commits: seen.commits + sig.commits } : { ...sig },
      );
    }
  }

  const volume = new Map<string, number>();
  for (const bundle of attestations) {
    for (const v of bundle.volume) {
      volume.set(v.language, (volume.get(v.language) ?? 0) + v.lines);
    }
  }

  const dates = attestations.flatMap((b) => [
    b.contribution.firstCommitDate,
    b.contribution.lastCommitDate,
  ]);

  return {
    schemaVersion: 1,
    kind: "portfolio",
    generatedAt: new Date().toISOString(),
    holder: {
      signatures: [...bySignature.values()].sort((a, b) => b.commits - a.commits),
    },
    totals: {
      repositories: attestations.length,
      leading: attestations.filter((b) => b.contribution.rank === 1).length,
      commits: sum(attestations.map((b) => b.contribution.commits)),
      mergesIntegrated: sum(attestations.map((b) => b.contribution.mergesIntegrated)),
      firstCommitDate: dates.reduce((a, b) => (a < b ? a : b)),
      lastCommitDate: dates.reduce((a, b) => (a > b ? a : b)),
      volume: [...volume.entries()]
        .map(([language, lines]): LanguageVolume => ({ language, lines }))
        .sort((a, b) => b.lines - a.lines),
    },
    attestations: [...attestations].sort((a, b) =>
      b.contribution.commits - a.contribution.commits,
    ),
  };
}

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);
