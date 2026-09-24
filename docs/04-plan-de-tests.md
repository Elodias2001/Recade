# Plan de tests

Document interne. Il dit ce qui est couvert automatiquement, **ce qui ne l'est
pas**, et comment recetter à la main. Les valeurs de référence sont datées :
elles servent à détecter une régression, pas à être vraies éternellement.

## Ce que les tests automatisés couvrent

```bash
pnpm test           # 37 tests, 4 fichiers, ~2,5 s
```

### `identity.test.ts` — le regroupement des signatures

C'est le cœur : un outil de preuve qui se trompe sur le compte ne vaut rien.
Les cas viennent de dépôts réels, pas d'une imagination.

| Test | Ce qu'il verrouille |
|---|---|
| Deux noms, une adresse | `elodias-dev` + `Elodias ADIMOU - TCM` → 1 034, pas 593 |
| Deux adresses, un nom | Derrick en `.io` et en `.fr` → 65 |
| Fusion en chaîne | A↔B par l'adresse, B↔C par le nom ⇒ A, B, C ensemble |
| Deux personnes distinctes | Ne se rapprochent pas |
| Classement | Du plus contributif au moins |
| Appariement par adresse | Reconnu |
| Appariement par nom | Le cas `vous@MacBook-de-vous.local` |
| Insensibilité à la casse | `ELODIAS@…` = `elodias@…` |
| Rejet d'un tiers | Derrick n'est pas moi |

### `portfolio.test.ts` — les cumuls

| Test | Ce qu'il verrouille |
|---|---|
| Somme commits et fusions | 1 683 et 230 sur le jeu de référence |
| Dépôts où l'on mène | Compte les `rank === 1` |
| Période étendue | Du plus ancien au plus récent, tous dépôts confondus |
| Signature dédoublée | Une personne présente dans deux dépôts → une ligne, pas deux |
| Volume par langage | Cumulé et trié |
| Ordre des plateformes | Décroissant par commits |
| Conformité au schéma | `portfolioSchema` accepte la sortie |
| Dossier vide | Refusé |

### `html.test.ts` — le document et sa sûreté

| Test | Ce qu'il verrouille |
|---|---|
| Empreinte déterministe | Même bundle ⇒ même sceau |
| Empreinte sensible | Un compteur modifié ⇒ empreinte différente |
| Échappement des noms | `<img src=x onerror=…>` devient du texte |
| Balise `script` non refermable | Le `<` du bundle est neutralisé |
| Bundle relisible | Ce qui est embarqué repasse le schéma |
| Aucune ressource distante | Ni `http`, ni `@import` |

### `integration.test.ts` — le moteur, contre un vrai dépôt

Un dépôt Git est fabriqué dans un dossier temporaire, avec les cas rencontrés
sur CIR : deux signatures pour une même personne, un tiers, du code vendorisé,
un fichier de verrouillage, une fusion, et une branche abandonnée. Dates fixes
et `HOME` isolé pour que la machine d'exécution ne change rien.

| Test | Ce qu'il verrouille |
|---|---|
| Commits depuis HEAD | 8 commits ; la branche abandonnée ne compte pas |
| Deux signatures fusionnées | 2 contributeurs, rang 1 |
| Fusions et leurs SHA | 1 fusion, SHA de 40 caractères |
| Vendorisé et verrouillage exclus | Exactement 70 lignes, pas 14 070 |
| Pile non vendorisée | `Hono` présent, `Go` absent |
| **Arbre et non disque** | Salir un fichier **suivi** ne change aucun chiffre |
| Identité inconnue | Refus explicite |
| Vérification authentique | Confirmée |
| Commits gonflés · fusion fabriquée · volume gonflé · pile inventée | Réfutées |
| Ancrage introuvable | Signalé « absent », pas recompté à côté |
| Vérification sans configuration locale | Tient sur les seules signatures du bundle |

> **Pourquoi salir un fichier *suivi* et non un fichier nouveau.** Un fichier
> jamais ajouté n'apparaît pas non plus dans `git ls-files` : le test passerait
> même avec l'ancienne implémentation qui lisait le disque. Seule la
> modification d'un fichier déjà suivi distingue les deux.

