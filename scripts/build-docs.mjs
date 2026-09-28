#!/usr/bin/env node
/**
 * Génère `docs/*.html` depuis `docs/*.md`.
 *
 * Le Markdown reste la source de vérité : il se lit tel quel sur GitHub et dans
 * un éditeur. Le HTML n'est jamais édité à la main — ajouter une fiche, c'est
 * déposer un `.md` dans `docs/`, rien d'autre.
 *
 * L'ordre du sommaire vient du préfixe numérique du nom de fichier
 * (`01-…`, `02-…`), `index.md` venant toujours en tête.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { site } from "../site/config.mjs";
import { VIGNETTE_DOCS, fichierDocs, urlVignette } from "../site/og.mjs";

const DOCS = fileURLToPath(new URL("../docs", import.meta.url));

const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Description de partage d'une fiche : son premier vrai paragraphe, débarrassé
 * du Markdown. Le `.md` reste la source, on n'ajoute pas d'en-tête à maintenir
 * en double.
 */
function resume(source) {
  const para = source
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .find((b) => b && !/^[#>|\-=`]/.test(b) && !/^\!\[/.test(b));
  if (!para) return `Documentation de ${site.nom}.`;
  const texte = para
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return texte.length > 160 ? texte.slice(0, 157).replace(/\s+\S*$/, "") + "..." : texte;
}

/** Ancres sur les titres, pour que le sommaire et les liens profonds tiennent. */
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const id = slug(text.replace(/<[^>]+>/g, ""));
      const anchor = depth === 2 || depth === 3 ? `<a class="anchor" href="#${id}">#</a>` : "";
      return `<h${depth} id="${id}">${text}${anchor}</h${depth}>\n`;
    },
  },
});

const EMBLEME = `<svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#B8863B" stroke-width="2"/>
      <path d="M32 12.5 L43.8 24.3 L43.8 39.7 L32 51.5 L20.2 39.7 L20.2 24.3 Z" fill="none" stroke="#F2EBDD" stroke-width="2.2"/>
      <path d="M32 20.9 L38.3 27.1 L38.3 36.9 L32 43.1 L25.7 36.9 L25.7 27.1 Z" fill="#B8863B"/>
    </svg>`;

function shell({ title, description, out, nav, body }) {
  const canonical = `${site.url}/docs/${out}`;
  const image = urlVignette(fichierDocs(out));
  const alt = VIGNETTE_DOCS.alt(title);
  // Le titre visible garde le séparateur typographique du site, jamais le
  // tiret cadratin : même règle éditoriale que les pages, désormais tenue ici.
  const titreComplet = `${title} | ${site.nom}`;
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titreComplet)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:locale" content="${esc(site.locale)}">
<meta property="og:title" content="${esc(titreComplet)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titreComplet)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta name="twitter:image:alt" content="${esc(alt)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="assets/docs.css">
</head>
<body>
<nav class="nav">
  <div class="mark">${EMBLEME}<b>Récade</b></div>
  <div class="bl">Documentation</div>
  ${nav}
  <div class="sec">Liens</div>
  <a href="/">Accueil du site</a>
  <a href="/a-propos.html">À propos</a>
  <a href="https://github.com/Elodias2001/Recade">GitHub</a>
</nav>
<main class="page">
${body}
<div class="pied">Récade · MIT © Elodias ADIMOU · Conçu &amp; développé par <a href="/a-propos.html">Elodias ADIMOU</a>.</div>
</main>
</body>
</html>
`;
}

const files = (await readdir(DOCS))
  .filter((f) => f.endsWith(".md"))
  .sort((a, b) => (a === "index.md" ? -1 : b === "index.md" ? 1 : a.localeCompare(b, "fr")));

if (files.length === 0) {
  console.error("Aucun .md dans docs/ — rien à générer.");
  process.exit(1);
}

const pages = await Promise.all(
  files.map(async (file) => {
    const source = await readFile(join(DOCS, file), "utf8");
    const heading = /^#\s+(.+)$/m.exec(source);
    return {
      file,
      out: `${basename(file, ".md")}.html`,
      title: heading?.[1]?.trim() ?? basename(file, ".md"),
      description: resume(source),
      source,
    };
  }),
);

for (const page of pages) {
  const nav = pages
    .map(
      (p) =>
        `<a href="${p.out}"${p.out === page.out ? ' class="on"' : ""}>${esc(p.title)}</a>`,
    )
    .join("\n  ");

  await writeFile(
    join(DOCS, page.out),
    shell({
      title: page.title,
      description: page.description,
      out: page.out,
      nav,
      body: marked.parse(page.source),
    }),
    "utf8",
  );
  console.log(`  ✓ ${page.out.padEnd(28)} ${page.title}`);
}

console.log(`\n  ${pages.length} fiche(s) générée(s) dans docs/`);
