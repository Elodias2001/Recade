#!/usr/bin/env node
/**
 * Construit le site statique dans `dist-site/`.
 *
 * Chaque page est un module qui exporte son HTML complet, bâti sur la coquille
 * commune (`site/layout.mjs`) et sur la source unique d'identité
 * (`site/config.mjs`). Ajouter une page, c'est déposer un fichier dans
 * `site/pages/` et l'inscrire dans ROUTES ci-dessous.
 *
 * Les URL sont sans extension (`/a-propos`) : nginx les résout via
 * `try_files $uri $uri.html`.
 */
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../site/config.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const SORTIE = join(RACINE, "dist-site");

/** Fichier de page → chemin publié. Sert aussi à construire le sitemap. */
const ROUTES = [
  { module: "index.mjs", fichier: "index.html", url: "/", priorite: "1.0" },
  { module: "a-propos.mjs", fichier: "a-propos.html", url: "/a-propos", priorite: "0.7" },
  { module: "mentions-legales.mjs", fichier: "mentions-legales.html", url: "/mentions-legales", priorite: "0.3" },
  { module: "confidentialite.mjs", fichier: "confidentialite.html", url: "/confidentialite", priorite: "0.3" },
];

const MARQUE = "__POIDS__";
const enKo = (octets) => `${(octets / 1024).toFixed(1).replace(".", ",")} Ko`;

/**
 * Inscrit dans la page son propre poids compressé.
 *
 * gzipSync compresse au niveau 6, celui de zlib par défaut. nginx doit
 * compresser au MÊME niveau, sinon le chiffre annoncé ne décrit pas ce que le
 * visiteur télécharge : son défaut à lui est le niveau 1, et on transférait
 * 10 114 octets là où la page en annonçait 8 909. Voir `gzip_comp_level` dans
 * nginx.conf. Ces deux valeurs bougent ensemble.
 *
 * Écrire le poids change le poids : on itère jusqu'au point fixe. Arrondi au
 * dixième de kilo-octet, les quelques octets que coûte le chiffre lui-même ne
 * font presque jamais basculer l'arrondi, et la suite converge en deux ou
 * trois passes.
 *
 * Presque jamais n'est pas jamais : quand la page tombe pile sur une frontière
 * d'arrondi, la suite oscille entre deux valeurs. On ne baisse pas l'exigence
 * pour autant, on dit la vérité autrement : on retient la plus grande des deux
 * et on écrit « au plus ». Le lecteur garde un chiffre qu'il peut vérifier, et
 * qui n'est jamais dépassé.
 */
/**
 * Retire les commentaires du CSS servi, et d'eux seuls.
 *
 * Les feuilles du site sont écrites dans des gabarits abondamment commentés :
 * c'est voulu, chaque règle d'impression porte la trace du défaut qui l'a
 * rendue nécessaire. Mais ces commentaires partaient chez le visiteur. Sur la
 * page d'accueil ils pesaient 4 751 octets bruts, soit 2 210 octets une fois
 * compressés, 23 % de la page. Ils restent dans la source, où ils servent ;
 * ils ne descendent plus sur le réseau, où ils ne servent à personne.
 *
 * On ne retire que `/* ... *\/` hors des chaînes : un `content: "/*"` ne doit
 * pas ouvrir un commentaire. D'où l'automate plutôt qu'une expression
 * régulière.
 */
function sansNotesCss(css) {
  let out = "";
  let i = 0;
  let guillemet = null;
  while (i < css.length) {
    const c = css[i];
    if (guillemet) {
      out += c;
      if (c === "\\") { out += css[i + 1] ?? ""; i += 2; continue; }
      if (c === guillemet) guillemet = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") { guillemet = c; out += c; i += 1; continue; }
    if (c === "/" && css[i + 1] === "*") {
      const fin = css.indexOf("*/", i + 2);
      i = fin < 0 ? css.length : fin + 2;
      // une espace suffit à séparer deux règles que le commentaire séparait
      out += " ";
      continue;
    }
    out += c;
    i += 1;
  }
  // les blancs laissés par les commentaires retirés
  return out.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n");
}

const degraisser = (html) =>
  html.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${sansNotesCss(css)}</style>`);

function inscrirePoids(html, nom) {
  if (!html.includes(MARQUE)) {
    throw new Error(`${nom} ne contient pas ${MARQUE} : le pied de page a changé.`);
  }
  const peser = (annonce) => gzipSync(Buffer.from(html.replace(MARQUE, annonce))).length;

  let annonce = enKo(peser("0,0 Ko"));
  const vus = [];
  for (let passe = 0; passe < 12; passe++) {
    const reel = enKo(peser(annonce));
    if (reel === annonce) return html.replace(MARQUE, annonce);
    if (vus.includes(reel)) {
      // cycle : on prend la borne haute, jamais dépassée par le fichier écrit
      const haut = [...vus, reel].sort().at(-1);
      return html.replace(MARQUE, `au plus ${haut}`);
    }
    vus.push(annonce);
    annonce = reel;
  }
  throw new Error(`Le poids déclaré de ${nom} n'a pas convergé en 12 passes.`);
}

