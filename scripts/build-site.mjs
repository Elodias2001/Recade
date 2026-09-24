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
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
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

await rm(SORTIE, { recursive: true, force: true });
await mkdir(SORTIE, { recursive: true });

// --- pages ---
for (const route of ROUTES) {
  const { default: html } = await import(join(RACINE, "site", "pages", route.module));
  await writeFile(join(SORTIE, route.fichier), html, "utf8");
  console.log(`  ✓ ${route.fichier.padEnd(24)} ${route.url}`);
}

// --- fichiers statiques : tout site/ sauf le code de construction ---
const CODE = new Set(["config.mjs", "layout.mjs", "pages"]);
for (const entree of await readdir(join(RACINE, "site"), { withFileTypes: true })) {
  if (CODE.has(entree.name)) continue;
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
