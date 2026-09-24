import { auteur, hebergement, legal, site } from "../config.mjs";
import { coquille, esc } from "../layout.mjs";

const style = `
  .manche{padding-bottom:44px}
  .hero{padding-top:44px}
  .hero p{font-size:16.5px;color:rgba(255,255,255,.82);margin:16px 0 0;max-width:34em}
  .texte{padding:52px 0 64px;max-width:44em}
  .texte h2{font-size:20px;font-weight:600;letter-spacing:-.3px;margin:38px 0 12px;
    padding-top:18px;border-top:1px solid var(--filet)}
  .texte h2:first-of-type{margin-top:0;padding-top:0;border-top:0}
  .texte p,.texte li{color:var(--doux)}
  .texte p{margin:0 0 14px}
  .texte ul{margin:0 0 16px;padding-left:22px}
  .texte li{margin-bottom:7px}
  .texte li::marker{color:var(--laiton)}
  .texte b{color:var(--forge);font-weight:600}
  .maj{display:inline-block;background:#FAF4E8;border:1px solid var(--ivoire-2);
    padding:7px 13px;font-size:13.5px;color:var(--cendre);border-radius:4px}
  .fort{background:var(--forge);color:#fff;border-radius:6px;padding:22px 24px;margin:0 0 30px}
  .fort p{color:rgba(255,255,255,.88);margin:0}
  .fort b{color:#fff}
  table{width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14.5px}
  th{text-align:left;background:var(--forge);color:#fff;padding:10px 12px;
    font-size:11px;letter-spacing:.9px;text-transform:uppercase;font-weight:600}
  td{padding:10px 12px;border-bottom:1px solid var(--filet);vertical-align:top;color:var(--doux)}
  tbody tr:nth-child(even){background:#F7F2E7}
`;

const enTete = `
    <div class="hero">
      <p class="kicker">Données personnelles</p>
      <h1>Politique de confidentialité</h1>
      <p>Ce que ce site enregistre, ce qu'il n'enregistre pas, et ce que vous
         pouvez exiger.</p>
    </div>`;