### Ces tests détectent-ils vraiment une régression ?

Vérifié par sabotage volontaire, le 24 septembre 2026 :

| Sabotage | Tests qui tombent |
|---|---|
| Retirer l'exclusion du code vendorisé | 1 |
| Recompter depuis `--all` au lieu de `headSha` | 3 |

Un test qui ne tombe jamais ne protège rien. À refaire après toute
réorganisation du moteur.

## Ce qui n'est PAS couvert automatiquement

À vérifier à la main. C'est ici que se cachent les régressions.

- **La production du PDF.** Dépend d'un Chromium installé.
- **Le rendu terminal.** Couleurs, alignements, largeur.
- **Les gros dépôts.** Aucune mesure de performance verrouillée.
- **Windows.** Jamais exécuté. Les chemins et la détection de Chrome sont
  vraisemblablement à revoir.

## Valeurs de référence

Mesurées le **24 septembre 2026**. Un écart qui ne s'explique pas par de
nouveaux commits est une régression.

| Dépôt | Commits | Rang | Fusions | TypeScript | Fichiers | Ancrage |
|---|---|---|---|---|---|---|
| `cir-inventory-app` | 1 025 / 1 976 | 1/7 | 185 | 142 228 | 1 441 | `5d950ae58297` |
| `GCWeek` | 533 / 533 | 1/1 | 31 | 105 436 | 1 026 | `5df06da81665` |
| `LiveElectV2` | 125 / 527 | 3/7 | 14 | 78 415 | 777 | `8ef2827defec` |

Cumuls du dossier des trois : **3 plateformes, 2 en tête, 1 683 commits,
230 fusions, 326 079 lignes TypeScript**, novembre 2025 → septembre 2026.

> **Pourquoi GCWeek affiche 533 et non 720.** Tout est compté depuis `headSha`.
> 720 correspondait à `--all`, c'est-à-dire branches non fusionnées comprises.
> Ce n'est pas une régression, c'est l'ancrage. Voir le document technique.

## Recette manuelle

### R1 — Résolution d'identités

```bash
recade whoami ~/Documents/Projets/cir-inventory-app
```

**Attendu** : 7 groupes. Le premier réunit `elodias-dev` (593) et
`Elodias ADIMOU - TCM` (441) à 1 034. Derrick en réunit trois dont une en `.fr`.

**Échec si** : les signatures d'une même personne apparaissent séparément, ou
deux personnes distinctes sont fusionnées.

### R2 — Attestation simple

```bash
recade scan ~/Documents/Projets/cir-inventory-app --me elodias@thecreativemind.io
```

**Attendu** : les valeurs du tableau ci-dessus. Aucune mention de « Go » dans la
pile — CIR embarque un plugin Traefik vendorisé qui l'a déjà fait mentir une
fois.

### R3 — Vérification authentique

```bash
recade scan ~/…/cir-inventory-app --me elodias@thecreativemind.io -o /tmp/a.json
recade verify /tmp/a.json ~/…/cir-inventory-app
```

**Attendu** : 15 contrôles verts, « Attestation confirmée », code de sortie `0`.

### R4 — Falsifications

Le test qui compte vraiment. Chacun doit être **réfuté**, code de sortie `1`.

| Falsification | Commande | Contrôle qui doit rougir |
|---|---|---|
| Commits gonflés | `commits = 1800` | Commits signés |
| Fusions inventées | 40 SHA fabriqués | Fusions revendiquées |
| Volume gonflé | `TypeScript = 500000` | Lignes TypeScript |
| Pile inventée | ajouter `Java`, `Kubernetes` | Stack détectée |
| Mauvais dépôt | vérifier contre GCWeek | Commit d'ancrage introuvable |

```bash
# exemple : gonfler les commits
node -e "const f='/tmp/a.json';const b=require(f);b.contribution.commits=1800;
  require('fs').writeFileSync(f,JSON.stringify(b))"
recade verify /tmp/a.json ~/…/cir-inventory-app; echo "code=$?"
```

### R5 — Dossier multi-dépôts

