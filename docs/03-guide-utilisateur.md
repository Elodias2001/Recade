# Manuel utilisateur

Récade s'adresse à trois profils, qui n'ont ni les mêmes gestes ni les mêmes
besoins. Allez directement au vôtre.

| Profil | Ce que vous faites | Section |
|---|---|---|
| **Le développeur** | Vous attestez votre travail | [Attester](#i-attester-votre-travail) |
| **Le détenteur du dépôt** | On vous demande de confirmer | [Vérifier](#ii-verifier-une-attestation) |
| **L'agence** | Vous montez un dossier de références | [Monter un dossier](#iii-monter-un-dossier) |

## Installation

```bash
npx recade --help          # sans rien installer
npm install -g recade      # ou en permanence
```

Prérequis : **Node 20+** et **Git**. Pour la sortie PDF, un navigateur Chromium
déjà installé (Chrome, Chromium, Edge, Brave) — Récade n'en embarque pas.

---

# I. Attester votre travail

## 1. Déclarez qui vous êtes

C'est l'étape qu'on saute et qu'on regrette. Git n'a pas de comptes
utilisateurs : il enregistre le nom et l'adresse configurés au moment du commit.
Vous avez donc probablement plusieurs signatures — une par machine, par client,
par année.

Commencez par regarder :

```bash
recade whoami ~/Projets/mon-depot
```

```
  Auteurs du dépôt (signatures regroupées)

  · 1 034  elodias-dev
         elodias-dev <elodias@thecreativemind.io>            593
         Elodias ADIMOU - TCM <elodias@thecreativemind.io>   441
  ·   631  Derrick Ahouissoussi
         …
```

Récade regroupe les signatures qui partagent une adresse **ou** un nom. À vous
de confirmer lesquelles sont les vôtres :

```bash
recade whoami --add elodias@thecreativemind.io --add olouwagnon@gmail.com
```

Pour un commit fait sous une adresse de machine (`vous@MacBook-de-vous.local`),
l'adresse ne sert à rien — déclarez le nom :

```bash
recade whoami --add-name "Elodias TCM"
```

C'est enregistré dans `~/.recade/identities.json`, une fois pour toutes.

> **Pourquoi c'est important.** Sans regroupement, deux signatures se comptent
> séparément : vous annoncez 593 commits au lieu de 1 034, et le classement vous
> place 3ᵉ alors que vous êtes 1ᵉʳ.

## 2. Attestez

```bash
recade scan ~/Projets/mon-depot
```

```
  ◆  RÉCADE   attestation de contribution
     cir-inventory-app · scan local, aucun code transmis

  Période             novembre 2025 → septembre 2026
  Commits signés      1 025 / 1 976   1er contributeur sur 7
  PR fusionnées       185   relues sous votre responsabilité
  Volume du dépôt     142 228 lignes TypeScript   PHP 25 883 · Shell 10 381
  Stack détectée      Docker · Drizzle ORM · Hono · Next.js · React
```

## 3. Produisez le document

```bash
recade scan ~/Projets/mon-depot --html attestation.html --pdf attestation.pdf
```

| Sortie | Pour quoi faire |
|---|---|
| `--html` | **Le document qui se vérifie.** Fichier unique de 16 Ko, sans aucune ressource externe. |
| `--pdf` | **Le document qu'on joint.** Un portail RH refuse un `.html` ; un recruteur ne sait pas quoi en faire. |
| `-o fichier.json` | Le bundle brut, pour l'outillage. |
| `--json` | Le bundle sur la sortie standard, pour l'enchaîner. |

> **À retenir.** Le PDF se lit, il **ne se vérifie pas** : les données ne
> voyagent que dans le HTML. Produisez les deux, joignez le PDF, gardez le HTML
> pour qui demandera à contrôler.

## Options

| Option | Effet |
|---|---|
| `--me <adresse…>` | Identités pour ce scan seulement, sans toucher à la configuration |
| `--no-lines` | Ne compte pas les lignes. Plus rapide sur un très gros dépôt |
| `--html` · `--pdf` · `-o` · `--json` | Sorties, cumulables |

---

# II. Vérifier une attestation

Vous avez reçu une attestation et vous détenez le dépôt. **Dix secondes.**

```bash
npx recade verify attestation.html ~/depots/le-projet
```

```
  ✓ Premier commit        457c7ce8ae
  ✓ Commits du dépôt      1976
  ✓ Contributeurs         7
  ✓ Commits signés        1025
  ✓ Rang                  1
  ✓ Fusions revendiquées  185 réelles
  ✓ Lignes TypeScript     142228
  ✓ Stack détectée        Docker · Drizzle ORM · Hono · Next.js
  ──────────────────────────────────────────────
  ✓ Attestation confirmée — tous les compteurs se recalculent à l'identique.
```

Vous n'avez **rien à installer ni à configurer** d'autre : la vérification
s'appuie sur les signatures déclarées dans l'attestation, pas sur une
configuration locale.

Le `.json` et le `.html` marchent indifféremment — le HTML embarque son bundle.

En cas de divergence, chaque ligne fautive montre ce que l'attestation affirme
et ce que le dépôt dit :

```
  ✗ Commits signés        1025   attesté : 1800
  ✗ Attestation réfutée — au moins un compteur ne tient pas.
```

Le code de sortie vaut `1` quand l'attestation est réfutée : utilisable dans un
script.

> **Si le dépôt a avancé depuis**, ce n'est pas un problème. L'attestation décrit
> un commit précis, et tout est recalculé depuis ce commit-là.

---

# III. Monter un dossier

Un appel d'offres ne se répond pas un dépôt à la fois. Passez plusieurs chemins :

```bash
recade scan ~/Projets/alpha ~/Projets/beta ~/Projets/gamma \
  --html dossier.html --pdf dossier.pdf
```

Vous obtenez une attestation par plateforme **et les cumuls** : nombre de
plateformes, celles où vous êtes premier contributeur, commits, fusions, volume
par langage, période étendue du plus ancien au plus récent commit.

C'est la forme qu'exigent les marchés publics — « justifier de la conception et
de la mise en production d'au moins deux plateformes d'envergure » — et les
postes séniors.

### Vérifier un dossier

```bash
recade verify dossier.html ~/Projets/alpha ~/Projets/beta
```

```
  ✓ alpha        15 contrôles concordent
  ✓ beta         14 contrôles concordent
  ○ gamma        non vérifiable ici — dépôt non fourni

  ✓ 2 attestation(s) confirmée(s) — 1 non vérifiable(s) faute d'accès au dépôt.
```

Chaque attestation retrouve son dépôt par son commit d'ancrage, pas par son nom.
Vous pouvez donc n'en fournir qu'une partie : **« non vérifiable ici » n'est pas
« réfutée »**.

---

# Ce que Récade ne fait pas

À savoir avant de s'appuyer dessus.

**Un dépôt privé reste privé.** Si votre destinataire n'y a pas accès, il ne
recalcule rien : les chiffres sont *déclaratifs*, et l'attestation le dit
elle-même. La vérification s'adresse à celui qui détient le dépôt — votre ancien
employeur, votre client. Récade ne remplace pas la prise de références : **il la
rend chiffrée.**

**Le sceau ne prouve rien.** Il sert à comparer deux attestations d'un coup
d'œil. Seul `verify` contre le dépôt établit la vérité.

**Le volume est celui du dépôt**, pas « les lignes que vous avez écrites ».

**Le travail non fusionné n'est pas compté.** Tout part du commit courant :
une branche jamais fusionnée dans la ligne principale n'apparaît pas.

---

# Dépannage

| Message | Cause | Solution |
|---|---|---|
| `Aucun commit ne correspond à vos identités` | Vos signatures ne sont pas déclarées | `recade whoami <dépôt>` puis `--add` |
| `n'est pas un dépôt Git` | Mauvais chemin, ou dossier hors dépôt | Vérifier le chemin |
| `Ce dépôt n'a aucun commit` | Dépôt fraîchement initialisé | Il n'y a rien à attester |
| `Aucun navigateur Chromium trouvé` | Pas de Chrome pour le PDF | Installer Chrome, ou `RECADE_CHROME=/chemin/vers/chrome` |
| `Commit d'ancrage introuvable` | L'attestation ne correspond pas à ce dépôt | Fournir le bon dépôt |
| `Document malformé` | Fichier abîmé ou d'une autre version | Régénérer l'attestation |

**Rien ne sort de votre machine.** Aucune requête réseau, aucune télémétrie. Si
vous soupçonnez le contraire, le code tient en quelques centaines de lignes et
tous les appels externes passent par `git.ts`.
