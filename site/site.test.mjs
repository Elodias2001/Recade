import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { auteur, contacts, pagesLegales, site } from "./config.mjs";
import { VIGNETTES } from "./og.mjs";

/**
 * Le site est bâti par `scripts/build-site.mjs` à partir de modules. On teste
 * donc le HTML tel qu'il est produit, sans avoir besoin d'un navigateur.
 *
 * Trois choses sont verrouillées ici parce qu'elles se cassent en silence :
 * le crédit du pied de page, les coordonnées, et l'absence de tiret cadratin
 * dans les textes visibles.
 */

const pages = {
  accueil: (await import("./pages/index.mjs")).default,
  apropos: (await import("./pages/a-propos.mjs")).default,
  mentions: (await import("./pages/mentions-legales.mjs")).default,
  confidentialite: (await import("./pages/confidentialite.mjs")).default,
};

const toutes = Object.entries(pages);
/** Retire les balises pour ne garder que ce qu'un visiteur lit réellement. */
const visible = (html) => html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]*>/g, " ");

describe("pied de page", () => {
  it.each(toutes)("%s porte le crédit et pointe vers À propos", (_, html) => {
    expect(html).toContain("Conçu &amp; développé par");
    expect(html).toContain(`<a href="/a-propos">${auteur.nom}</a>`);
  });

  it.each(toutes)("%s liste les pages légales", (_, html) => {
    for (const p of pagesLegales) expect(html).toContain(`href="${p.href}"`);
  });

  it("affiche l'année courante", () => {
    expect(pages.accueil).toContain(`© ${new Date().getFullYear()} ${site.nom}`);
  });
});

describe("page À propos", () => {
  it("porte les trois contacts, aux bonnes destinations", () => {
    expect(contacts).toHaveLength(3);
    for (const c of contacts) {
      expect(pages.apropos).toContain(`href="${c.href}"`);
      expect(pages.apropos).toContain(`>\n          ${c.libelle}\n        </a>`);
    }
    expect(pages.apropos).toContain("https://wa.me/22967770115");
    expect(pages.apropos).toContain("mailto:nounagnonadimou@gmail.com");
    expect(pages.apropos).toContain("https://elodias-adimou.netlify.app");
  });

  it("ouvre les liens externes sans exposer la fenêtre d'origine", () => {
    for (const c of contacts.filter((c) => c.externe)) {
      const balise = new RegExp(`<a href="${c.href.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"[^>]*>`);
      expect(pages.apropos.match(balise)?.[0]).toContain('rel="noopener noreferrer"');
    }
  });

  it("donne une image décrite et dimensionnée", () => {
    const img = pages.apropos.match(/<img[^>]*>/)?.[0] ?? "";
    expect(img).toContain(`alt="${auteur.nom}, qui conçoit et développe ${site.nom}"`);
    expect(img).toMatch(/width="750"/);
    expect(img).toMatch(/height="1000"/);
  });
});

