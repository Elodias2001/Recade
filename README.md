# Récade

> Montre la récade.

CLI local qui transforme un dépôt Git — **y compris privé, y compris sous NDA** —
en attestation de contribution vérifiable, sans qu'une seule ligne de code quitte
la machine.

Le nom vient de la **récade** (en fon : *makpo*), le sceptre du roi d'Abomey remis
au messager pour garantir à son destinataire l'authenticité du message royal. La
présenter équivalait juridiquement à la présence physique du roi : une extension
portable de la souveraineté. C'est exactement ce qu'est un lien d'attestation —
un petit objet qu'on remet, et qui parle à votre place.

---

## Le problème

Sur un CV, « premier contributeur d'une équipe de dix » et « j'encadre des
développeurs juniors » sont des **affirmations que personne ne peut vérifier**.

Et le meilleur travail d'un développeur sénior est justement celui qu'il ne peut
pas montrer : dépôts privés, clients bancaires, plateformes d'État, NDA. Plus on
monte, moins on peut prouver.

Les outils existants exigent tous un OAuth GitHub et envoient le code à un LLM
pour qu'il rédige de jolies phrases. Inutilisable sur du travail confidentiel.

## Ce que fait Récade

```bash
npx recade scan ~/Projets/mon-monorepo                    # au terminal
npx recade scan ~/Projets/mon-monorepo --html att.html   # fichier autonome
npx recade verify att.html ~/Projets/mon-monorepo        # réfutation
```

Lit `.git` en local. N'ouvre jamais un fichier de code, n'envoie rien nulle part.
Ne produit que des **compteurs** :

```
mon-monorepo — dépôt privé
Période            nov. 2025 → sept. 2026
Commits signés     1 023 / 1 962      (1er contributeur sur 10)
PR fusionnées      182
Volume             ~142 000 lignes TypeScript
Stack détectée     Next.js 16 · Hono 4 · PostgreSQL 16 · Docker
```

Un CLI local pourrait mentir. C'est pourquoi l'attestation embarque le **SHA du
premier commit, celui d'ancrage, et celui de chaque fusion comptée** :

```bash
recade verify attestation.json ~/Projets/le-depot
```

Une attestation HTML embarque son propre bundle : `recade verify` accepte
indifféremment le `.json` et le `.html`. Le fichier HTML **est** l'attestation,
pas une image de celle-ci.

Quiconque a accès au dépôt recalcule et retombe sur les mêmes chiffres, ou pas.
La vérification s'appuie sur les signatures **déclarées dans l'attestation**,
jamais sur une configuration locale : un recruteur vérifie sans rien installer
de plus que le CLI.

Tout est compté depuis `headSha`, jamais depuis `--all` : les branches bougent
et se suppriment, un SHA non. L'attestation décrit un instant précis et reste
vérifiable même si le projet a continué d'avancer.

On ne passe pas de « crois-moi » à « prouvé », mais de « crois-moi » à
**« réfutable sur demande »**.

## Identités

Le vrai problème technique n'est pas de lire Git, c'est de savoir **qui est qui**.
Un même développeur commite sous plusieurs noms et adresses selon la machine, le
client, l'année. Récade regroupe les auteurs et demande de confirmer lesquels
sont les vôtres avant de compter. Un outil de preuve qui se trompe sur le compte
ne vaut rien.

## Stack

| Couche | Techno |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| CLI | Node 20+ · TypeScript strict · `tsup` (ESM) |
| Arguments | `commander` |
| Schéma | `zod` — le *bundle* est versionné et validé |
| Accès Git | `execFile` sur le binaire `git` (jamais `exec`) |
| Tests | Vitest |

Pas de serveur, pas de base, pas de Docker. **C'est l'argument de vente**, pas
une économie de moyens : un outil sans backend ne peut pas exfiltrer votre code.

## Démarrer

```bash
pnpm install
pnpm build
node apps/cli/dist/index.js scan <chemin>
```

## Design

Direction **Fonte Hountondji**, d'après la corporation royale des forgerons et
orfèvres d'Abomey qui fondait le métal de la cour, récades comprises.
Palette, emblème et principe structurel : [`brand/README.md`](brand/README.md).

## Feuille de route

- ~~**v0** — scanner d'un dépôt : identités, compteurs, SHAs → JSON~~ ✅
- ~~**v0.1** — `verify` : recalcule et compare une attestation~~ ✅
- ~~**v0.2** — `verify` recalcule aussi volume et stack~~ ✅
- ~~**v0.3** — rendu HTML autonome, vérifiable tel quel~~ ✅
- **v1** — plusieurs dépôts, mapping face à une offre d'emploi
- **plus tard** — `recade.dev`, le service qui héberge les attestations en ligne
