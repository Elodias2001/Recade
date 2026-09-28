# Guide de démarrage

Tout ce qu'il faut pour **utiliser** Récade en deux minutes, ou pour **le
développer** en dix.

---

# A. Utiliser Récade

## Prérequis

| Outil | Version | Vérifier |
|---|---|---|
| **Node.js** | ≥ 20 | `node -v` |
| **Git** | n'importe laquelle récente | `git --version` |
| **Chromium** | *facultatif* — pour la sortie PDF | Chrome, Chromium, Edge ou Brave installé |

Aucune base de données, aucun serveur, aucune clé d'API. Récade n'a pas de
backend : c'est un invariant du produit, pas un manque.

## Trois commandes

```bash
# 1. qui suis-je dans ce dépôt ?
npx @elodias/recade whoami ~/Projets/mon-depot

# 2. déclarer mes signatures, une fois pour toutes
npx @elodias/recade whoami --add moi@exemple.io

# 3. attester
npx @elodias/recade scan ~/Projets/mon-depot
```

Si vous ne deviez retenir qu'une chose : **l'étape 2 n'est pas facultative.**
Git n'a pas de comptes utilisateurs, vous avez donc plusieurs signatures selon
la machine et l'année. Sans elle, Récade compte une fraction de votre travail.

## Produire un document

```bash
npx @elodias/recade scan ~/Projets/mon-depot --html attestation.html --pdf attestation.pdf
```

Le **PDF** se joint à un dossier. Le **HTML** se vérifie — c'est lui qui porte
les données. Produisez les deux.

Le détail des options et des trois profils d'usage est dans le
[manuel utilisateur](03-guide-utilisateur.html).

---

# B. Développer sur Récade

## Prérequis

| Outil | Version |
|---|---|
| **Node.js** | ≥ 20 |
| **pnpm** | ≥ 10 — `npm i -g pnpm` |
| **Git** | récente |

## 1. Cloner

```bash
git clone git@github-perso:Elodias2001/Recade.git recade
cd recade
```

> **`github-perso` n'est pas une faute de frappe.** C'est un alias SSH défini
> dans `~/.ssh/config`, qui pointe vers `github.com` avec la clé personnelle.
> Sur une autre machine, remplacez par `git@github.com:` et assurez-vous que la
> bonne clé est utilisée.

## 2. Verrouiller l'identité — avant tout commit

**L'étape qu'il ne faut pas sauter.** Ce dépôt est personnel ; la configuration
Git globale de la machine d'origine porte une identité professionnelle. Sans
cette étape, le premier commit part sous le mauvais nom.

```bash
git config --local user.name  "Elodias (Perso)"
git config --local user.email "olouwagnon@gmail.com"

git var GIT_AUTHOR_IDENT      # doit afficher Elodias (Perso)
```

## 3. Installer et construire

```bash
pnpm install
pnpm build
```

Vérifiez tout de suite que le binaire répond :

```bash
node apps/cli/dist/index.js --help
```

## 4. Lancer sur un dépôt réel

Récade n'a pas de jeu de données de test : il lit de vrais dépôts. Prenez
n'importe lequel des vôtres.

```bash
node apps/cli/dist/index.js whoami ~/un/depot
node apps/cli/dist/index.js scan ~/un/depot --me votre@adresse.io
```

Pour éviter de retaper le chemin, posez un alias — aucun effet de bord :

```bash
alias recade="node $PWD/apps/cli/dist/index.js"
recade scan ~/un/depot
```

Ou, pour l'avoir en permanence dans le `PATH` (installe le paquet globalement) :

```bash
cd apps/cli && pnpm link && cd -
```

## Boucle de développement

```bash
pnpm --filter recade dev        # tsup en veille, reconstruit à chaque sauvegarde
```

Dans un autre terminal, relancez la commande que vous travaillez. Le binaire est
reconstruit en ~10 ms.

## Commandes utiles

| Commande | Effet |
|---|---|
| `pnpm build` | Construit le CLI (`apps/cli/dist`) |
| `pnpm test` | Vitest — 94 tests : 37 pour le CLI, 57 pour le site |
| `pnpm type-check` | `tsc --noEmit`, mode strict |
| `pnpm build:docs` | Régénère `docs/*.html` depuis les `.md` |
| `pnpm build:og` | Régénère les vignettes de partage (exige un Chromium) |
| `pnpm --filter recade dev` | Reconstruction en continu |

