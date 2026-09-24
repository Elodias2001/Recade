import { describe, expect, it } from "vitest";
import { buildPortfolio } from "./portfolio.js";
import { portfolioSchema, type Bundle } from "./schema.js";

function bundle(over: {
  name: string;
  commits: number;
  rank: number;
  merges?: number;
  first: string;
  last: string;
  signatures?: Bundle["contribution"]["signatures"];
  volume?: Bundle["volume"];
}): Bundle {
  return {
    schemaVersion: 1,
    generatedAt: "2026-09-24T10:00:00.000Z",
    repository: {
      name: over.name,
      headSha: `${over.name}-head`,
      firstCommitSha: `${over.name}-root`,
      firstCommitDate: over.first,
      lastCommitDate: over.last,
      totalCommits: over.commits * 2,
      contributors: 3,
      trackedFiles: 100,
      remote: null,
    },
    contribution: {
      signatures: over.signatures ?? [{ name: "moi", email: "moi@x.io", commits: over.commits }],
      commits: over.commits,
      rank: over.rank,
      firstCommitDate: over.first,
      lastCommitDate: over.last,
      mergesIntegrated: over.merges ?? 0,
      mergeShas: [],
    },
    volume: over.volume ?? [{ language: "TypeScript", lines: 1000 }],
    stack: ["Hono"],
  };
}

describe("buildPortfolio", () => {
  const trois = [
    bundle({ name: "cir", commits: 1025, rank: 1, merges: 185, first: "2025-11-12", last: "2026-09-22" }),
    bundle({ name: "gcw", commits: 533, rank: 1, merges: 31, first: "2026-04-17", last: "2026-09-10" }),
    bundle({ name: "live", commits: 125, rank: 3, merges: 14, first: "2026-03-10", last: "2026-04-10" }),
  ];

  it("somme les commits et les fusions", () => {
    const p = buildPortfolio(trois);
    expect(p.totals.commits).toBe(1683);
    expect(p.totals.mergesIntegrated).toBe(230);
  });

  it("compte les dépôts où l'on est premier contributeur", () => {
    expect(buildPortfolio(trois).totals.leading).toBe(2);
  });

  it("étend la période du plus ancien au plus récent, tous dépôts confondus", () => {
    const p = buildPortfolio(trois);
    expect(p.totals.firstCommitDate).toBe("2025-11-12");
    expect(p.totals.lastCommitDate).toBe("2026-09-22");
  });

  it("n'additionne une signature qu'une fois par couple nom/adresse", () => {
    // La même personne contribue aux deux dépôts sous la même signature :
    // le dossier doit afficher 30, pas deux lignes de 10 et 20.
    const p = buildPortfolio([
      bundle({
        name: "a",
        commits: 10,
        rank: 1,
        first: "2026-01-01",
        last: "2026-02-01",
        signatures: [{ name: "moi", email: "moi@x.io", commits: 10 }],
      }),
      bundle({
        name: "b",
        commits: 20,
        rank: 1,
        first: "2026-03-01",
        last: "2026-04-01",
        signatures: [{ name: "moi", email: "moi@x.io", commits: 20 }],
      }),
    ]);

    expect(p.holder.signatures).toHaveLength(1);
    expect(p.holder.signatures[0]?.commits).toBe(30);
  });

  it("cumule les volumes par langage", () => {
    const p = buildPortfolio([
      bundle({
        name: "a",
        commits: 1,
        rank: 1,
        first: "2026-01-01",
        last: "2026-01-02",
        volume: [
          { language: "TypeScript", lines: 100 },
          { language: "PHP", lines: 40 },
        ],
      }),
      bundle({
        name: "b",
        commits: 1,
        rank: 1,
        first: "2026-01-01",
        last: "2026-01-02",
        volume: [{ language: "TypeScript", lines: 250 }],
      }),
    ]);

    expect(p.totals.volume[0]).toEqual({ language: "TypeScript", lines: 350 });
    expect(p.totals.volume[1]).toEqual({ language: "PHP", lines: 40 });
  });

  it("classe les plateformes de la plus contributive à la moins", () => {
    const p = buildPortfolio(trois);
    expect(p.attestations.map((b) => b.repository.name)).toEqual(["cir", "gcw", "live"]);
  });

  it("produit un dossier conforme au schéma", () => {
    expect(portfolioSchema.safeParse(buildPortfolio(trois)).success).toBe(true);
  });

  it("refuse un dossier vide", () => {
    expect(() => buildPortfolio([])).toThrow(/vide/);
  });
});
