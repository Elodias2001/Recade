import { site } from "../config.mjs";
import { coquille } from "../layout.mjs";

const style = `
  .manche{padding-bottom:60px}
  .hero{padding-top:56px;display:flex;gap:48px;align-items:center}
  .hero h1{font-size:52px;letter-spacing:-1.6px;line-height:1.04}
  .hero p{font-size:19px;line-height:1.55;color:rgba(255,255,255,.86);margin:20px 0 0;max-width:30em}
  .hero p b{color:#fff;font-weight:600}
  .cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px;align-items:center}
  .cmd{background:rgba(255,255,255,.08);border:1px solid rgba(184,134,59,.5);
    padding:12px 16px;font-size:14px;color:var(--laiton-clair);
    font-family:ui-monospace,Menlo,monospace}
  .btn{display:inline-flex;align-items:center;padding:12px 20px;background:var(--laiton);
    color:#14120F;text-decoration:none;font-size:14.5px;font-weight:600;min-height:44px}
  .btn:hover,.btn:focus-visible{background:var(--laiton-clair)}
  .btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff}
  .btn.ghost:hover,.btn.ghost:focus-visible{background:rgba(255,255,255,.1)}

  section{padding:60px 0;border-bottom:1px solid var(--filet)}
  section:last-of-type{border-bottom:0}
  h2{font-size:13px;font-weight:700;letter-spacing:1.9px;text-transform:uppercase;
    color:var(--cendre);margin:0 0 22px}
  h3{font-size:27px;font-weight:600;letter-spacing:-.6px;margin:0 0 16px;line-height:1.25}
  p.lead{font-size:17px;color:var(--doux);max-width:36em;margin:0 0 18px}
  p.lead b{color:var(--forge);font-weight:600}
  pre{background:var(--forge);color:#EDE6D8;padding:20px 22px;overflow-x:auto;
    border-left:3px solid var(--laiton);font-size:13px;line-height:1.7;margin:22px 0 0}
  pre .g{color:var(--laiton-clair)} pre .d{color:#A79B87} pre .v{color:#9CCBA8}
  pre .r{color:#E5A196} pre .w{color:#fff;font-weight:600}
  .duo{display:grid;grid-template-columns:1fr 1fr;gap:32px}
  .carte{border:1px solid var(--filet);border-top:2px solid var(--laiton);padding:22px}
  .carte h4{margin:0 0 8px;font-size:17px;font-weight:600}
  .carte p{margin:0;font-size:15px;color:var(--doux)}
  .aveu{background:#FAF4E8;border-left:3px solid var(--laiton);padding:18px 22px;
    font-size:15.5px;color:var(--doux);margin:22px 0 0}
  .aveu b{color:var(--forge)}
  .nom-bloc{background:var(--forge);color:rgba(255,255,255,.84);padding:26px 28px;
    border-radius:4px;margin-top:22px;line-height:1.7}
  .nom-bloc b{color:#fff}
  @media (max-width:760px){
    .hero{flex-direction:column;align-items:flex-start;gap:28px;padding-top:40px}
    .hero h1{font-size:34px} .duo{grid-template-columns:1fr} section{padding:44px 0}
  }
`;

const enTete = `
    <div class="hero">
      <div>
        <p class="kicker">Montre la récade</p>
        <h1>Atteste ce que<br>tu as construit.</h1>
        <p>
          Un CV affirme. <b>Récade compte, puis laisse réfuter.</b>
          Un CLI local lit ton dépôt Git, y compris privé, y compris sous NDA,
          et n'en fait sortir que des nombres.
        </p>
        <div class="cta">
          <span class="cmd">npx recade scan ~/mon-depot</span>
          <a class="btn" href="/docs/01-demarrage.html">Démarrer</a>
          <a class="btn ghost" href="${site.depot}" rel="noopener noreferrer">Voir le code</a>
        </div>
      </div>
      <div>
        <svg viewBox="0 0 64 64" width="150" height="150" aria-hidden="true" focusable="false">
          <circle cx="32" cy="32" r="30" fill="none" stroke="#B8863B" stroke-width="1.6"/>
          <circle cx="32" cy="32" r="24" fill="none" stroke="#B8863B" stroke-width="0.8" opacity=".5"/>
          <path d="M32 12.5 L43.8 24.3 L43.8 39.7 L32 51.5 L20.2 39.7 L20.2 24.3 Z" fill="none" stroke="#F2EBDD" stroke-width="1.8"/>
          <path d="M32 20.9 L38.3 27.1 L38.3 36.9 L32 43.1 L25.7 36.9 L25.7 27.1 Z" fill="#B8863B"/>
          <circle cx="32" cy="32" r="3.6" fill="#14120F"/>
        </svg>
      </div>
    </div>`;

