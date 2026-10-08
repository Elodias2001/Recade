/**
 * Coquille commune à toutes les pages du site : en-tête, navigation, pied de
 * page et feuille de style. Une seule définition, donc une seule vérité.
 *
 * Charte **Fonte Hountondji** : la récade a un manche et une lame. Le manche
 * porte (bandeau sombre, identité, navigation), la lame atteste (fond ivoire,
 * le contenu).
 *
 * Règle éditoriale : **aucun tiret cadratin dans les textes visibles**, comme
 * sur les autres projets publics de l'auteur. C'est testé.
 */
import { annee, auteur, pagesLegales, site } from "./config.mjs";
import { VIGNETTES, urlVignette } from "./og.mjs";

export const esc = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMBLEME = (taille = 28) => `<svg viewBox="0 0 64 64" width="${taille}" height="${taille}" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#B8863B" stroke-width="2"/>
      <path d="M32 12.5 L43.8 24.3 L43.8 39.7 L32 51.5 L20.2 39.7 L20.2 24.3 Z" fill="none" stroke="#F2EBDD" stroke-width="2.2"/>
      <path d="M32 20.9 L38.3 27.1 L38.3 36.9 L32 43.1 L25.7 36.9 L25.7 27.1 Z" fill="#B8863B"/>
    </svg>`;

/**
 * Règles d'impression, volontairement SÉPARÉES de STYLE.
 *
 * `coquille()` écrit STYLE puis `page.styleEnPlus` : à spécificité égale,
 * une règle de page gagnerait sur une règle d'impression écrite dans STYLE.
 * C'est ce qui a d'abord fait disparaître `.hero p` et `.kicker` du papier.
 * Ce bloc doit donc toujours être écrit EN DERNIER.
 */
const IMPRESSION = `/* ------------------------------------------------------------------
     Impression.

     Le site n'avait aucune règle d'impression, alors que l'attestation en
     a depuis toujours. Or le navigateur jette les fonds par défaut, et le
     hero vit DANS .manche : à l'impression, le fond forge disparaissait et
     tout le texte ivoire posé dessus devenait invisible. Nom du produit,
     navigation, titre, accroche et bouton : rien ne sortait. Vérifié le
     7 octobre 2026 en simulant « Graphiques d'arrière-plan » décoché.

     On inverse les surfaces sombres plutôt que de forcer
     print-color-adjust : ce réglage reste à la main du visiteur, et il
     noircirait des pages entières pour rien. Le site s'imprime donc clair,
     comme l'attestation.
     ------------------------------------------------------------------ */
  @media print{
    @page{margin:16mm}
    html{scroll-behavior:auto}
    body{background:#fff;color:var(--forge);font-size:11.5pt;line-height:1.5}
    .saut{display:none}
    .wrap{max-width:none;padding:0}

    /* le manche et tout ce qui vivait dessus */
    .manche{background:#fff;color:var(--forge);border-bottom:1.5pt solid var(--laiton)}
    .bar{border-bottom:0;padding:0 0 10px}
    .bar nav{display:none}
    .brand{color:var(--forge)}
    .kicker{color:var(--lien)}
    .hero p,.hero p b{color:var(--forge)}
    .cmd{background:#F7F3EA;border-color:var(--laiton);color:var(--lien)}
    .btn,.btn.ghost{background:transparent;border:1pt solid var(--lien);color:var(--lien)}

    /* les démonstrations de commande : sans ça, les chiffres s'effacent */
    pre{background:#F7F3EA;color:var(--doux);border-left:3pt solid var(--laiton)}
    pre .w{color:var(--forge);font-weight:700}
    pre .d{color:var(--cendre)}
    pre .g{color:var(--lien)}
    /* .v et .r portent un SENS, pas un accent : les imprimer en brun comme
       le laiton effacerait la distinction entre confirmé et réfuté. Valeurs
       choisies pour le fond clair d'impression, mesurées sur #F7F3EA :
       #2F5D43 donne 6,85:1 et #8C2F26 donne 7,44:1, les deux au niveau AA.
       Le vert-de-gris #5E7A66 de la marque n'y atteint que 4,26:1. */
    pre .v,.verdict.ok{color:#2F5D43}
    pre .r,.verdict.ko{color:#8C2F26}

    /* Les encarts sombres des pages : le nom, l'appel, la promesse, les
       en-têtes de tableau. Les paragraphes DESCENDANTS sont visés
       explicitement : .fort p et .appel p posent leur propre blanc, et les
       couvrir seulement au niveau du bloc laissait le texte invisible. */
    .nom-bloc,.appel,.fort{background:#F7F3EA;color:var(--doux);
      border-left:3pt solid var(--laiton)}
    .nom-bloc p,.appel p,.fort p{color:var(--doux)}
    .nom-bloc b,.appel b,.fort b{color:var(--forge)}
    th{background:#F7F3EA;color:var(--forge);border-bottom:1pt solid var(--laiton)}

    /* Le badge du hero. Troisième occurrence du même piège : un texte clair
       sur fond sombre disparait quand le navigateur n'imprime pas les fonds.
       Et il ne se balance pas sur papier : l'animation au défilement est figée
       sur sa première image, donc penchée, si on ne la coupe pas. */
    .porte{transform:none !important;animation:none !important}
    .cordon,.badge .fente{display:none}
    .badge{box-shadow:inset 0 0 0 1pt var(--ivoire-2) !important}
    .badge .tete{background:#F7F3EA;color:var(--forge);
      border-bottom:1pt solid var(--laiton)}
    .badge .tete em{color:var(--lien)}

    footer{background:#fff;color:var(--doux);border-top:1pt solid var(--filet);padding:18px 0 0}
    footer a{color:var(--lien)}
    footer .liens{display:none}

    /* une adresse imprimée doit rester joignable */
    main a[href^="http"]::after,footer .credit a[href^="http"]::after{
      content:" (" attr(href) ")";font-size:8.5pt;color:var(--cendre);word-break:break-all}

    section{page-break-inside:avoid}
    h1,h2,h3{page-break-after:avoid}
    img{page-break-inside:avoid}
  }
`;

