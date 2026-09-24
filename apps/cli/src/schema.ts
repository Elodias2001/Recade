import { z } from "zod";

/**
 * Le schéma du bundle est **versionné** et exporté : l'API de la phase 2
 * validera exactement le même objet. Toute rupture passe par un incrément de
 * `schemaVersion`.
 *
 * Règle de fond : aucun compteur ne figure ici sans le SHA qui permet de le
 * recalculer. Un chiffre non réfutable n'a pas sa place dans une attestation.
 */

const signature = z.object({
  name: z.string(),
  email: z.string(),
  commits: z.number(),
});

const languageVolume = z.object({
  language: z.string(),
  lines: z.number(),
});

export const bundleSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),

  repository: z.object({
    name: z.string(),
    /** Ancre de vérification : l'état exact du dépôt au moment du scan. */
    headSha: z.string(),
    firstCommitSha: z.string(),
    firstCommitDate: z.string(),
    lastCommitDate: z.string(),
    totalCommits: z.number(),
    /** Contributeurs après regroupement des signatures, pas signatures brutes. */
    contributors: z.number(),
    trackedFiles: z.number(),
    /**
     * Remote tel que configuré localement, **débarrassé de tout identifiant**.
     * Sert au lecteur à savoir où vit le dépôt — donc qui peut vérifier.
     * `null` quand le dépôt n'a pas de remote.
     */
    remote: z.string().nullable().optional(),
  }),

  contribution: z.object({
    /** Les signatures reconnues comme miennes, détaillées pour audit. */
    signatures: z.array(signature),
    commits: z.number(),
    rank: z.number(),
    firstCommitDate: z.string(),
    lastCommitDate: z.string(),
    mergesIntegrated: z.number(),
    /** Chaque fusion comptée, pour que `recade verify` puisse les recompter. */
    mergeShas: z.array(z.string()),
  }),

  volume: z.array(languageVolume),
  stack: z.array(z.string()),
});

/**
 * Un **dossier** : plusieurs attestations réunies, avec leurs cumuls.
 *
 * C'est la forme qu'attend un appel d'offres — « justifiez de deux plateformes
 * d'envergure » ne se répond pas avec un dépôt à la fois — et c'est aussi ce
 * qu'un poste sénior réclame.
 *
 * Les cumuls ne sont jamais recalculés à la lecture : ils sont recalculés à la
 * vérification, depuis les attestations elles-mêmes, puis confrontés.
 */
export const portfolioSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal("portfolio"),
  generatedAt: z.string(),

  holder: z.object({
    /** Union des signatures reconnues sur l'ensemble des dépôts. */
    signatures: z.array(signature),
  }),

  totals: z.object({
    repositories: z.number(),
    /** Dépôts où le titulaire est premier contributeur. */
    leading: z.number(),
    commits: z.number(),
    mergesIntegrated: z.number(),
    firstCommitDate: z.string(),
    lastCommitDate: z.string(),
    volume: z.array(languageVolume),
  }),

  attestations: z.array(bundleSchema),
});

export type Portfolio = z.infer<typeof portfolioSchema>;

/** Réexport pratique : les tests et l'API parlent du même type d'identité. */
export type { IdentityConfig } from "./identity.js";
export type Bundle = z.infer<typeof bundleSchema>;
export type LanguageVolume = z.infer<typeof languageVolume>;
export type Signature = z.infer<typeof signature>;