```bash
recade scan ~/…/cir-inventory-app ~/…/GCWeek ~/…/LiveElectV2 \
  --me elodias@thecreativemind.io olouwagnon@gmail.com \
  --html /tmp/d.html --pdf /tmp/d.pdf
```

**Attendu** : 3 plateformes, 2 en tête, 1 683 commits, 230 fusions.

### R6 — Vérification partielle

```bash
recade verify /tmp/d.html ~/Documents/Projets/Elodias/GCWeek
```

**Attendu** : GCWeek confirmée, les deux autres marquées **« non vérifiable
ici »** et non « réfutée ». Code de sortie `0` — un accès partiel n'est pas un
échec.

**Échec si** un dépôt absent est présenté comme réfuté : ce serait accuser à
tort.

### R7 — Document HTML

```bash
recade scan ~/…/GCWeek --me olouwagnon@gmail.com --html /tmp/g.html
grep -c 'src="http\|href="http\|@import' /tmp/g.html   # attendu : 0
recade verify /tmp/g.html ~/…/GCWeek                    # doit confirmer
```

Ouvrir le fichier : le pied doit porter la **portée de la vérification**, et le
dépôt doit s'afficher **sans identifiant** (`github.com:org/projet`, jamais
`https://user:jeton@…`).

### R8 — Sceaux distincts

Générer trois attestations de trois dépôts. Les sceaux doivent avoir des motifs
de crans **visiblement différents**, et régénérer le même dépôt doit redonner le
même sceau.

### R9 — Injection

```bash
mkdir '/tmp/<img src=x onerror=alert(1)>' && cd '/tmp/<img src=x onerror=alert(1)>'
git init -q && git config user.email t@t.io && git config user.name T
echo a > a.ts && git add -A && git commit -qm t
recade scan . --me t@t.io --html /tmp/x.html
grep -c '<img src=x onerror' /tmp/x.html   # attendu : 0
```

Le nom de dépôt vient du nom de dossier, qui accepte tout. Git filtre lui-même
les chevrons dans les noms d'auteur, mais **pas** dans les noms de dossier.

### R10 — Cas limites

| Cas | Attendu |
|---|---|
| Dépôt sans commit | « Ce dépôt n'a aucun commit » |
| Dossier hors dépôt Git | « n'est pas un dépôt Git » |
| Identité inconnue | Liste les auteurs présents et indique `whoami --add` |
| Dépôt sans remote | `remote: null`, pas de plantage |
| Aucune identité configurée | Repli sur le `user.email` du dépôt, avec avertissement |
| Pas de Chromium | Message clair, jamais une pile d'appels |
| `--no-lines` | Aucun volume, le reste inchangé |

### R11 — Absence de réseau

L'invariant le plus important. Couper le Wi-Fi, lancer un `scan` complet : tout
doit fonctionner à l'identique.

```bash
grep -rnE "fetch\(|https?://|node:https?|axios|undici" apps/cli/src --include=*.ts \
  | grep -v "\.test\.ts"
```

**Attendu** : aucune requête. Seules les URL de documentation et de dépôt dans
les commentaires et le HTML généré.

### R12 — Pas de processus résiduel

```bash
recade scan ~/…/GCWeek --me olouwagnon@gmail.com --pdf /tmp/g.pdf
pgrep -f "print-to-pdf" | wc -l    # attendu : 0
```

Chrome en `--print-to-pdf` ne rend jamais la main. Une régression ici laisse des
processus tourner indéfiniment sur la machine de l'utilisateur — c'est déjà
arrivé, treize d'un coup.

## Avant de publier

```bash
pnpm type-check     # aucune erreur
pnpm test           # 37/37
pnpm build          # tsup sans avertissement
pnpm docs           # documentation régénérée
```

Puis R2, R4, R6, R11 et R12 au minimum : ce sont ceux qui touchent aux
invariants.

## Dette de test assumée

Par ordre d'importance :

1. **Aucune mesure de performance verrouillée.** Le passage du disque à
   `git grep` a fait tomber le scan à 0,1 s ; rien ne l'empêche de remonter.
2. **Windows jamais exécuté.**
3. **Le rendu HTML n'est pas comparé visuellement.** Une régression de mise en
   page passerait inaperçue.
