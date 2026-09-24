/**
 * Source unique de l'identité du site.
 *
 * Toute coordonnée, tout lien et toute date légale vit ici. Les pages et le
 * pied de page l'importent : une adresse ne doit jamais être écrite deux fois,
 * sinon l'une des deux finit par mentir.
 */

export const site = {
  nom: "Récade",
  url: "https://recade.sabar.app",
  accroche: "Atteste ce que tu as construit, sans faire sortir une ligne de code.",
  depot: "https://github.com/Elodias2001/Recade",
  npm: "https://www.npmjs.com/package/@elodias/recade",
  licence: "MIT",
};

export const auteur = {
  nom: "Elodias ADIMOU",
  nomComplet: "Elodias ADIMOU KPOSSI",
  role: "Développeur web fullstack",
  mode: "Full remote",
  ville: "Cotonou",
  pays: "Bénin",
  email: "nounagnonadimou@gmail.com",
  whatsapp: "https://wa.me/22967770115",
  // Identifiant Fiscal Unique, relevé sur l'attestation fiscale (réf.
  // CIM2308178175232). Il doit figurer sur les factures et actes officiels,
  // il a donc sa place dans les mentions légales. Le NPI, lui, est un numéro
  // personnel : il n'est pas publié.
  ifu: "0202345403945",
  portfolio: "https://elodias-adimou.netlify.app",
};

/**
 * Hébergement, tel que réellement constaté sur l'infrastructure : VPS Hostinger
 * derrière Traefik, DNS Cloudflare en mode « DNS only ». À corriger ici si
 * l'infrastructure change, sous peine de rendre les mentions légales fausses.
 */
export const hebergement = {
  fournisseur: "Hostinger International Ltd.",
  adresse: "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
  site: "https://www.hostinger.fr",
  // Localisation physique du serveur, relevée sur la machine elle-même le
  // 24/09/2026 (AS47583 Hostinger, srv1623115.hstgr.cloud). À revérifier en cas
  // de migration : les mentions légales deviendraient fausses.
  localisation: "Paris, France",
  dns: "Cloudflare, en mode « DNS only » : le trafic ne transite pas par Cloudflare.",
  // Journaux Docker : json-file, 10 Mo par fichier, 3 fichiers conservés.
  journaux: "rotation automatique à 30 Mo cumulés, sans durée fixe",
};

/** Date de dernière révision des textes légaux. À mettre à jour à chaque retouche. */
export const legal = {
  miseAJour: "24 septembre 2026",
  droitApplicable: "béninois",
  autorite: {
    nom: "Autorité de Protection des Données Personnelles (APDP)",
    pays: "Bénin",
    site: "https://apdp.bj",
  },
};

export const annee = new Date().getFullYear();

/** Les trois accès de la page À propos, dans l'ordre d'affichage. */
export const contacts = [
  {
    cle: "whatsapp",
    libelle: "WhatsApp",
    href: auteur.whatsapp,
    externe: true,
    icone: `<path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1a12 12 0 0 1-5.7-5 6.5 6.5 0 0 1-1.4-3.4c0-1 .5-1.5.7-1.7.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.5l-.3.4-.3.3c-.1.1-.2.3 0 .5a8 8 0 0 0 3.7 3.2c.2.1.4.1.5 0l.8-1c.2-.2.3-.1.5-.1l1.8.9c.2.1.4.2.4.3v.9Z" fill="currentColor"/>`,
  },
  {
    cle: "email",
    libelle: "E-mail",
    href: `mailto:${auteur.email}`,
    externe: false,
    icone: `<rect x="2.5" y="4.5" width="19" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m3 6 9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    cle: "portfolio",
    libelle: "Mon portfolio",
    href: auteur.portfolio,
    externe: true,
    icone: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 12h19M12 2.5c2.5 2.6 2.5 16.4 0 19M12 2.5c-2.5 2.6-2.5 16.4 0 19" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
];

/** Pages légales réellement publiées. Le pied de page se construit d'ici. */
export const pagesLegales = [
  { href: "/mentions-legales", libelle: "Mentions légales" },
  { href: "/confidentialite", libelle: "Confidentialité" },
];