const STYLE = `
  :root{
    --forge:#14120F;--forge-2:#1F1B16;--laiton:#B8863B;--laiton-clair:#E0B65C;
    --ivoire:#F2EBDD;--ivoire-2:#DCD2BE;--cendre:#6F6658;
    --papier:#FBF9F4;--doux:#433C32;--filet:#E3DBCA;--lien:#7A5115;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--papier);color:var(--forge);
    font-family:"Avenir Next","Helvetica Neue",Segoe UI,system-ui,sans-serif;
    font-size:16px;line-height:1.68;-webkit-font-smoothing:antialiased}
  code,pre{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace}
  img{max-width:100%;height:auto}
  a{color:var(--lien)}
  a:focus-visible,button:focus-visible{outline:3px solid var(--laiton);outline-offset:3px;border-radius:2px}
  .wrap{max-width:900px;margin:0 auto;padding:0 24px}
  .saut{position:absolute;left:-9999px;top:0;background:var(--laiton);color:#14120F;
    padding:10px 16px;font-weight:600;z-index:10}
  .saut:focus{left:8px;top:8px}

  .manche{background:var(--forge);color:#fff}
  .bar{display:flex;align-items:center;justify-content:space-between;gap:16px;
    padding:14px 0;border-bottom:1px solid rgba(255,255,255,.12);flex-wrap:wrap}
  .brand{display:flex;align-items:center;gap:11px;font-size:18px;font-weight:600;
    color:#fff;text-decoration:none;padding:8px 0;min-height:44px}
  .bar nav{display:flex;gap:4px;flex-wrap:wrap}
  .bar nav a{color:rgba(255,255,255,.82);text-decoration:none;font-size:14.5px;
    padding:11px 10px;min-height:44px;display:inline-flex;align-items:center}
  .bar nav a:hover,.bar nav a:focus-visible{color:#fff;text-decoration:underline}

  h1{font-size:44px;font-weight:600;letter-spacing:-1.2px;line-height:1.08;margin:0}
  .kicker{font-size:11.5px;font-weight:700;letter-spacing:2.6px;
    text-transform:uppercase;color:var(--laiton-clair);margin-bottom:16px}

  footer{background:var(--forge-2);color:rgba(255,255,255,.78);padding:40px 0;font-size:14.5px}
  footer a{color:var(--laiton-clair)}
  footer a:hover,footer a:focus-visible{text-decoration:underline}
  footer .liens{display:flex;gap:6px 22px;flex-wrap:wrap;margin-bottom:20px}
  footer .liens a{padding:9px 0;min-height:44px;display:inline-flex;align-items:center;
    text-decoration:none}
  footer .credit{margin:0}
  /* Le site applique à lui-même la règle qu'il vend : un chiffre annoncé doit
     être recalculable. Celui-ci est inscrit à la construction par
     scripts/build-site.mjs, qui relit le fichier écrit et échoue si le compte
     n'y est pas. */
  footer .poids{margin:10px 0 0;font-size:12.5px;color:rgba(255,255,255,.52)}
  footer .poids b{color:var(--laiton-clair);font-weight:600}
  footer .credit a{text-decoration:none;border-bottom:1px solid transparent}
  footer .credit a:hover,footer .credit a:focus-visible{border-bottom-color:var(--laiton-clair);text-decoration:none}

  @media (max-width:760px){ h1{font-size:32px} }
  @media (prefers-reduced-motion:reduce){ html{scroll-behavior:auto} *{animation:none!important;transition:none!important} }

`;

