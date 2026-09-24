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
npx recade scan ~/Projets/mon-monorepo --html att.html   # autonome, vérifiable
npx recade scan ~/Projets/mon-monorepo --pdf att.pdf     # à joindre à un dossier
npx recade verify att.html ~/Projets/mon-monorepo        # réfutation

# plusieurs plateformes en un seul dossier
npx recade scan ~/Projets/a ~/Projets/b ~/Projets/c --html dossier.html --pdf dossier.pdf
npx recade verify dossier.html ~/Projets/a ~/Projets/b   # vérification partielle acceptée
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

**Qui peut vérifier, et qui ne peut pas.** Un dépôt privé reste privé : un
recruteur qui n'y a pas accès **ne peut rien recalculer**, et l'attestation le
dit noir sur blanc plutôt que de le taire. La vérification s'adresse à celui qui
détient le dépôt — l'ancien employeur, le client — c'est-à-dire précisément la
personne qu'on appelle pour une prise de références. Récade ne remplace pas
cette prise de références : il la rend chiffrée.

Sur un dépôt public, en revanche, n'importe qui vérifie.

Quiconque a accès au dépôt recalcule et retombe sur les mêmes chiffres, ou pas.
La vérification s'appuie sur les signatures **déclarées dans l'attestation**,
jamais sur une configuration locale : un recruteur vérifie sans rien installer
de plus que le CLI.

Tout est compté depuis `headSha`, jamais depuis `--all` : les branches bougent
et se suppriment, un SHA non. L'attestation décrit un instant précis et reste
vérifiable même si le projet a continué d'avancer.

On ne passe pas de « crois-moi » à « prouvé », mais de « crois-moi » à
**« réfutable sur demande »**.

## Dossiers

Un appel d'offres ne se répond pas un dépôt à la fois — « justifiez de deux
plateformes d'envergure » non plus. Plusieurs chemins passés à `scan` produisent
un **dossier** : une attestation par plateforme, plus les cumuls (plateformes,
dépôts où l'on est premier contributeur, commits, fusions, volume, période).

Aucun cumul n'est une estimation : ce sont des sommes de compteurs eux-mêmes
réfutables. Si une attestation du dossier tombe, le cumul tombe avec elle.

À la vérification, chaque attestation retrouve **son** dépôt par son commit
d'ancrage, jamais par son nom — un dossier se renomme, un SHA non. Et une
attestation dont le dépôt n'est pas fourni est signalée « non vérifiable ici »,
jamais « réfutée » : confondre les deux reviendrait à accuser à tort.

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

## Documentation

| Fiche | Pour qui |
|---|---|
| [`docs/01-demarrage.md`](docs/01-demarrage.md) | Démarrer : prérequis, installation, boucle de dev, dépannage |
| [`docs/02-architecture.md`](docs/02-architecture.md) | Qui reprend le code : décisions, contrat, limites |
| [`docs/03-guide-utilisateur.md`](docs/03-guide-utilisateur.md) | Développeur, vérificateur, agence |
| [`docs/04-plan-de-tests.md`](docs/04-plan-de-tests.md) | Couverture, recette manuelle, valeurs de référence |

Le Markdown est la source. `pnpm build:docs` régénère le HTML consultable
(`docs/index.html`) — **ne jamais éditer le HTML à la main**.

## Site

La documentation est publiée sur **[recade.sabar.app](https://recade.sabar.app)**.
Site statique (nginx) construit par `Dockerfile`, derrière le Traefik partagé du
VPS sur le réseau `gcw-public`, déployé par GitHub Actions à chaque push sur
`main`. Le CLI n'ayant pas de backend, il n'y a rien d'autre à faire tourner.

```bash
docker compose up --build        # local → http://localhost:8080
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
- ~~**v0.4** — `--pdf` et mention explicite de la portée de vérification~~ ✅
- ~~**v1** — plusieurs dépôts en un dossier, avec cumuls~~ ✅
- **v1.1** — mapping face à une offre d'emploi
- **v1.1** — contresignature : le détenteur du dépôt confirme, et c'est ça que lit le recruteur
- **plus tard** — `recade.dev`, le service qui héberge les attestations en ligne