await rm(SORTIE, { recursive: true, force: true });
await mkdir(SORTIE, { recursive: true });

// --- pages ---
for (const route of ROUTES) {
  const { default: brut } = await import(join(RACINE, "site", "pages", route.module));
  const html = inscrirePoids(degraisser(brut), route.fichier);
  await writeFile(join(SORTIE, route.fichier), html, "utf8");

  // On relit depuis le disque : le chiffre annoncé doit décrire le fichier
  // réellement servi, pas la chaîne qu'on croyait écrire.
  const servi = await readFile(join(SORTIE, route.fichier));
  const mesure = enKo(gzipSync(servi).length);
  const annonce = /Cette page pèse <b>([^<]+)<\/b>/.exec(servi.toString())?.[1] ?? "";
  const borne = annonce.startsWith("au plus ");
  const valeur = borne ? annonce.slice(8) : annonce;
  const exact = Number.parseFloat(mesure.replace(",", "."));
  const declare = Number.parseFloat(valeur.replace(",", "."));
  const juste = borne ? exact <= declare : valeur === mesure;
  if (!juste) {
    throw new Error(`${route.fichier} annonce ${annonce} mais pèse ${mesure}.`);
  }
  console.log(`  ✓ ${route.fichier.padEnd(24)} ${route.url.padEnd(20)} ${mesure}`);
}

// --- fichiers statiques : tout site/ sauf le code de construction ---
// Tout ce qui n'est pas un fichier destiné au public. Un `.test.mjs` oublié
// s'était retrouvé servi en production : on filtre par nature, pas par liste.
const estCode = (nom) =>
  nom === "pages" || nom.endsWith(".mjs") || nom.endsWith(".ts") || nom.endsWith(".map");

for (const entree of await readdir(join(RACINE, "site"), { withFileTypes: true })) {
  if (estCode(entree.name)) continue;
  await cp(join(RACINE, "site", entree.name), join(SORTIE, entree.name), { recursive: true });
}

// --- documentation générée ---
await mkdir(join(SORTIE, "docs"), { recursive: true });
for (const f of await readdir(join(RACINE, "docs"))) {
  if (f.endsWith(".html")) await cp(join(RACINE, "docs", f), join(SORTIE, "docs", f));
}
await cp(join(RACINE, "docs", "assets"), join(SORTIE, "docs", "assets"), { recursive: true });

// --- robots.txt ---
await writeFile(
  join(SORTIE, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`,
  "utf8",
);

// --- sitemap.xml : les pages du site, plus les fiches de documentation ---
const aujourdhui = new Date().toISOString().slice(0, 10);
const fiches = (await readdir(join(RACINE, "docs")))
  .filter((f) => f.endsWith(".html"))
  .map((f) => ({ url: `/docs/${f === "index.html" ? "" : f}`, priorite: "0.6" }));

const urls = [...ROUTES, ...fiches]
  .map(
    (r) =>
      `  <url>\n    <loc>${site.url}${r.url}</loc>\n    <lastmod>${aujourdhui}</lastmod>\n    <priority>${r.priorite}</priority>\n  </url>`,
  )
  .join("\n");

await writeFile(
  join(SORTIE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  "utf8",
);

console.log(`  ✓ robots.txt · sitemap.xml (${ROUTES.length + fiches.length} URL)`);
console.log(`\n  site construit dans dist-site/`);