const NAV = [
  { href: "/docs/", libelle: "Documentation" },
  { href: "/docs/01-demarrage.html", libelle: "Démarrer" },
  { href: site.depot, libelle: "GitHub", externe: true },
  { href: site.npm, libelle: "npm", externe: true },
];

/**
 * @param {{titre:string, description:string, chemin:string, corps:string, styleEnPlus?:string}} page
 */
export function coquille(page) {
  const canonical = `${site.url}${page.chemin}`;

  // Une page sans vignette ne doit pas partir en production : elle se
  // partagerait sans image. On échoue à la construction plutôt qu'en silence.
  const vignette = VIGNETTES[page.chemin];
  if (!vignette) {
    throw new Error(
      `Aucune vignette de partage pour « ${page.chemin} ». ` +
        `Ajoutez-la dans site/og.mjs, puis relancez pnpm build:og.`,
    );
  }
  const imageOg = urlVignette(vignette.fichier);
  const nav = NAV.map(
    (l) => `<a href="${esc(l.href)}"${l.externe ? ' rel="noopener noreferrer"' : ""}>${esc(l.libelle)}</a>`,
  ).join("\n        ");
  const liensLegaux = pagesLegales
    .map((l) => `<a href="${esc(l.href)}">${esc(l.libelle)}</a>`)
    .join("\n      ");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.titre)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:site_name" content="${esc(site.nom)}">
<meta property="og:locale" content="${esc(site.locale)}">
<meta property="og:title" content="${esc(page.titre)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(imageOg)}">
<meta property="og:image:secure_url" content="${esc(imageOg)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(vignette.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.titre)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${esc(imageOg)}">
<meta name="twitter:image:alt" content="${esc(vignette.alt)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-64.png" sizes="64x64" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${STYLE}${page.styleEnPlus ?? ""}${IMPRESSION}</style>
</head>
<body>
<a class="saut" href="#contenu">Aller au contenu</a>

<header class="manche">
  <div class="wrap">
    <div class="bar">
      <a class="brand" href="/">${EMBLEME()}${esc(site.nom)}</a>
      <nav aria-label="Navigation principale">
        ${nav}
      </nav>
    </div>
${page.enTete ?? ""}
  </div>
</header>

<main id="contenu">
${page.corps}
</main>

<footer>
  <div class="wrap">
    <div class="liens">
      <a href="/">Accueil</a>
      <a href="/docs/">Documentation</a>
      <a href="/a-propos">À propos</a>
      ${liensLegaux}
      <a href="${esc(site.depot)}" rel="noopener noreferrer">GitHub</a>
    </div>
    <p class="credit">© ${annee} ${esc(site.nom)} · Conçu &amp; développé par <a href="/a-propos">${esc(auteur.nom)}</a></p>
    <p class="poids">Cette page pèse <b>__POIDS__</b> compressés et ne charge aucune ressource externe.</p>
  </div>
</footer>

</body>
</html>
`;
}