describe("accessibilité et référencement", () => {
  it.each(toutes)("%s n'a qu'un seul h1", (_, html) => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it.each(toutes)("%s déclare une URL canonique et une description", (_, html) => {
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/recade\.sabar\.app/);
    expect(html).toMatch(/<meta name="description" content="[^"]{30,}"/);
  });

  it.each(toutes)("%s porte les repères sémantiques et la langue", (_, html) => {
    expect(html).toContain('<html lang="fr">');
    for (const t of ["<header", "<nav", "<main", "<footer"]) expect(html).toContain(t);
  });

  it.each(toutes)("%s n'a aucune image sans alt", (_, html) => {
    for (const img of html.match(/<img[^>]*>/g) ?? []) expect(img).toMatch(/\salt="/);
  });
});

describe("règle éditoriale", () => {
  // Même règle que sur les autres projets publics : le tiret cadratin ne doit
  // jamais apparaître dans un texte lu par un visiteur.
  it.each(toutes)("%s n'emploie aucun tiret cadratin visible", (_, html) => {
    expect(visible(html)).not.toMatch(/[—–]/);
  });
});

describe("cohérence des faits publiés", () => {
  it("la politique de confidentialité nie les cookies, et le site n'en pose aucun", () => {
    expect(pages.confidentialite).toContain("Aucun <b>cookie</b> n'est déposé");
    for (const [, html] of toutes) {
      expect(html).not.toMatch(/document\.cookie|localStorage|sessionStorage/);
      expect(html).not.toMatch(/<script/);
    }
  });

  it("aucune page ne charge de ressource tierce", () => {
    for (const [, html] of toutes) {
      const externes = html.match(/(?:src|href)="https?:\/\/[^"]+"/g) ?? [];
      for (const lien of externes) {
        const estRessource = /^src=/.test(lien) || /rel="stylesheet"/.test(html);
        expect(estRessource && !lien.includes(site.url)).toBe(false);
      }
    }
  });
});

describe("vignettes de partage", () => {
  /** Valeur d'une balise meta, qu'elle soit en `property` ou en `name`. */
  const meta = (html, cle) =>
    html.match(
      new RegExp(`<meta (?:property|name)="${cle}" content="([^"]*)"`),
    )?.[1] ?? null;

  it.each(toutes)("%s déclare une image absolue en https", (_, html) => {
    const img = meta(html, "og:image");
    expect(img).toMatch(/^https:\/\//);
    // Les moissonneurs ne résolvent pas le relatif : un chemin nu ne marche pas.
    expect(img).toContain(site.url);
  });

  it.each(toutes)("%s dimensionne et type son image", (_, html) => {
    expect(meta(html, "og:image:width")).toBe("1200");
    expect(meta(html, "og:image:height")).toBe("630");
    expect(meta(html, "og:image:type")).toBe("image/png");
    expect(meta(html, "og:image:alt")?.length ?? 0).toBeGreaterThan(30);
  });

  it.each(toutes)("%s porte la carte Twitter en grand format", (_, html) => {
    expect(meta(html, "twitter:card")).toBe("summary_large_image");
    expect(meta(html, "twitter:title")).toBe(meta(html, "og:title"));
    expect(meta(html, "twitter:description")).toBe(meta(html, "og:description"));
    expect(meta(html, "twitter:image")).toBe(meta(html, "og:image"));
  });

  it.each(toutes)("%s nomme le site et sa langue", (_, html) => {
    expect(meta(html, "og:site_name")).toBe(site.nom);
    expect(meta(html, "og:locale")).toBe("fr_FR");
  });

  it.each(toutes)("%s propose une icône pour les clients qui l'affichent", (_, html) => {
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
    expect(html).toContain('<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">');
  });

  it("chaque page a SA vignette, aucune n'est partagée", () => {
    const images = toutes.map(([, html]) => meta(html, "og:image"));
    expect(new Set(images).size).toBe(images.length);
  });

  it("chaque vignette existe sur le disque, en 1200x630", () => {
    for (const v of Object.values(VIGNETTES)) {
      const chemin = fileURLToPath(new URL(`./img/og/${v.fichier}`, import.meta.url));
      const png = readFileSync(chemin);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
      // Au-delà, certains clients de messagerie renoncent à télécharger.
      expect(png.length).toBeLessThan(300 * 1024);
    }
  });

  it("couvre exactement les pages publiées", () => {
    expect(Object.keys(VIGNETTES).sort()).toEqual(
      ["/", "/a-propos", "/confidentialite", "/mentions-legales"].sort(),
    );
  });
});

describe("le verdict ne dépend jamais de la couleur", () => {
  /**
   * Règle du GOV.UK Design System reprise ici : on ne réassigne pas le sens
   * d'une couleur. Chez Récade, deux couleurs seulement portent un sens,
   * « confirmé » et « réfuté ». Elles ne décorent jamais rien d'autre, et un
   * lecteur qui ne les distingue pas doit comprendre quand même.
   */

  /** Rapport de contraste WCAG entre deux couleurs hexadécimales. */
  const luminance = (hex) => {
    const c = hex.replace("#", "");
    const v = [0, 2, 4].map((i) => Number.parseInt(c.slice(i, i + 2), 16) / 255);
    const f = (x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]);
  };
  const contraste = (a, b) => {
    const [haut, bas] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (haut + 0.05) / (bas + 0.05);
  };

  /** Le CSS de la page, commentaires retirés : ils citent les valeurs. */
  const regles = (html) =>
    html
      .match(/<style>([\s\S]*?)<\/style>/)[1]
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}");

  /** Les couleurs qui disent « confirmé » ou « réfuté », et rien d'autre. */
  const SEMANTIQUES = ["#9CCBA8", "#E5A196", "#2F5D43", "#8C2F26", "#5E7A66"];

  it("s'écrit en toutes lettres, des deux côtés", () => {
    expect(pages.accueil).toContain("Attestation confirmée");
    expect(pages.accueil).toContain("Attestation réfutée");
  });

  it.each(toutes)("%s réserve les couleurs sémantiques au verdict", (_, html) => {
    for (const regle of regles(html)) {
      if (!SEMANTIQUES.some((c) => regle.toUpperCase().includes(c))) continue;
      // Une règle qui pose un vert ou un rouge doit viser une marque de
      // vérification ou un verdict. Sinon, la couleur se met à vouloir dire
      // autre chose, et le code couleur du produit ne veut plus rien dire.
      expect(regle).toMatch(/\.v\b|\.r\b|\.verdict/);
    }
  });

  it("les deux couleurs tiennent AA sur le fond où elles s'affichent", () => {
    // À l'écran, dans le bloc de commande sur fond forge
    expect(contraste("#9CCBA8", "#14120F")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#E5A196", "#14120F")).toBeGreaterThanOrEqual(4.5);
    // Sur le papier, où le bloc devient clair
    expect(contraste("#2F5D43", "#F7F3EA")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#8C2F26", "#F7F3EA")).toBeGreaterThanOrEqual(4.5);
  });

  it("aucune teinte ne sert sur les deux fonds à la fois", () => {
    // Ce test fige le constat qui a imposé deux paires plutôt qu'une : le
    // vert-de-gris #5E7A66 de brand/tokens.json n'atteint AA sur aucun des
    // deux fonds. Si un jour il y arrive, cette attente tombera et on
    // pourra simplifier.
    expect(contraste("#5E7A66", "#14120F")).toBeLessThan(4.5);
    expect(contraste("#5E7A66", "#F7F3EA")).toBeLessThan(4.5);
  });
});
