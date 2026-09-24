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

export const esc = (v) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMBLEME = (taille = 28) => `<svg viewBox="0 0 64 64" width="${taille}" height="${taille}" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="none" stroke="#B8863B" stroke-width="2"/>
      <path d="M32 12.5 L43.8 24.3 L43.8 39.7 L32 51.5 L20.2 39.7 L20.2 24.3 Z" fill="none" stroke="#F2EBDD" stroke-width="2.2"/>
      <path d="M32 20.9 L38.3 27.1 L38.3 36.9 L32 43.1 L25.7 36.9 L25.7 27.1 Z" fill="#B8863B"/>
    </svg>`;

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
<meta property="og:title" content="${esc(page.titre)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonical)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${STYLE}${page.styleEnPlus ?? ""}</style>
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
  </div>
</footer>

</body>
</html>
`;
}
