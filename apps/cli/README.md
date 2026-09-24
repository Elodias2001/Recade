# Récade

> Atteste ce que tu as construit — sans faire sortir une ligne de code.

CLI local qui transforme un dépôt Git — **y compris privé, y compris sous NDA** —
en attestation de contribution **vérifiable**, sans qu'aucun contenu ne quitte
la machine.

```bash
npx @elodias/recade whoami ~/Projets/mon-depot        # quelles signatures sont les miennes ?
npx @elodias/recade whoami --add moi@exemple.io       # les déclarer, une fois pour toutes
npx @elodias/recade scan ~/Projets/mon-depot          # attester
```

```
◆  RÉCADE   attestation de contribution
   mon-depot · scan local, aucun code transmis

Période             novembre 2025 → septembre 2026
Commits signés      1 025 / 1 976   1er contributeur sur 7
PR fusionnées       185   relues sous votre responsabilité
Volume du dépôt     142 228 lignes TypeScript
Stack détectée      Docker · Drizzle ORM · Hono · Next.js · React
```

## Pourquoi

Sur un CV, « premier contributeur d'une équipe de dix » est une affirmation que
personne ne peut vérifier. Et le meilleur travail d'un développeur sénior est
justement celui qu'il ne peut pas montrer : dépôts privés, clients bancaires,
plateformes d'État.

Les autres outils exigent un OAuth GitHub et envoient le code à un modèle de
langage. Inutilisable sur du travail confidentiel.

Récade lit `.git`, **compte**, et n'écrit que des nombres.

## Réfutable, pas « prouvé »

L'attestation embarque le commit d'ancrage, celui du premier commit et celui de
chaque fusion revendiquée :

```bash
npx @elodias/recade scan ~/Projets/mon-depot --html attestation.html --pdf attestation.pdf
npx @elodias/recade verify attestation.html ~/Projets/mon-depot
```

Quiconque dispose du dépôt recalcule et retombe sur les mêmes chiffres, ou pas.

**Un dépôt privé reste privé** : un destinataire sans accès ne recalcule rien,
et l'attestation l'écrit noir sur blanc plutôt que de le taire. La vérification
s'adresse à celui qui détient le dépôt — l'ancien employeur, le client.
Récade ne remplace pas la prise de références : **il la rend chiffrée.**

## Dossiers

Plusieurs chemins produisent un dossier avec les cumuls — la forme qu'exigent
les appels d'offres et les postes séniors.

```bash
npx @elodias/recade scan ~/a ~/b ~/c --html dossier.html --pdf dossier.pdf
npx @elodias/recade verify dossier.html ~/a          # vérification partielle acceptée
```

## Ce qui ne sort jamais

Aucun appel réseau, aucune télémétrie, pas de backend. Le CLI interroge `git` et
rien d'autre. Le code est ouvert : quelques centaines de lignes, lisibles en une
heure.

## Prérequis

Node ≥ 20 et Git. Pour la sortie PDF, un Chromium déjà installé — Récade n'en
embarque pas.

## Documentation

[github.com/Elodias2001/Recade](https://github.com/Elodias2001/Recade) —
guide de démarrage, document technique, manuel utilisateur, plan de tests.

## Le nom

La **récade** (en fon *makpo*) est le sceptre du roi d'Abomey, remis au messager
pour garantir l'authenticité du message royal : la présenter équivalait
juridiquement à la présence du roi. Une extension portable de la souveraineté —
exactement ce qu'est un lien d'attestation.

MIT © Elodias ADIMOU
