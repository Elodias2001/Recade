# Document technique

Destiné à qui reprend le code — y compris moi dans six mois. Il décrit ce que
fait Récade, comment, et **pourquoi ces choix-là plutôt que d'autres**. Les
décisions comptent plus que le code : le code se relit, un arbitrage oublié se
défait tout seul.

## Ce que fait Récade

Un CLI local qui lit un dépôt Git et en produit une **attestation de
contribution** : combien de commits signés, quel rang parmi les contributeurs,
combien de demandes de fusion intégrées, quel volume, quelle pile technique.

Rien de tout cela n'est nouveau. Ce qui l'est : l'attestation vaut pour un
**dépôt privé**, parce que le CLI ne fait sortir aucun contenu, et elle est
**réfutable**, parce qu'elle embarque de quoi la recalculer.

## Les quatre invariants

Ils priment sur toute fonctionnalité. Une proposition qui en viole un est
rejetée, quel que soit son intérêt.

1. **Aucun contenu ne sort de la machine, et rien n'est lu hors de Git.**
   Le CLI interroge le dépôt (`git log`, `git grep`, `git ls-tree`, `git show`)
   et n'en retient que des nombres. Aucun appel réseau, aucune télémétrie, pas
   de backend. C'est ce qui rend l'outil utilisable chez un client bancaire.
2. **Tout chiffre publié doit être réfutable.** Un compteur sans le SHA qui
   permet de le recalculer n'a pas sa place dans le bundle.
3. **Ne jamais deviner une identité.** En cas de doute sur l'appartenance d'un
   auteur, on demande.
4. **Mesurer l'arbre du commit, jamais le disque.**

## Architecture

Monorepo pnpm + Turborepo. Un seul paquet publiable aujourd'hui.

```
recade/
├── apps/cli/src/
│   ├── index.ts        commandes (commander), entrée du binaire
│   ├── git.ts          appels au binaire git, sûrs par construction
│   ├── identity.ts     signatures, regroupement, configuration ~/.recade
│   ├── scan.ts         les compteurs
│   ├── portfolio.ts    plusieurs attestations en un dossier
│   ├── verify.ts       recalcul et confrontation
│   ├── schema.ts       le contrat (zod), versionné
│   ├── html.ts         rendu HTML autonome + sceau
│   └── render.ts       rendu terminal
├── brand/              kit de marque Fonte Hountondji
├── docs/               cette documentation (source en .md)
└── scripts/            outillage hors paquet publié
```

Le flux des dépendances va vers le bas : `index` → `scan`/`verify` → `identity`
→ `git`. `schema` ne dépend de rien, `render` et `html` ne dépendent que de
`schema`. Aucun import remontant.

### Le parcours d'un `scan`

```
1. résoudre la racine          git rev-parse --show-toplevel
2. figer l'ancrage             git rev-parse HEAD            → headSha
3. relever les commits         git log <headSha>             → SHA, date, auteur
4. relever les fusions         git log <headSha> --merges
5. lister l'arbre              git ls-tree -r <headSha>
6. compter les lignes          git grep -cI "" <headSha>
7. lire les manifestes         git show <headSha>:package.json
8. regrouper les identités     union-find sur adresse ∪ nom
9. filtrer les miennes         configuration ou --me
10. valider le bundle          zod, contre notre propre schéma
```

Tout après l'étape 2 est ancré sur `headSha`. C'est la condition de la
reproductibilité, donc de `verify`.

## Décisions et raisons

### Appeler le binaire `git`, pas une bibliothèque JavaScript

Quiconque utilise Récade a Git installé — par définition, il a des dépôts. Et
`git rev-list` sur deux mille commits est instantané, là où une réimplémentation
en JavaScript ramerait. On n'embarque pas une bibliothèque pour refaire moins
bien ce qui est déjà là.

**Toujours `execFile` avec un tableau d'arguments, jamais `exec` avec une
chaîne.** Un nom de branche ou d'auteur tordu deviendrait sinon une injection
shell.

### Compter depuis `headSha`, jamais depuis `--all`

`--all` parcourt toutes les références. Or les branches bougent et se
suppriment : sur CIR, vingt-cinq commits vivent sur des branches jamais
fusionnées. Une attestation qui les compte n'est reproductible par personne, pas
même par son auteur le lendemain.

Un SHA, lui, ne bouge pas. On ancre dessus, et `verify` retombe sur les mêmes
chiffres pour toujours.

**Dette assumée** : pour un développeur solo qui travaille beaucoup en branches,
cela sous-estime. GCWeek passe de 720 à 533 commits. C'est défendable — du
travail jamais fusionné n'est pas livré — mais c'est un arbitrage. On pourrait
un jour enregistrer l'ensemble des références dans le bundle pour élargir le
périmètre sans perdre la reproductibilité.

### Mesurer l'arbre, pas le dossier de travail

Un commit est une photographie scellée. Le dossier de travail contient du
non-commité : CIR a un dossier `spoon/` qui n'est dans aucun commit.

Mesurer le disque, c'était affirmer décrire `headSha` tout en mesurant autre
chose — et rendre le calcul irreproductible pour un tiers, qui n'a pas ce
disque. `git grep -cI "" <sha>` compte dans la photographie.

Trois bénéfices : Git compte juste (découper le texte sur les sauts de ligne en
JavaScript renvoie un morceau de trop, soit ~1 ligne gonflée par fichier, 874
sur CIR) ; 0,1 s au lieu d'ouvrir un millier de fichiers ; et le CLI n'ouvre
plus aucun fichier du dossier de travail, ce qui renforce l'invariant nº1.

