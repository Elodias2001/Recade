import { demo, nb, site } from "../config.mjs";
import { coquille } from "../layout.mjs";

const style = `
  /* Direction « le sceau » : le hero n'est plus du texte posé sur la forge,
     c'est un FEUILLET d'ivoire posé dessus, avec la même anatomie que
     l'attestation que l'outil produit. Le site montre ce qu'il fabrique. */
  .manche{padding-bottom:0}
  .hero{padding:40px 0 64px}
  .feuillet{background:var(--ivoire);color:var(--forge);
    display:flex;gap:34px;align-items:center;padding:48px 40px 52px;
    border-top:3px solid var(--laiton)}
  .feuillet .mot{flex:1 1 auto;min-width:0}
  .hero .kicker{color:var(--lien)}
  .hero h1{font-size:50px;letter-spacing:-1.5px;line-height:1.05}
  .hero p{font-size:18.5px;line-height:1.55;color:var(--doux);margin:18px 0 0;max-width:30em}
  .hero p b{color:var(--forge);font-weight:600}
  .cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px;align-items:center}
  /* min-width:0 par précaution, pas pour corriger un défaut observé : un
     élément flex ne descend pas sous sa taille min-content sans lui, et
     cette commande fait 36 caractères en chasse fixe. Non vérifié en
     dessous de 500 px : Chrome headless refuse les fenêtres plus étroites
     et se contente de recadrer la capture, ce qui donne l'illusion d'une
     coupe. À contrôler sur un vrai téléphone. */
  .cmd{background:#FBF9F4;border:1px solid var(--laiton);
    padding:12px 16px;font-size:14px;color:var(--lien);
    font-family:ui-monospace,Menlo,monospace;
    min-width:0;max-width:100%;overflow-wrap:anywhere}
  .btn{display:inline-flex;align-items:center;padding:12px 20px;background:var(--laiton);
    color:#14120F;text-decoration:none;font-size:14.5px;font-weight:600;min-height:44px}
  .btn:hover,.btn:focus-visible{background:var(--laiton-clair)}
  .btn.ghost{background:transparent;border:1px solid var(--lien);color:var(--lien)}
  .btn.ghost:hover,.btn.ghost:focus-visible{background:rgba(184,134,59,.14)}

  /* ---- le badge au cordon ----
     Un ruban tissé qui descend de la barre sombre et pose le badge sur le
     feuillet. L'idée du composant Lanyard de React Bits, tenue sans three.js,
     sans React et sans WebAssembly : ici le texte reste du texte. */
  /* align-self flex-start, sinon la marge négative part du centre du feuillet
     et le cordon reste enfermé dedans au lieu de sortir sur la forge. */
  .porte{flex:0 0 auto;align-self:flex-start;display:flex;flex-direction:column;
    align-items:center;margin-top:-104px}
  .cordon{position:relative;width:150px;height:118px}
  .brin{position:absolute;bottom:0;left:50%;width:17px;height:118px;margin-left:-8.5px;
    transform-origin:bottom center;overflow:hidden;
    background:
      repeating-linear-gradient(48deg,rgba(20,18,15,.13) 0 1.5px,transparent 1.5px 4.5px),
      linear-gradient(90deg,#966C2E 0 2px,var(--laiton) 2px calc(100% - 2px),#966C2E calc(100% - 2px))}
  .brin.g{transform:rotate(-12deg)} .brin.d{transform:rotate(12deg)}
  .brin span{position:absolute;inset:0;writing-mode:vertical-rl;display:flex;
    align-items:center;justify-content:center;font-size:8px;font-weight:700;
    letter-spacing:4px;color:rgba(20,18,15,.6);white-space:nowrap}
  .ferrure{position:absolute;bottom:-26px;left:50%;margin-left:-17px;z-index:2}
  .badge{width:184px;background:#FBF9F4;color:var(--forge);text-align:left;
    box-shadow:inset 0 0 0 1px #CFC4AC,3px 3px 0 0 rgba(20,18,15,.22)}
  .badge .fente{width:40px;height:8px;margin:10px auto 2px;border-radius:4px;
    background:#14120F;opacity:.82}
  .badge .tete{background:var(--forge-2);color:var(--ivoire);padding:8px 11px;
    display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600}
  .badge .tete em{margin-left:auto;font-style:normal;font-size:8px;
    letter-spacing:1.3px;color:var(--laiton-clair)}
  .badge .corps{padding:10px 11px 12px}
  .badge .l{display:flex;justify-content:space-between;align-items:baseline;
    padding:4px 0;border-bottom:1px solid #E3DBCA;font-size:10.5px;color:#6F6658}
  .badge .l:last-of-type{border-bottom:0}
  .badge .l b{font-size:12.5px;color:var(--forge);font-family:ui-monospace,Menlo,monospace}
  /* C'est un verdict, donc il porte la classe des verdicts, et la valeur
     mesurée pour fond clair : #2F5D43 donne 6,85:1 sur l'ivoire. Lui
     inventer une teinte à part aurait contourné la règle du rang 1. */
  .badge .verdict{display:block;margin-top:7px;padding:5px 7px;font-size:10px;
    background:#F1F5F1;border-left:2px solid currentColor}
  .badge .verdict.ok{color:#2F5D43}

  @media screen and (prefers-reduced-motion: no-preference){
    @supports (animation-timeline: view()){
      .porte{animation:balancer linear both;animation-timeline:view();
        animation-range:entry 0% exit 100%;transform-origin:top center}
      @keyframes balancer{
        0%{transform:rotate(2.6deg)} 40%{transform:rotate(-1.4deg)}
        100%{transform:rotate(-2deg)}
      }
    }
  }
  @media (max-width:860px){
    /* Surtout PAS align-items:flex-start ici : en colonne, l'axe transversal
       est horizontal, et aligner au début fait prendre à la colonne de texte
       sa largeur intrinsèque, donc les 30em du paragraphe. Le texte sortait
       de l'écran. On laisse l'étirement par défaut. */
    .feuillet{flex-direction:column;padding:34px 24px}
    .mot{width:100%}
    .porte{margin-top:20px;align-self:center}
    .cordon{display:none}            /* sans la barre au-dessus, le cordon pend dans le vide */
    .hero h1{font-size:33px}
  }

  section{padding:60px 0;border-bottom:1px solid var(--filet)}
  section:last-of-type{border-bottom:0}
  h2{font-size:13px;font-weight:700;letter-spacing:1.9px;text-transform:uppercase;
    color:var(--cendre);margin:0 0 22px}
  h3{font-size:27px;font-weight:600;letter-spacing:-.6px;margin:0 0 16px;line-height:1.25}
  p.lead{font-size:17px;color:var(--doux);max-width:36em;margin:0 0 18px}
  p.lead b{color:var(--forge);font-weight:600}
  pre{background:var(--forge);color:#EDE6D8;padding:20px 22px;overflow-x:auto;
    border-left:3px solid var(--laiton);font-size:13px;line-height:1.7;margin:22px 0 0}
  /* La frappe du terminal, en TEXTE et jamais en vidéo : la sortie reste
     sélectionnable, copiable, lisible à voix haute et imprimable. Sans
     support ou en mouvement réduit, elle est là d'emblée, entière. */
  /* width:max-content, sinon le bloc prend la largeur du pre et le texte en
     white-space:pre déborde SANS élargir le pre : à 320 px la ligne Stack
     était coupée de 314 px, et aucune barre ne permettait d'aller la lire.
     min-width:100% garde la ligne pleine largeur sur grand écran. */
  .terminal .l{display:block;white-space:pre;width:max-content;min-width:100%}
  .releve{margin-top:12px;font-size:13px;color:var(--cendre);max-width:36em}
  .bascule{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;
    clip-path:inset(50%);white-space:nowrap}
  .rejouer{display:inline-block;margin-left:6px;font-size:12px;letter-spacing:.6px;
    color:var(--lien);cursor:pointer;border-bottom:1px dotted var(--laiton);
    user-select:none;padding:2px 0}
  .rejouer:hover{border-bottom-style:solid}
  .bascule:focus-visible+pre+.releve .rejouer{outline:2px solid var(--laiton);outline-offset:2px}

  @media screen and (prefers-reduced-motion: no-preference){
    @supports (animation-timeline: view()){
      /* --i porte le rang de la ligne : une règle décalée au lieu de dix. */
      /* La frappe découvre la ligne par la droite. On anime clip-path et non
         width : une largeur animée se bat avec max-content et rognait le
         défilement horizontal. Sans animation, aucun clip n'est posé, donc
         l'état par défaut reste la ligne entière.
         --i porte le rang de la ligne : une règle décalée au lieu de dix. */
      .terminal .l{animation:frappe linear both;animation-timeline:view();
        animation-range:entry calc(16% + var(--i) * 5%) entry calc(30% + var(--i) * 5%)}
      @keyframes frappe{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
      #rejouer:checked~.terminal .l{animation-name:frappe-bis}
      @keyframes frappe-bis{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
    }
  }
  pre .g{color:var(--laiton-clair)} pre .d{color:#A79B87}
  pre .w{color:#fff;font-weight:600}
  /* Les deux seules couleurs sémantiques du produit : confirmé et réfuté.
     Elles ne décorent jamais rien, un test le vérifie. Deux valeurs par
     sens, parce qu'aucune teinte ne tient le contraste AA sur les deux
     fonds : mesuré, le vert-de-gris #5E7A66 de la marque ne fait que
     3,96:1 sur la forge et 4,26:1 sur le papier d'impression. */
  pre .v,.verdict.ok{color:#9CCBA8}    /* 10,26:1 sur forge */
  pre .r,.verdict.ko{color:#E5A196}    /*  8,79:1 sur forge */
  .verdict{font-weight:600}
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
      <div class="feuillet">
        <div class="mot">
          <p class="kicker">Montre la récade</p>
          <h1>Atteste ce que<br>tu as construit.</h1>
          <p>
            Un CV affirme. <b>Récade compte, puis laisse réfuter.</b>
            Un CLI local lit ton dépôt Git, y compris privé, y compris sous NDA,
            et n'en fait sortir que des nombres.
          </p>
          <div class="cta">
            <span class="cmd">npx @elodias/recade scan ~/mon-depot</span>
            <a class="btn" href="/docs/01-demarrage.html">Démarrer</a>
            <a class="btn ghost" href="${site.depot}" rel="noopener noreferrer">Voir le code</a>
          </div>
        </div>

        <div class="porte">
          <div class="cordon" aria-hidden="true">
            <div class="brin g"><span>RÉCADE</span></div>
            <div class="brin d"><span>RÉCADE</span></div>
            <svg class="ferrure" width="34" height="46" viewBox="0 0 34 46" focusable="false">
              <ellipse cx="17" cy="9" rx="8" ry="7.5" fill="none" stroke="#C9973F" stroke-width="2.8"/>
              <rect x="8" y="15" width="18" height="11" rx="2" fill="#C9973F"/>
              <rect x="8" y="15" width="18" height="3.6" rx="2" fill="#E8C070"/>
              <path d="M12 26 v14 h10 V26" fill="none" stroke="#C9973F" stroke-width="2.6"/>
            </svg>
          </div>
          <div class="badge">
            <div class="fente" aria-hidden="true"></div>
            <div class="tete">
              <svg viewBox="0 0 64 64" width="14" height="14" aria-hidden="true" focusable="false">
                <circle cx="32" cy="32" r="30" fill="none" stroke="#B8863B" stroke-width="3.4"/>
                <path d="M32 16 L42 26 L42 38 L32 48 L22 38 L22 26 Z" fill="#B8863B"/>
              </svg>
              ${demo.depot}<em>ATTESTATION</em>
            </div>
            <div class="corps">
              <div class="l"><span>Commits signés</span><b>${nb(demo.commitsSignes)}</b></div>
              <div class="l"><span>Rang</span><b>${demo.rang}er / ${demo.equipe}</b></div>
              <div class="l"><span>Fusions relues</span><b>${nb(demo.fusions)}</b></div>
              <div class="verdict ok">Attestation confirmée</div>
            </div>
          </div>
        </div>
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
<input type="checkbox" id="rejouer" class="bascule">
<pre class="terminal"><span class="l" style="--i:0"><span class="d">$</span> <span class="w">npx @elodias/recade scan ~/Projets/${demo.depot}</span></span>
<span class="l" style="--i:1"> </span>
<span class="l" style="--i:2">  <span class="g">◆</span>  <span class="w">RÉCADE</span>   <span class="d">attestation de contribution</span></span>
<span class="l" style="--i:3">     <span class="w">${demo.depot}</span> <span class="d">· scan local, aucun code transmis</span></span>
<span class="l" style="--i:4"> </span>
<span class="l" style="--i:5">  <span class="d">Période             </span>${demo.periode}</span>
<span class="l" style="--i:6">  <span class="d">Commits signés      </span><span class="w">${nb(demo.commitsSignes)}</span> / ${nb(demo.commitsTotal)}   <span class="d">${demo.rang}er contributeur sur ${demo.equipe}</span></span>
<span class="l" style="--i:7">  <span class="d">Fusions intégrées   </span><span class="w">${nb(demo.fusions)}</span>   <span class="d">relues sous votre responsabilité</span></span>
<span class="l" style="--i:8">  <span class="d">Volume du dépôt     </span>${nb(demo.lignes)} lignes TypeScript</span>
<span class="l" style="--i:9">  <span class="d">Stack détectée      </span>${demo.stack}</span></pre>
    <p class="releve">
      Sortie réelle, relevée le ${demo.releve}. Les compteurs d'un dépôt vivant
      bougent : un chiffre publié sans sa date ne veut rien dire.
      <label for="rejouer" class="rejouer">Rejouer</label>
    </p>
    <p class="lead" style="margin-top:22px">
      <b>${nb(demo.fusions)} fusions relues.</b> Tu n'as pas <i>dit</i> que tu encadres des juniors :
      tu as validé le travail des autres ${nb(demo.fusions)} fois. C'est la définition factuelle
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
<pre><span class="d">$</span> <span class="w">npx @elodias/recade verify attestation.html ~/Projets/${demo.depot}</span>

  <span class="v">✓</span> Premier commit        ${demo.premierCommit}
  <span class="v">✓</span> Commits signés        ${demo.commitsSignes}
  <span class="v">✓</span> Rang                  ${demo.rang}
  <span class="v">✓</span> Fusions revendiquées  ${demo.fusions} réelles
  <span class="v">✓</span> Lignes TypeScript     ${demo.lignes}

  <span class="verdict ok">✓ Attestation confirmée</span> <span class="d">: tous les compteurs se recalculent à l'identique.</span></pre>
    <p class="lead" style="margin-top:22px">Gonflez un chiffre, et&nbsp;:</p>
<pre>  <span class="r">✗</span> Commits signés        <span class="r">${demo.commitsSignes}</span>   <span class="d">attesté : ${demo.gonfle}</span>

  <span class="verdict ko">✗ Attestation réfutée</span> <span class="d">: au moins un compteur ne tient pas.</span></pre>
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
<pre><span class="d">$</span> <span class="w">npx @elodias/recade scan ~/alpha ~/beta ~/gamma --pdf dossier.pdf</span>

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
