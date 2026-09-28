/**
 * Vignettes de partage (Open Graph).
 *
 * Une entrée par page publiée. Le SVG est rendu en PNG 1200x630 par
 * `scripts/build-og.mjs`, et le PNG est **commité**. Raison : le rendu exige un
 * Chromium, que l'image Docker n'embarque pas, et la police du site
 * ("Avenir Next") n'existe pas dans un conteneur Linux. Générer à la volée
 * produirait donc une vignette différente de celle validée. On fige.
 *
 * Partition « manche / lame » de la direction Fonte Hountondji : le manche
 * porte l'identité (emblème, nom, nature du document), la lame porte le
 * message. Les interdits de `brand/tokens.json` s'appliquent : aucun dégradé,
 * aucune ombre portée diffuse, aucun motif de fond.
 */

import { site } from "./config.mjs";

const FORGE = "#14120F";
const LAITON = "#B8863B";
const IVOIRE = "#F2EBDD";
const CENDRE = "#8A8073";
const POLICE = `'Avenir Next','Helvetica Neue','Segoe UI',system-ui,sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,'SF Mono',Menlo,monospace`;

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Les vignettes, indexées par chemin publié. `alt` n'est pas décoratif : c'est
 * ce que lisent les personnes qui reçoivent le lien avec un lecteur d'écran.
 *
 * @type {Record<string, {fichier:string, surtitre:string, lignes:string[],
 *   accent?:number, mono?:string, alt:string}>}
 */
export const VIGNETTES = {
  "/": {
    fichier: "og-accueil.png",
    surtitre: "Attestation de contribution",
    lignes: ["Atteste ce que", "tu as construit."],
    mono: "npx @elodias/recade scan ~/mon-depot",
    alt: "Vignette Récade : l'emblème en laiton sur fond noir de forge, et le titre « Atteste ce que tu as construit ».",
  },
  "/a-propos": {
    fichier: "og-a-propos.png",
    surtitre: "À propos",
    lignes: ["Elodias ADIMOU", "conçoit et développe", "Récade."],
    accent: 2,
    mono: "Développeur web fullstack · Cotonou, Bénin",
    alt: "Vignette Récade : « Elodias ADIMOU conçoit et développe Récade », développeur web fullstack à Cotonou.",
  },
  "/mentions-legales": {
    fichier: "og-mentions-legales.png",
    surtitre: "Mentions légales",
    lignes: ["Éditeur, publication,", "hébergement."],
    alt: "Vignette Récade : mentions légales du site, éditeur, directeur de la publication et hébergeur.",
  },
  "/confidentialite": {
    fichier: "og-confidentialite.png",
    surtitre: "Confidentialité",
    lignes: ["Aucun cookie.", "Aucune collecte."],
    accent: 0,
    mono: "Seuls les journaux du serveur gardent une adresse IP",
    alt: "Vignette Récade : politique de confidentialité, aucun cookie déposé et aucune donnée collectée.",
  },
};

/** Les fiches de documentation. Le titre vient du Markdown, pas d'ici. */
export const VIGNETTE_DOCS = {
  surtitre: "Documentation",
  alt: (titre) => `Vignette Récade : la fiche de documentation « ${titre} ».`,
};

/** Chemin publié d'une fiche de doc vers son fichier de vignette. */
export const fichierDocs = (nomHtml) =>
  `og-docs-${nomHtml.replace(/\.html$/, "")}.png`;

/**
 * Le SVG d'une vignette, en 1200x630 exactement.
 * Aucun `<image>`, aucune police distante : tout est vectoriel et local.
 */
export function svgVignette({ surtitre, lignes, accent, mono }) {
  const hauteurLigne = lignes.length >= 3 ? 74 : 86;
  const tailleTitre = lignes.length >= 3 ? 62 : 74;
  const departY = 300 - ((lignes.length - 1) * hauteurLigne) / 2;

  const titre = lignes
    .map(
      (l, i) =>
        `  <text x="64" y="${departY + i * hauteurLigne}" font-family="${POLICE}" font-size="${tailleTitre}"` +
        ` font-weight="600" letter-spacing="-1.6" fill="${i === accent ? LAITON : IVOIRE}">${esc(l)}</text>`,
    )
    .join("\n");

  const ligneMono = mono
    ? `\n  <rect x="64" y="452" width="46" height="2" fill="${LAITON}"/>` +
      `\n  <text x="64" y="502" font-family="${MONO}" font-size="24" fill="${CENDRE}">${esc(mono)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${FORGE}"/>

  <!-- manche : ce qui porte -->
  <g transform="translate(64 38)">
    <circle cx="28" cy="28" r="26" fill="none" stroke="${LAITON}" stroke-width="1.8"/>
    <path d="M28 10.9 L38.3 21.2 L38.3 34.8 L28 45.1 L17.7 34.8 L17.7 21.2 Z"
          fill="none" stroke="${IVOIRE}" stroke-width="2"/>
    <path d="M28 18.3 L33.5 23.8 L33.5 32.2 L28 37.7 L22.5 32.2 L22.5 23.8 Z" fill="${LAITON}"/>
  </g>
  <text x="140" y="83" font-family="${POLICE}" font-size="34" font-weight="600"
        letter-spacing="5.5" fill="${IVOIRE}">RÉCADE</text>
  <text x="1136" y="80" text-anchor="end" font-family="${POLICE}" font-size="19"
        font-weight="600" letter-spacing="2.4" fill="${CENDRE}">${esc(surtitre.toUpperCase())}</text>
  <rect x="0" y="130" width="1200" height="1.6" fill="${LAITON}" opacity="0.42"/>

  <!-- lame : ce qui atteste -->
${titre}${ligneMono}

  <rect x="0" y="566" width="1200" height="1.6" fill="${LAITON}" opacity="0.42"/>
  <text x="64" y="605" font-family="${POLICE}" font-size="23" font-weight="600"
        letter-spacing="0.4" fill="${LAITON}">${esc(site.url.replace(/^https?:\/\//, ""))}</text>
  <text x="1136" y="605" text-anchor="end" font-family="${POLICE}" font-size="21"
        fill="${CENDRE}">Réfutable, pas « prouvé »</text>
</svg>`;
}

/** URL absolue d'une vignette. Les moissonneurs ne résolvent pas le relatif. */
export const urlVignette = (fichier) => `${site.url}/img/og/${fichier}`;