const corps = `<div class="wrap">
  <div class="texte">

    <p class="maj">Dernière mise à jour : ${esc(legal.miseAJour)}</p>

    <div class="fort">
      <p>
        <b>Ce site ne vous demande rien.</b> Aucun formulaire, aucun compte, aucun
        cookie, aucune mesure d'audience. Seuls les journaux techniques du serveur
        enregistrent votre adresse IP, comme le fait tout serveur web. Rien d'autre.
      </p>
    </div>

    <h2>Qui est responsable</h2>
    <p>
      ${esc(auteur.nomComplet)}, ${esc(auteur.ville)}, ${esc(auteur.pays)}.
      Contact : <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>.
    </p>

    <h2>Ce qui est enregistré</h2>
    <table>
      <thead>
        <tr><th scope="col">Donnée</th><th scope="col">Par quoi</th><th scope="col">Pourquoi</th><th scope="col">Durée</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Adresse IP, date, page demandée, navigateur</td>
          <td>Journaux du serveur web et du routeur (nginx, Traefik)</td>
          <td>Faire fonctionner le site et repérer les abus</td>
          <td>${esc(hebergement.journaux)}</td>
        </tr>
      </tbody>
    </table>
    <p>
      Ces journaux ne sont ni consultés au quotidien, ni recoupés, ni exportés, ni
      transmis à qui que ce soit. Ils tournent automatiquement et s'effacent au fil
      de l'écriture.
    </p>
    <p>
      La base de ce traitement est l'<b>intérêt légitime</b> à maintenir un service
      en ligne fonctionnel et sûr.
    </p>

    <h2>Ce qui n'est pas fait</h2>
    <ul>
      <li>Aucun <b>cookie</b> n'est déposé, d'aucune sorte.</li>
      <li>Aucun <b>stockage local</b> dans votre navigateur.</li>
      <li>Aucune <b>mesure d'audience</b>, aucun pixel, aucune publicité.</li>
      <li>Aucune <b>police</b>, aucun script ni aucune image chargés depuis un tiers : tout est servi par ce site.</li>
      <li>Aucun <b>compte</b>, donc aucun mot de passe et aucun profil.</li>
      <li>Aucun <b>paiement</b>, aucune donnée bancaire.</li>
    </ul>
    <p>
      C'est aussi pourquoi vous ne verrez pas de bandeau de consentement : il n'y a
      rien à consentir. Un bandeau n'aurait servi qu'à faire sérieux.
    </p>

    <h2>Le logiciel ${esc(site.nom)}, lui, ne transmet rien</h2>
    <p>
      Le programme en ligne de commande s'exécute entièrement sur votre machine. Il
      lit vos dépôts Git, compte, et <b>n'effectue aucun appel réseau</b> : ni
      télémétrie, ni remontée d'erreurs, ni vérification de version. Rien de ce que
      vous scannez ne parvient à l'auteur ni à un tiers.
    </p>
    <p>
      C'est vérifiable : le code est ouvert, et tous les appels externes sont
      regroupés dans deux fichiers du dépôt.
    </p>

    <h2>Qui d'autre intervient</h2>
    <ul>
      <li>
        <b>${esc(hebergement.fournisseur)}</b>, hébergeur du serveur, situé à
        ${esc(hebergement.localisation)}. Il traite les journaux techniques pour le
        compte de l'éditeur.
      </li>
      <li>
        <b>Cloudflare</b>, uniquement pour la résolution du nom de domaine, en mode
        « DNS only ». Le trafic du site ne transite pas par ses serveurs.
      </li>
    </ul>
    <p>
      Les liens vers GitHub, npm, WhatsApp ou mon portfolio sont de simples liens :
      aucune donnée ne leur est transmise tant que vous ne cliquez pas. Une fois
      chez eux, ce sont leurs propres politiques qui s'appliquent.
    </p>

    <h2>Vos droits</h2>
    <p>
      Vous pouvez demander l'accès, la rectification, l'effacement ou la limitation
      des données vous concernant, et vous opposer à leur traitement. En pratique,
      la seule donnée existante est une adresse IP dans un journal technique : dans
      la plupart des cas elle aura déjà disparu par rotation.
    </p>
    <p>
      Écrivez à <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>. Je
      réponds personnellement, sous trente jours au plus.
    </p>
    <p>
      En cas de désaccord, vous pouvez saisir l'autorité compétente :
      <b>${esc(legal.autorite.nom)}</b> au ${esc(legal.autorite.pays)}
      (<a href="${esc(legal.autorite.site)}" rel="noopener noreferrer">${esc(legal.autorite.site)}</a>).
      Le serveur étant situé en France, les personnes résidant dans l'Union
      européenne peuvent également saisir l'autorité de leur pays.
    </p>

    <h2>Mineurs</h2>
    <p>
      Ce site s'adresse à des développeurs et ne vise pas les mineurs. Comme rien
      n'est collecté, aucune donnée de mineur ne peut l'être davantage.
    </p>

    <h2>Sécurité</h2>
    <p>
      Le site est servi exclusivement en HTTPS, avec un certificat renouvelé
      automatiquement. Il ne contient aucune base de données et n'exécute aucun
      code côté serveur : c'est un ensemble de fichiers statiques.
    </p>

    <h2>Modification</h2>
    <p>
      Toute évolution du site qui introduirait une collecte, un cookie ou un
      prestataire entraînera la mise à jour de cette page et de sa date. La règle
      est inscrite dans les conventions du projet pour ne pas être oubliée.
    </p>

  </div>
</div>`;

export default coquille({
  titre: `Politique de confidentialité | ${site.nom}`,
  description: `Ce site ne dépose aucun cookie et ne collecte aucune donnée saisie. Seuls les journaux techniques du serveur enregistrent une adresse IP.`,
  chemin: "/confidentialite",
  enTete,
  styleEnPlus: style,
  corps,
});