### Regrouper les signatures par union-find

Git n'a pas de comptes utilisateurs : il enregistre le couple (nom, adresse)
qu'il trouve dans la configuration au moment du commit. Une personne apparaît
donc sous plusieurs signatures. Sur CIR : douze signatures pour sept humains.

Deux signatures sont reliées si elles partagent **l'adresse** ou **le nom**,
puis la relation se propage. Derrick en est l'exemple : sa troisième signature
n'a ni le nom complet ni l'adresse de la première, mais la deuxième fait le
pont.

Sans regroupement, `elodias-dev` (593) et `Elodias ADIMOU - TCM` (441) comptent
séparément : on annonce 593 au lieu de 1 034, et le classement place la même
personne 1ʳᵉ *et* 3ᵉ.

**Le rang se calcule sur les groupes**, jamais sur les signatures brutes.

### Exclure le code de tiers

Tout chemin vendorisé (`vendor/`, `node_modules/`, `github.com/`, `gopkg.in/`…)
est écarté du volume comme de la détection de pile. CIR embarque un plugin
Traefik écrit en Go : sans cette exclusion, l'attestation déclarait « Go » à
quelqu'un qui n'a jamais écrit une ligne de Go.

Sur un outil de preuve, **un faux positif coûte plus cher qu'un oubli**.

### Le sceau n'est pas une signature

Le sceau de l'attestation encode les trois premiers octets du SHA-256 du bundle
en vingt-quatre crans autour de l'anneau. Il permet de **comparer** deux
attestations d'un coup d'œil.

Il ne prouve rien. Quiconque invente des chiffres et relance l'outil obtiendra
un sceau parfaitement cohérent avec ses mensonges. **La vérité ne vient que de
`verify` contre le dépôt.** Ne jamais laisser croire autre chose.

### La vérification s'appuie sur le bundle, pas sur la configuration locale

`verify` reconstruit les identités depuis les signatures **déclarées dans
l'attestation**. Un tiers qui n'a jamais lancé Récade doit pouvoir vérifier sans
rien configurer.

### Échapper tout ce qui vient de Git

Le nom du dépôt vient du nom de dossier, et un dossier accepte n'importe quoi —
y compris `<img src=x onerror=…>`. Sans échappement, ce code atterrit dans un
document que l'utilisateur transmet à un tiers.

Git filtre lui-même les chevrons dans les noms d'auteur, mais pas les guillemets
ni les esperluettes. On échappe tout, systématiquement.

L'URL du remote est **assainie** avant d'être inscrite : la forme
`https://user:jeton@host/…` est courante, et l'écrire telle quelle publierait le
jeton.

## Le contrat

`schema.ts` est la source de vérité. Il est versionné (`schemaVersion`) et
exporté : l'API de la phase 2 validera exactement le même objet. Le CLI valide
sa **propre** sortie avant de l'écrire — un contrat qu'on n'applique pas à
soi-même n'est pas un contrat.

### Attestation

| Champ | Rôle |
|---|---|
| `repository.headSha` | L'ancrage. Tout se recalcule depuis lui. |
| `repository.firstCommitSha` | Atteste qu'il s'agit bien du même dépôt. |
| `repository.totalCommits` · `contributors` · `trackedFiles` | Le dépôt à l'ancrage. |
| `repository.remote` | Où vit le dépôt, sans identifiant. `null` si absent. |
| `contribution.signatures` | Les signatures retenues, détaillées pour audit. |
| `contribution.commits` · `rank` | Le cœur de l'affirmation. |
| `contribution.mergeShas` | Chaque fusion comptée, pour les recompter une à une. |
| `volume` · `stack` | Mesurés dans l'arbre de l'ancrage. |

### Dossier

`kind: "portfolio"`, une liste d'attestations et leurs cumuls. Aucun cumul n'est
une estimation : ce sont des sommes de compteurs eux-mêmes réfutables. Si une
attestation tombe, le cumul tombe avec elle.

## Ce que Récade ne prouve pas

À dire clairement plutôt qu'à laisser découvrir.

- **Un dépôt privé reste privé.** Un recruteur sans accès ne recalcule rien. Les
  chiffres sont alors *déclaratifs*, et l'attestation l'écrit noir sur blanc.
  La vérification s'adresse au détenteur du dépôt — l'ancien employeur, le
  client — c'est-à-dire à la personne qu'on appelle pour une prise de
  références.
- **Le volume n'est pas « les lignes que vous avez écrites »**, c'est le volume
  du dépôt à l'ancrage. L'étiquette le dit.
- **Un commit n'est pas une mesure de valeur.** Récade compte, il ne juge pas.

## Étendre

| Besoin | Où |
|---|---|
| Nouveau langage compté | `LANGUAGES` dans `scan.ts` |
| Nouveau marqueur de pile | `STACK_MARKERS` dans `scan.ts` |
| Nouveau chemin à exclure | `VENDORED_SEGMENTS` / `EXCLUDED_BASENAMES` |
| Nouveau format de sortie | un module frère de `html.ts`, branché dans `index.ts` |
| Nouveau champ du bundle | `schema.ts` d'abord — **optionnel** si le schéma ne change pas de version |

Ajouter un champ obligatoire invalide toutes les attestations existantes :
incrémenter `schemaVersion` et gérer les deux, ou rendre le champ optionnel.

## Outillage

```bash
pnpm install
pnpm build          # tsup → apps/cli/dist
pnpm test           # vitest
pnpm type-check     # tsc --noEmit, strict
pnpm build:docs           # docs/*.md → docs/*.html
```

Le HTML de `docs/` n'est jamais édité à la main.
