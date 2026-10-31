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

import { demo, nb, site } from "./config.mjs";

const FORGE = "#14120F";
const LAITON = "#B8863B";
const IVOIRE = "#F2EBDD";
const CENDRE = "#8A8073";
const FORGE2 = "#1F1B16";
const PAPIER = "#FBF9F4";
const LAITON_CLAIR = "#E0B65C";
const FILET = "#E3DBCA";
const VERT = "#2F5D43";
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
    // Renommée en -2 le 31 octobre 2026 : l'image est servie `immutable` pour
    // un an, et les plateformes de messagerie gardent l'aperçu en cache par
    // URL. Sans nouveau nom, personne n'aurait vu le badge apparaitre.
    fichier: "og-accueil-2.png",
    surtitre: "Attestation de contribution",
    lignes: ["Atteste ce que", "tu as construit."],
    mono: "npx @elodias/recade scan ~/mon-depot",
    badge: true,
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
/**
 * Le badge au cordon, celui du hero, redessiné en SVG pour la vignette.
 *
 * Il n'était pas là : la vignette ne montrait que du texte, alors que le
 * badge est la signature visuelle du site. Un aperçu de lien se lit en une
 * demi-seconde, dans une bulle de conversation : c'est le dessin qu'on
 * reconnait, pas la phrase.
 *
 * Les chiffres viennent de `demo` dans config.mjs, comme ceux de la page.
 * Les réécrire ici les aurait fait diverger, exactement le défaut corrigé
 * le 8 octobre 2026.
 *
 * Contraintes de la direction Fonte Hountondji : aucun dégradé, aucune ombre
 * diffuse (celle-ci est franche, décalée de 4 px), aucun rayon au-delà de 8.
 */
function svgBadge(x, y) {
  const L = 300;                       // largeur du badge
  const cx = x + L / 2;                // axe du cordon
  const ligne = (i, etiquette, valeur) => {
    const yy = y + 96 + i * 38;
    return `    <text x="${x + 18}" y="${yy}" font-family="${POLICE}" font-size="17" fill="#6F6658">${esc(etiquette)}</text>
    <text x="${x + L - 18}" y="${yy}" text-anchor="end" font-family="${MONO}" font-size="20" fill="${FORGE}">${esc(valeur)}</text>
    <rect x="${x + 18}" y="${yy + 13}" width="${L - 36}" height="1" fill="${FILET}"/>`;
  };

  return `
  <!-- le badge au cordon : la signature visuelle du site -->
  <g transform="rotate(-2.4 ${cx} ${y})">
    <!-- Le cordon : deux brins tissés qui montent hors du cadre. Le tissage
         est fait de traits discrets et non d'un dégradé, que la marque
         interdit. Chaque brin porte le nom dans sa trame, comme sur le site. -->
    <defs>
      <pattern id="trame" width="7" height="7" patternUnits="userSpaceOnUse"
               patternTransform="rotate(48)">
        <rect width="7" height="7" fill="${LAITON}"/>
        <rect width="2" height="7" fill="#9C7030" opacity="0.45"/>
      </pattern>
    </defs>
    <g>
      <path d="M${cx - 10} ${y + 10} L${cx - 62} 128 L${cx - 40} 128 L${cx + 2} ${y + 10} Z" fill="url(#trame)"/>
      <path d="M${cx - 10} ${y + 10} L${cx - 62} 128 L${cx - 40} 128 L${cx + 2} ${y + 10} Z"
            fill="none" stroke="#8A6128" stroke-width="1.2"/>
      <text font-family="${POLICE}" font-size="9" font-weight="700" letter-spacing="3"
            fill="rgba(20,18,15,0.55)">
        <textPath href="#brinG">RÉCADE · RÉCADE</textPath>
      </text>
      <path id="brinG" d="M${cx - 51} 134 L${cx - 5} ${y + 12}" fill="none"/>

      <path d="M${cx + 10} ${y + 10} L${cx + 62} 128 L${cx + 40} 128 L${cx - 2} ${y + 10} Z" fill="url(#trame)"/>
      <path d="M${cx + 10} ${y + 10} L${cx + 62} 128 L${cx + 40} 128 L${cx - 2} ${y + 10} Z"
            fill="none" stroke="#8A6128" stroke-width="1.2"/>
    </g>

    <!-- La fente, puis la ferrure qui la traverse : posée APRÈS la carte dans
         l'ordre de dessin, sinon la carte la recouvre. -->

    <!-- la carte : ombre franche, jamais diffuse -->
    <rect x="${x + 4}" y="${y + 16}" width="${L}" height="236" fill="rgba(20,18,15,0.22)"/>
    <rect x="${x}" y="${y + 12}" width="${L}" height="236" fill="${PAPIER}" stroke="#CFC4AC" stroke-width="1.5"/>

    <!-- la tête, sombre, qui porte l'identité -->
    <rect x="${x}" y="${y + 12}" width="${L}" height="46" fill="${FORGE2}"/>
    <circle cx="${x + 25}" cy="${y + 35}" r="10" fill="none" stroke="${LAITON}" stroke-width="1.4"/>
    <path d="M${x + 25} ${y + 28.5} L${x + 29} ${y + 32.5} L${x + 29} ${y + 37.5} L${x + 25} ${y + 41.5} L${x + 21} ${y + 37.5} L${x + 21} ${y + 32.5} Z" fill="${LAITON}"/>
    <rect x="${cx - 22}" y="${y + 1}" width="44" height="7" rx="3.5" fill="#0E0C0A"/>
    <rect x="${cx - 15}" y="${y - 6}" width="30" height="20" rx="4" fill="none" stroke="${LAITON}" stroke-width="3"/>
    <text x="${x + 44}" y="${y + 41}" font-family="${POLICE}" font-size="18" font-weight="600" fill="${IVOIRE}">${esc(demo.depot)}</text>
    <text x="${x + L - 16}" y="${y + 40}" text-anchor="end" font-family="${POLICE}" font-size="11"
          font-weight="600" letter-spacing="1.6" fill="${LAITON_CLAIR}">ATTESTATION</text>

    <!-- le corps : les compteurs, tirés de la même source que la page -->
${ligne(0, "Commits signés", nb(demo.commitsSignes))}
${ligne(1, "Rang", `${demo.rang}er / ${demo.equipe}`)}
${ligne(2, "Fusions relues", nb(demo.fusions))}

    <!-- le verdict, écrit en toutes lettres : la couleur n'est qu'un renfort -->
    <rect x="${x + 18}" y="${y + 196}" width="${L - 36}" height="38" fill="#F1F5F1"/>
    <rect x="${x + 18}" y="${y + 196}" width="3" height="38" fill="${VERT}"/>
    <text x="${x + 32}" y="${y + 221}" font-family="${POLICE}" font-size="16" font-weight="600" fill="${VERT}">Attestation confirmée</text>
  </g>`;
}

export function svgVignette({ surtitre, lignes, accent, mono, badge }) {
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
${badge ? svgBadge(780, 232) : ""}

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
