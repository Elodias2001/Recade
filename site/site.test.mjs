import { describe, expect, it } from "vitest";
import { auteur, contacts, pagesLegales, site } from "./config.mjs";

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
