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
`;

const enTete = `
    <div class="hero">
      <p class="kicker">Informations légales</p>
      <h1>Mentions légales</h1>
      <p>Qui édite ce site, qui l'héberge, et comment me joindre.</p>
    </div>`;

const corps = `<div class="wrap">
  <div class="texte">

    <p class="maj">Dernière mise à jour : ${esc(legal.miseAJour)}</p>

    <h2>Éditeur du site</h2>
    <ul>
      <li><b>${esc(auteur.nomComplet)}</b>, personne physique</li>
      <li>${esc(auteur.role)}, ${esc(auteur.ville)}, ${esc(auteur.pays)}</li>
      <li>Contact : <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a></li>
      <li>Identifiant Fiscal Unique : <b>${esc(auteur.ifu)}</b></li>
    </ul>
    <p>
      Ce site est édité à titre personnel. Il ne vend rien, ne propose aucun
      abonnement et n'exerce aucune activité commerciale : c'est la vitrine et la
      documentation d'un logiciel libre.
    </p>

    <h2>Directeur de la publication</h2>
    <p>${esc(auteur.nom)}.</p>

    <h2>Hébergement</h2>
    <ul>
      <li><b>${esc(hebergement.fournisseur)}</b></li>
      <li>${esc(hebergement.adresse)}</li>
      <li><a href="${esc(hebergement.site)}" rel="noopener noreferrer">${esc(hebergement.site)}</a></li>
      <li>Serveur physiquement situé à <b>${esc(hebergement.localisation)}</b></li>
    </ul>
    <p>
      La résolution des noms de domaine passe par Cloudflare en mode
      « DNS only » : le trafic du site ne transite pas par Cloudflare, seules les
      requêtes DNS y sont traitées.
    </p>

    <h2>Propriété intellectuelle</h2>
    <p>
      Le logiciel ${esc(site.nom)} est publié sous <b>licence ${esc(site.licence)}</b>.
      Son code source est consultable et réutilisable dans les conditions de cette
      licence : <a href="${esc(site.depot)}" rel="noopener noreferrer">${esc(site.depot)}</a>.
    </p>
    <p>
      Les textes, la documentation et l'identité visuelle de ce site restent la
      propriété de leur auteur. La direction artistique s'inspire de l'orfèvrerie
      royale d'Abomey, dont les motifs relèvent du patrimoine culturel béninois.
    </p>

    <h2>Responsabilité</h2>
    <p>
      ${esc(site.nom)} est fourni « en l'état », sans garantie, conformément aux
      termes de la licence ${esc(site.licence)}. Les chiffres qu'il produit sont
      issus de vos propres dépôts : leur exactitude dépend de leur contenu et des
      identités que vous déclarez. L'outil ne se substitue à aucune vérification
      humaine.
    </p>
    <p>
      Les liens sortants (dépôt de code, registre npm, sites tiers) ne relèvent pas
      de la responsabilité de l'éditeur.
    </p>

    <h2>Données personnelles</h2>
    <p>
      Ce site ne collecte aucune donnée saisie et ne dépose aucun cookie. Le détail
      se trouve dans la <a href="/confidentialite">politique de confidentialité</a>.
    </p>

    <h2>Contact</h2>
    <p>
      Pour toute question relative à ce site ou au logiciel :
      <a href="mailto:${esc(auteur.email)}">${esc(auteur.email)}</a>.
    </p>

  </div>
</div>`;

export default coquille({
  titre: `Mentions légales | ${site.nom}`,
  description: `Éditeur, directeur de la publication et hébergeur du site ${site.nom}.`,
  chemin: "/mentions-legales",
  enTete,
  styleEnPlus: style,
  corps,
});
