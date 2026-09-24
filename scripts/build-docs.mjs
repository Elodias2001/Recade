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

const DOCS = fileURLToPath(new URL("../docs", import.meta.url));

const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

function shell({ title, nav, body }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Récade</title>
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
<div class="pied">Récade — MIT © Elodias ADIMOU · Conçu &amp; développé par <a href="/a-propos.html">Elodias ADIMOU</a>.</div>
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
    shell({ title: page.title, nav, body: marked.parse(page.source) }),
    "utf8",
  );
  console.log(`  ✓ ${page.out.padEnd(28)} ${page.title}`);
}

console.log(`\n  ${pages.length} fiche(s) générée(s) dans docs/`);
