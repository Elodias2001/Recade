import { auteur, contacts, site } from "../config.mjs";
import { coquille, esc } from "../layout.mjs";

const style = `
  .manche{padding-bottom:52px}
  .hero{padding-top:48px}
  .hero p{font-size:17.5px;color:rgba(255,255,255,.86);margin:18px 0 0;max-width:34em}
  .colonnes{display:grid;grid-template-columns:260px 1fr;gap:46px;align-items:start;padding:56px 0}
  .portrait{margin:0}
  /* Le fichier est un 3:4. Affiché en pleine largeur de colonne il donne une
     bande trop haute : on le recadre à l'affichage, en gardant le visage et les
     bras croisés et en coupant le sol. Le fichier, lui, n'est pas retouché. */
  .portrait img{width:100%;display:block;border-radius:8px;
    aspect-ratio:4/5;object-fit:cover;object-position:50% 16%;
    box-shadow:0 2px 6px rgba(20,18,15,.10),0 14px 34px rgba(20,18,15,.13)}
  .portrait figcaption{margin-top:14px;font-size:13.5px;color:var(--cendre);
    border-left:2px solid var(--laiton);padding-left:12px}
  h2{font-size:27px;font-weight:600;letter-spacing:-.6px;margin:0 0 16px;line-height:1.25}
  h3{font-size:13px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;
    color:var(--cendre);margin:36px 0 12px}
  p{margin:0 0 16px;color:var(--doux);max-width:36em}
  p b{color:var(--forge);font-weight:600}
  .contacts{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;
    padding-top:26px;border-top:1px solid var(--filet)}
  .contacts a{display:inline-flex;align-items:center;gap:9px;padding:12px 20px;
    border:1px solid var(--ivoire-2);background:#fff;border-radius:999px;
    color:var(--forge);text-decoration:none;font-size:14.5px;font-weight:600;min-height:44px}
  .contacts a:hover,.contacts a:focus-visible{border-color:var(--laiton);background:#FAF4E8}
  .appel{background:var(--forge);color:#fff;border-radius:8px;padding:34px 32px;
    margin:0 0 64px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}
  .appel p{margin:0;color:rgba(255,255,255,.86);font-size:17px;max-width:30em}
  .appel .btn{display:inline-flex;align-items:center;padding:13px 22px;background:var(--laiton);
    color:#14120F;text-decoration:none;font-weight:600;font-size:14.5px;min-height:44px;white-space:nowrap}
  .appel .btn:hover,.appel .btn:focus-visible{background:var(--laiton-clair)}
  @media (max-width:760px){
    .colonnes{grid-template-columns:1fr;gap:28px;padding:34px 0}
    /* Sur mobile la colonne fait toute la largeur : un carré évite la bande. */
    .portrait img{aspect-ratio:1/1;object-position:50% 45%}
  }
`;

const enTete = `
    <div class="hero">
      <p class="kicker">À propos</p>
      <h1>La personne derrière ${esc(site.nom)}</h1>
      <p>Pas une équipe : un développeur en full remote, à ${esc(auteur.ville)},
         qui avait besoin de prouver ce qu'il avait construit et n'en avait pas
         le moyen.</p>
    </div>`;

const boutons = contacts
  .map(
    (c) => `<a href="${esc(c.href)}"${c.externe ? ' target="_blank" rel="noopener noreferrer"' : ""}>
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${c.icone}</svg>
          ${esc(c.libelle)}
        </a>`,
  )
  .join("\n        ");

const corps = `<div class="wrap">
  <div class="colonnes">

    <figure class="portrait">
      <img src="/img/elodias.jpg" width="750" height="1000" loading="eager" decoding="async"
           alt="${esc(auteur.nom)}, qui conçoit et développe ${esc(site.nom)}">
      <figcaption>${esc(auteur.nom)} · ${esc(auteur.ville)}, ${esc(auteur.pays)}</figcaption>
    </figure>

    <div>
      <h2>Salut, moi c'est Elodias.</h2>
      <p>
        Je suis <b>développeur web fullstack</b>, basé à ${esc(auteur.ville)} et en
        <b>full remote</b>. Je construis des applications web pour des entreprises
        à l'étranger, en ce moment pour une société américaine. Le reste du temps,
        je fais des outils comme celui-ci.
      </p>

      <h3>Pourquoi ${esc(site.nom)}</h3>
      <p>
        En montant un dossier de candidature, j'ai voulu montrer ce que j'avais
        réellement livré. Mes projets les plus lourds sont dans des <b>dépôts
        privés</b> : un parc informatique pour un établissement bancaire, une
        plateforme de collecte de résultats électoraux. Je ne pouvais rien montrer,
        et tout ce que j'écrivais sur mon CV restait invérifiable.
      </p>
      <p>
        Les outils existants demandent l'accès à votre compte GitHub et envoient
        votre code à un modèle de langage. Impossible sous accord de
        confidentialité, et c'est justement là que se trouve le travail qui compte.
      </p>
      <p>
        Alors j'ai écrit ${esc(site.nom)} : il lit <b>.git</b> en local, il compte,
        et il ne fait sortir que des nombres. Jamais une ligne de code. L'attestation
        embarque de quoi la recalculer, pour que celui qui détient le dépôt puisse
        la réfuter au lieu de me croire sur parole.
      </p>

      <h3>Comment je travaille</h3>
      <p>
        Je conçois, développe et fais tourner ${esc(site.nom)} de bout en bout, du
        code à l'hébergement. Le code est <b>ouvert, sous licence ${esc(site.licence)}</b> :
        un outil qui demande votre confiance et qu'on ne peut pas lire n'en mérite
        aucune.
      </p>
      <p>
        Quand tu m'écris, c'est moi qui réponds. Et chaque chiffre qui cloche, je le
        prends personnellement : c'est un outil de preuve.
      </p>

      <div class="contacts">
        ${boutons}
      </div>
    </div>

  </div>

  <div class="appel">
    <p>Tu as un dépôt privé dont tu voudrais prouver le contenu ? Commence par le scanner, en local, en une commande.</p>
    <a class="btn" href="/docs/01-demarrage.html">Démarrer</a>
  </div>
</div>`;

export default coquille({
  titre: `À propos | ${site.nom}`,
  description: `La personne derrière ${site.nom} : ${auteur.nom}, développeur fullstack à ${auteur.ville}, au ${auteur.pays}.`,
  chemin: "/a-propos",
  enTete,
  styleEnPlus: style,
  corps,
});