const corps = `<div class="wrap">

  <section>
    <h2>Le problème</h2>
    <h3>« Premier contributeur d'une équipe de dix. »</h3>
    <p class="lead">Personne ne peut le vérifier. N'importe qui peut écrire la même phrase.</p>
    <p class="lead">
      Et le meilleur travail d'un développeur sénior est justement celui qu'il ne
      peut pas montrer : dépôts privés, clients bancaires, plateformes d'État.
      <b>Plus on monte, moins on peut prouver.</b>
    </p>
    <p class="lead">
      Les autres outils exigent un accès à ton compte GitHub et envoient ton code
      à un modèle de langage. Inutilisable sur du travail confidentiel.
    </p>
  </section>

  <section>
    <h2>Ce que fait Récade</h2>
    <h3>Il lit <code>.git</code>, il compte, il n'écrit que des nombres.</h3>
<pre><span class="d">$</span> <span class="w">npx recade scan ~/Projets/inventaire</span>

  <span class="g">◆</span>  <span class="w">RÉCADE</span>   <span class="d">attestation de contribution</span>
     <span class="w">inventaire</span> <span class="d">· scan local, aucun code transmis</span>

  <span class="d">Période             </span>novembre 2025 → septembre 2026
  <span class="d">Commits signés      </span><span class="w">1 025</span> / 1 976   <span class="d">1er contributeur sur 7</span>
  <span class="d">Fusions intégrées   </span><span class="w">185</span>   <span class="d">relues sous votre responsabilité</span>
  <span class="d">Volume du dépôt     </span>142 228 lignes TypeScript
  <span class="d">Stack détectée      </span>Docker · Drizzle ORM · Hono · Next.js</pre>
    <p class="lead" style="margin-top:22px">
      <b>185 fusions relues.</b> Tu n'as pas <i>dit</i> que tu encadres des juniors :
      tu as validé le travail des autres 185 fois. C'est la définition factuelle
      de l'encadrement.
    </p>
  </section>

  <section>
    <h2>Réfutable</h2>
    <h3>Pas « prouvé ». Réfutable.</h3>
    <p class="lead">
      L'attestation embarque le commit d'ancrage, celui du premier commit et celui
      de chaque fusion revendiquée. Quiconque dispose du dépôt recalcule.
    </p>
<pre><span class="d">$</span> <span class="w">npx recade verify attestation.html ~/Projets/inventaire</span>

  <span class="v">✓</span> Premier commit        457c7ce8ae
  <span class="v">✓</span> Commits signés        1025
  <span class="v">✓</span> Rang                  1
  <span class="v">✓</span> Fusions revendiquées  185 réelles
  <span class="v">✓</span> Lignes TypeScript     142228

  <span class="v">✓ Attestation confirmée</span> <span class="d">: tous les compteurs se recalculent à l'identique.</span></pre>
    <p class="lead" style="margin-top:22px">Gonflez un chiffre, et&nbsp;:</p>
<pre>  <span class="r">✗</span> Commits signés        <span class="r">1025</span>   <span class="d">attesté : 1800</span>

  <span class="r">✗ Attestation réfutée</span> <span class="d">: au moins un compteur ne tient pas.</span></pre>
  </section>

  <section>
    <h2>Ce qui ne sort jamais</h2>
    <div class="duo">
      <div class="carte">
        <h4>Aucun appel réseau</h4>
        <p>Pas de télémétrie, pas de backend, pas de compte à créer. Le CLI interroge <code>git</code> et rien d'autre. Coupez le Wi-Fi : tout fonctionne.</p>
      </div>
      <div class="carte">
        <h4>Aucun contenu transmis</h4>
        <p>Les lignes sont comptées dans l'arbre du commit par Git lui-même. Votre code n'est ni lu ni envoyé, seulement dénombré.</p>
      </div>
      <div class="carte">
        <h4>Ouvert et auditable</h4>
        <p>Quelques centaines de lignes sous licence MIT. Un outil qui demande votre confiance et qu'on ne peut pas lire n'en mérite aucune.</p>
      </div>
      <div class="carte">
        <h4>Un document autonome</h4>
        <p>L'attestation HTML tient en 16 Ko sans aucune ressource externe. Joignable, imprimable, archivable dix ans.</p>
      </div>
    </div>
  </section>

  <section>
    <h2>Dossiers</h2>
    <h3>Plusieurs plateformes, un document.</h3>
    <p class="lead">
      « Justifier de la conception et de la mise en production d'au moins deux
      plateformes d'envergure » ne se répond pas un dépôt à la fois.
    </p>
<pre><span class="d">$</span> <span class="w">npx recade scan ~/alpha ~/beta ~/gamma --pdf dossier.pdf</span>

  <span class="w">3</span> plateformes   <span class="w">2</span> en tête   <span class="w">1 683</span> commits   <span class="w">230</span> fusions</pre>
    <p class="lead" style="margin-top:22px">
      Aucun cumul n'est une estimation : ce sont des sommes de compteurs
      eux-mêmes réfutables.
    </p>
  </section>

  <section>
    <h2>Ce que Récade ne prouve pas</h2>
    <div class="aveu">
      <b>Un dépôt privé reste privé.</b> Un recruteur qui n'y a pas accès ne
      recalcule rien, et l'attestation l'écrit noir sur blanc plutôt que de le taire.
      La vérification s'adresse à celui qui détient le dépôt : l'ancien employeur,
      le client. <b>Récade ne remplace pas la prise de références, il la rend
      chiffrée.</b>
    </div>
    <div class="aveu">
      <b>Le sceau ne prouve rien.</b> Il sert à comparer deux attestations d'un
      coup d'œil. Seul <code>verify</code> contre le dépôt établit la vérité.
    </div>
  </section>

  <section>
    <h2>Le nom</h2>
    <div class="nom-bloc">
      La <b>récade</b>, en fon <i>makpo</i>, est le sceptre du roi d'Abomey, remis
      au messager pour garantir à son destinataire l'authenticité du message royal.
      La présenter équivalait juridiquement à la présence du roi : une extension
      portable de la souveraineté. C'est exactement ce qu'est une attestation, un
      petit objet qu'on remet, et qui parle à votre place.
    </div>
  </section>

</div>`;

export default coquille({
  titre: "Récade, atteste ce que tu as construit",
  description:
    "CLI local qui transforme un dépôt Git privé en attestation de contribution vérifiable. Aucun code ne quitte votre machine.",
  chemin: "/",
  enTete,
  styleEnPlus: style,
  corps,
});
