import { describe, expect, it } from "vitest";
import { fingerprint, renderHtmlAttestation } from "./html.js";
import { bundleSchema, type Bundle } from "./schema.js";

const base: Bundle = {
  schemaVersion: 1,
  generatedAt: "2026-09-23T18:00:00.000Z",
  repository: {
    name: "cir-inventory-app",
    headSha: "5d950ae58297451ee04e2271e3bebabf34b0cdba",
    firstCommitSha: "457c7ce8ae0000000000000000000000000000aa",
    firstCommitDate: "2025-11-12T09:00:00.000Z",
    lastCommitDate: "2026-09-23T09:00:00.000Z",
    totalCommits: 1976,
    contributors: 7,
    trackedFiles: 1441,
  },
  contribution: {
    signatures: [{ name: "elodias-dev", email: "elodias@thecreativemind.io", commits: 592 }],
    commits: 1025,
    rank: 1,
    firstCommitDate: "2025-11-12T09:00:00.000Z",
    lastCommitDate: "2026-09-23T09:00:00.000Z",
    mergesIntegrated: 185,
    mergeShas: ["aaaa"],
  },
  volume: [{ language: "TypeScript", lines: 142228 }],
  stack: ["Hono", "Next.js"],
};

describe("fingerprint", () => {
  it("est déterministe : le même bundle grave le même sceau", () => {
    expect(fingerprint(base)).toBe(fingerprint(structuredClone(base)));
  });

  it("change dès qu'un compteur change", () => {
    const gonfle = structuredClone(base);
    gonfle.contribution.commits = 1800;
    expect(fingerprint(gonfle)).not.toBe(fingerprint(base));
  });
});

describe("renderHtmlAttestation", () => {
  it("échappe les noms d'auteur, qui viennent de Git et non de nous", () => {
    // Un nom d'auteur est arbitraire : quiconque commite dans un dépôt qu'on
    // scanne choisit le sien. Sans échappement, il injecte du HTML dans
    // l'attestation que la victime transmettra à un recruteur.
    const piege = structuredClone(base);
    piege.contribution.signatures = [
      { name: '<img src=x onerror="alert(1)">', email: "x@y.z", commits: 1 },
    ];

    const html = renderHtmlAttestation(piege);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });

  it("neutralise « < » dans le bundle embarqué pour ne pas refermer la balise", () => {
    const piege = structuredClone(base);
    piege.repository.name = "</script><script>alert(1)</script>";
    const html = renderHtmlAttestation(piege);
    const script = /<script type="application\/json" id="recade-bundle">([\s\S]*?)<\/script>/.exec(html);
    expect(script).not.toBeNull();
    expect(script?.[1]).not.toContain("</script>");
  });

  it("embarque un bundle relisible et conforme au schéma", () => {
    const html = renderHtmlAttestation(base);
    const script = /<script type="application\/json" id="recade-bundle">([\s\S]*?)<\/script>/.exec(html);
    const parsed = bundleSchema.safeParse(
      JSON.parse((script?.[1] ?? "").replaceAll("\\u003c", "<")),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.contribution.commits).toBe(1025);
  });

  it("ne référence aucune ressource distante", () => {
    const html = renderHtmlAttestation(base);
    expect(html).not.toMatch(/(src|href)="https?:/);
    expect(html).not.toContain("@import");
  });
});

describe("aucun chiffre sans sa preuve", () => {
  /**
   * Règle 2 d'AGENTS.md : un compteur sans le moyen de le recalculer n'a pas
   * sa place. Le type `Ligne` l'impose déjà au compilateur ; ce test couvre
   * le rendu, au cas où une ligne arriverait un jour par un autre chemin.
   */
  const html = renderHtmlAttestation(base);

  it("chaque ligne chiffrée porte une preuve dépliable", () => {
    const lignes = html.match(/<div class="r">/g) ?? [];
    const preuves = html.match(/<div class="preuve">/g) ?? [];
    const bascules = html.match(/class="bascule"/g) ?? [];
    expect(lignes.length).toBeGreaterThan(0);
    expect(preuves).toHaveLength(lignes.length);
    expect(bascules).toHaveLength(lignes.length);
  });

  it("aucune preuve n'est vide", () => {
    for (const m of html.matchAll(/<div class="preuve">([\s\S]*?)<\/div>/g)) {
      const texte = m[1] ?? "";
      expect(texte.trim().length).toBeGreaterThan(20);
    }
  });

  it("chaque preuve cite le commit d'ancrage ou les empreintes embarquées", () => {
    const court = base.repository.headSha.slice(0, 10);
    for (const m of html.matchAll(/<div class="preuve">([\s\S]*?)<\/div>/g)) {
      const texte = m[1] ?? "";
      expect(texte.includes(court) || /empreintes/.test(texte)).toBe(true);
    }
  });

  it("montre le commit d'ancrage ET celui du premier commit", () => {
    // firstCommitSha voyageait dans le bundle sans jamais être affiché :
    // verify s'en servait, le lecteur ne le voyait pas.
    expect(html).toContain(base.repository.headSha);
    expect(html).toContain(base.repository.firstCommitSha);
  });

  it("le dépliage ne coûte aucun script : tout passe par une case à cocher", () => {
    const executables = [...html.matchAll(/<script\b([^>]*)>/g)].filter(
      (m) => !/type="application\/json"/.test(m[1]!),
    );
    expect(executables).toHaveLength(0);
    expect(html).toContain('type="checkbox"');
  });

  it("tout est déplié à l'impression", () => {
    const print = html.match(/@media print\{[\s\S]*?\n  \}/)?.[0] ?? "";
    expect(print).toMatch(/\.preuve\{max-height:none/);
    expect(print).toMatch(/\.voir,\.bascule\{display:none\}/);
  });
});
