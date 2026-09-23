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

export type Bundle = z.infer<typeof bundleSchema>;
export type LanguageVolume = z.infer<typeof languageVolume>;
export type Signature = z.infer<typeof signature>;
