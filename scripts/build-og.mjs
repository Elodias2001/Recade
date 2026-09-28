#!/usr/bin/env node
/**
 * Rend les vignettes de partage en PNG 1200x630 dans `site/img/og/`.
 *
 * Ces PNG sont **commités**, et ce script n'est pas appelé par `build:site`.
 * Le rendu exige un Chromium que l'image Docker n'embarque pas, et la police
 * du site n'existe pas dans un conteneur Linux : générer au déploiement
 * donnerait une vignette différente de celle validée. On fige à la main, on
 * relance ce script quand un titre change.
 *
 *   pnpm build:og
 *
 * Chrome ne rend jamais la main après `--screenshot`, exactement comme après
 * `--print-to-pdf` : on attend que le fichier soit écrit, puis on tue.
 */
import { spawn } from "node:child_process";
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VIGNETTES,
  VIGNETTE_DOCS,
  fichierDocs,
  svgVignette,
} from "../site/og.mjs";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const SORTIE = join(RACINE, "site", "img", "og");
const TEMPO = join(RACINE, ".og-tmp");

const LARGEUR = 1200;
const HAUTEUR = 630;
const POIDS_MAX = 300 * 1024;

const CANDIDATS = [
  process.env.RECADE_CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

async function trouverChrome() {
  for (const c of CANDIDATS) {
    try {
      await access(c);
      return c;
    } catch {}
  }
  throw new Error(
    "Aucun Chromium trouvé. Installez Chrome, ou donnez RECADE_CHROME=/chemin/vers/chrome.",
  );
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/** Rend un SVG en PNG. Renvoie la taille du fichier écrit. */
async function rendre(chrome, svg, sortie) {
  const html = join(TEMPO, `${basename(sortie, ".png")}.html`);
  await writeFile(
    html,
    `<!doctype html><meta charset="utf-8">` +
      `<style>html,body{margin:0;padding:0;background:#14120F;overflow:hidden}svg{display:block}</style>` +
      svg,
    "utf8",
  );
  await rm(sortie, { force: true });

  const proc = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${LARGEUR},${HAUTEUR}`,
      `--screenshot=${sortie}`,
      "--virtual-time-budget=2500",
      `--user-data-dir=${join(TEMPO, "profil")}`,
      `file://${html}`,
    ],
    { stdio: "ignore" },
  );

  let taille = 0;
  for (let i = 0; i < 60; i++) {
    await attendre(300);
    try {
      const s = await stat(sortie);
      if (s.size > 0) {
        await attendre(400); // laisse l'écriture se terminer
        taille = (await stat(sortie)).size;
        break;
      }
    } catch {}
  }
  proc.kill("SIGKILL");
  if (taille === 0) throw new Error(`Rendu vide : ${basename(sortie)}`);
  return taille;
}

/** Largeur x hauteur d'un PNG, lues dans l'en-tête IHDR. */
async function dimensions(fichier) {
  const b = await readFile(fichier);
  if (b.subarray(1, 4).toString() !== "PNG") throw new Error("Pas un PNG");
  return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20) };
}

// ---------------------------------------------------------------- exécution

const chrome = await trouverChrome();
console.log(`  navigateur : ${chrome}\n`);

await rm(TEMPO, { recursive: true, force: true });
await mkdir(TEMPO, { recursive: true });
await mkdir(SORTIE, { recursive: true });

/** Les pages du site, plus une vignette par fiche de documentation. */
const travaux = Object.entries(VIGNETTES).map(([chemin, v]) => ({
  chemin,
  fichier: v.fichier,
  svg: svgVignette(v),
}));

for (const f of (await readdir(join(RACINE, "docs"))).filter((f) => f.endsWith(".md"))) {
  const source = await readFile(join(RACINE, "docs", f), "utf8");
  const titre = /^#\s+(.+)$/m.exec(source)?.[1]?.trim() ?? basename(f, ".md");
  const html = `${basename(f, ".md")}.html`;
  travaux.push({
    chemin: `/docs/${html}`,
    fichier: fichierDocs(html),
    svg: svgVignette({
      surtitre: VIGNETTE_DOCS.surtitre,
      lignes: decouper(titre),
      mono: `recade.sabar.app/docs/${html}`,
    }),
  });
}

/** Coupe un titre long en deux lignes, au blanc le plus central. */
function decouper(titre) {
  if (titre.length <= 22) return [titre];
  const mots = titre.split(" ");
  let meilleur = 1;
  let ecart = Infinity;
  for (let i = 1; i < mots.length; i++) {
    const g = mots.slice(0, i).join(" ").length;
    const d = mots.slice(i).join(" ").length;
    if (Math.abs(g - d) < ecart) {
      ecart = Math.abs(g - d);
      meilleur = i;
    }
  }
  return [mots.slice(0, meilleur).join(" "), mots.slice(meilleur).join(" ")];
}

let echecs = 0;
for (const t of travaux) {
  const sortie = join(SORTIE, t.fichier);
  const taille = await rendre(chrome, t.svg, sortie);
  const { largeur, hauteur } = await dimensions(sortie);

  const bonnesDimensions = largeur === LARGEUR && hauteur === HAUTEUR;
  const bonPoids = taille <= POIDS_MAX;
  if (!bonnesDimensions || !bonPoids) echecs++;

  console.log(
    `  ${bonnesDimensions && bonPoids ? "✓" : "✗"} ${t.fichier.padEnd(30)}` +
      ` ${largeur}x${hauteur}`.padEnd(12) +
      ` ${(taille / 1024).toFixed(0).padStart(4)} Ko` +
      (bonnesDimensions ? "" : `  ATTENDU ${LARGEUR}x${HAUTEUR}`) +
      (bonPoids ? "" : `  TROP LOURD (max ${POIDS_MAX / 1024} Ko)`),
  );
}

await rm(TEMPO, { recursive: true, force: true });

if (echecs > 0) {
  console.error(`\n  ${echecs} vignette(s) hors spécification.`);
  process.exit(1);
}
console.log(`\n  ${travaux.length} vignettes dans site/img/og/`);