## Vignettes de partage

Quand un lien du site est collé dans WhatsApp, Slack ou LinkedIn, l'aperçu
affiche une image 1200x630 aux couleurs de la marque. Une par page, définies
dans `site/og.mjs`.

```bash
pnpm build:og      # rend les PNG dans site/img/og/
```

**Ces PNG sont commités, et `build:site` ne les régénère pas.** Le rendu exige
un Chromium que l'image Docker n'embarque pas, et la police du site n'existe
pas dans un conteneur Linux : générer au déploiement donnerait une vignette
différente de celle validée. On fige à la main.

Changer un titre de page ou une fiche de documentation, c'est donc relancer
`pnpm build:og` et commiter le résultat. Une page ajoutée sans son entrée dans
`site/og.mjs` **fait échouer la construction** : elle se partagerait sans image.

## Où se trouve quoi

```
apps/cli/src/
  index.ts      les commandes — commencez ici pour suivre un flux
  git.ts        tous les appels à git passent par là, et seulement par là
  identity.ts   signatures, regroupement, ~/.recade/identities.json
  scan.ts       les compteurs
  portfolio.ts  plusieurs attestations en un dossier
  verify.ts     recalcul et confrontation
  schema.ts     le contrat — à lire en premier pour comprendre les données
  html.ts       document autonome + sceau
  render.ts     sortie terminal
```

Pour comprendre le projet, l'ordre de lecture est `schema.ts`, puis `scan.ts`,
puis [le document technique](02-architecture.html).

## Conventions

- **TypeScript strict**, `noUncheckedIndexedAccess` actif, pas de `any`.
- **Appels Git** : `execFile` avec un tableau d'arguments. **Jamais** `exec` avec
  une chaîne interpolée — un nom de branche tordu deviendrait une injection.
- **Commits conventionnels, en français** : `feat(cli):`, `fix(cli):`, `docs:`,
  `chore:`, `refactor:`.
- **Documentation** : on édite les `.md`, jamais le HTML généré.

Les quatre invariants du produit sont dans
[le document technique](02-architecture.html). Une contribution qui en viole un
est refusée, quel que soit son intérêt.

## Vérifier que tout va bien

```bash
pnpm type-check     # aucune erreur
pnpm test           # 94 passed
pnpm build          # Build success
pnpm build:docs           # 5 fiches générées
```

Puis, sur un dépôt réel dont vous connaissez les chiffres : un `scan`, un
`verify` du résultat, et une falsification volontaire qui doit être **réfutée**.
La recette complète est dans [le plan de tests](04-plan-de-tests.html).

---

# Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| `Aucun commit ne correspond à vos identités` | Signatures non déclarées | `recade whoami <dépôt>` puis `--add` |
| Le premier commit part sous le mauvais nom | Identité locale non posée | Section 2 ci-dessus, puis `git commit --amend --reset-author` |
| `Permission denied (publickey)` au clone | Alias SSH absent sur cette machine | Utiliser `git@github.com:` ou définir l'alias dans `~/.ssh/config` |
| `Aucun navigateur Chromium trouvé` | Pas de Chrome pour le PDF | L'installer, ou `RECADE_CHROME=/chemin/vers/chrome` |
| `recade` introuvable après `pnpm link` | Le dossier des binaires globaux de pnpm n'est pas dans le `PATH` | `pnpm setup`, puis rouvrir le terminal |
| Le HTML de `docs/` ne change pas | Il est généré | Éditer le `.md`, puis `pnpm build:docs` |
| La vignette partagée montre l'ancien titre | Les PNG sont commités, pas générés au déploiement | `pnpm build:og`, puis commiter `site/img/og/` |
| WhatsApp affiche encore l'ancienne vignette | Aperçu mis en cache côté plateforme | Passer par le Sharing Debugger de Facebook, ou partager l'URL avec `?v=2` |
| Des processus Chrome traînent | Régression du nettoyage après PDF | `pkill -f print-to-pdf`, puis voir R12 du plan de tests |

## Ce qui ne peut pas mal tourner

Récade **ne fait aucun appel réseau**. Si quelque chose semble attendre une
connexion, c'est un bug — signalez-le. Tous les appels externes passent par
`git.ts` et `pdf.ts`, et rien d'autre ne sort de la machine.
