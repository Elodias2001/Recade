# Conventions — Récade

## Identité Git — non négociable

Ce dépôt est **personnel**. L'identité est verrouillée en config locale :

```
user.name  = Elodias (Perso)
user.email = olouwagnon@gmail.com
origin     = git@github-perso:Elodias2001/Recade.git
```

Le git **global** de cette machine est l'identité de travail
(`Elodias ADIMOU - TCM <elodias@thecreativemind.io>`). Elle ne doit **jamais**
apparaître dans l'historique de ce dépôt. Avant tout premier commit sur une
nouvelle copie :

```bash
git var GIT_AUTHOR_IDENT   # doit afficher Elodias (Perso)
```

Le remote passe par l'alias SSH `github-perso` (clé `id_ed25519_perso`), pas par
`github.com` (clé pro).

## Règles produit

1. **Aucun contenu ne sort de la machine.** Le CLI lit `.git` et, pour compter
   les lignes, ouvre les fichiers suivis — mais il n'en retient que des nombres.
   Aucun appel réseau, aucune télémétrie, pas de backend. L'invariant porte sur
   ce qui sort, pas sur ce qui est lu. Toute proposition qui le viole est
   rejetée, quel que soit son intérêt.
2. **Tout chiffre publié doit être réfutable.** Un compteur sans le SHA qui
   permet de le recalculer n'a pas sa place dans le bundle.
3. **Ne jamais deviner une identité.** En cas de doute sur l'appartenance d'un
   auteur, on demande — on ne rattache pas au hasard.
4. **Le code de tiers ne prouve rien.** Tout chemin vendorisé (`vendor/`,
   `node_modules/`, `github.com/`…) est exclu du volume comme de la détection de
   stack. CIR embarque un plugin Traefik en Go : l'attester ferait mentir
   l'attestation.

## Code

- TypeScript strict, `noUncheckedIndexedAccess` actif. Pas de `any`.
- Appels Git : `execFile` avec un tableau d'arguments. **Jamais** `exec` avec une
  chaîne interpolée — un nom de branche tordu deviendrait une injection shell.
- Le schéma du bundle vit dans `apps/cli/src/schema.ts`, il est **versionné**
  (`schemaVersion`) et exporté : l'API de la phase 2 validera le même.
- Pas de dépendance lourde dans le CLI. Rien qui embarque un navigateur — le PDF
  viendra du service web, pas d'ici.

## Commits

Conventional commits, en français.
`feat(cli): …` · `fix(cli): …` · `docs: …` · `chore: …` · `refactor: …`

## Design

Direction **Fonte Hountondji** — voir [`brand/README.md`](brand/README.md).
Le principe structurel (manche / lame) s'applique à toute surface produite, y
compris la sortie terminal et le futur HTML.
