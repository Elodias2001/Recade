# Documentation

**Récade** atteste ce que vous avez construit, sans faire sortir une ligne de
code. Un CLI local lit un dépôt Git — y compris privé, y compris sous NDA — et
en produit une attestation de contribution **réfutable**.

## Les trois fiches

| Fiche | Pour qui |
|---|---|
| [Document technique](01-architecture.html) | Qui reprend le code : architecture, décisions et leurs raisons, contrat du bundle, limites connues |
| [Manuel utilisateur](02-guide-utilisateur.html) | Le développeur qui atteste, le détenteur du dépôt qui vérifie, l'agence qui monte un dossier |
| [Plan de tests](03-plan-de-tests.html) | Couverture automatique, recette manuelle, valeurs de référence, dette assumée |

## En trente secondes

```bash
npx recade whoami ~/Projets/mon-depot          # qui suis-je dans ce dépôt ?
npx recade whoami --add moi@exemple.io         # déclarer mes signatures
npx recade scan ~/Projets/mon-depot            # attester
npx recade scan ~/a ~/b ~/c --pdf dossier.pdf  # un dossier de plusieurs plateformes
npx recade verify attestation.html ~/Projets/mon-depot
```

## Le principe

Un CV affirme. Récade **compte**, puis laisse **réfuter**.

L'attestation embarque le commit d'ancrage, celui du premier commit et celui de
chaque fusion revendiquée. Quiconque dispose du dépôt recalcule et retombe sur
les mêmes chiffres, ou pas.

Un dépôt privé reste privé : un destinataire sans accès ne recalcule rien, et
l'attestation l'écrit noir sur blanc plutôt que de le taire. La vérification
s'adresse à celui qui détient le dépôt — l'ancien employeur, le client.
**Récade ne remplace pas la prise de références : il la rend chiffrée.**

## Le nom

La **récade** — en fon *makpo* — est le sceptre du roi d'Abomey, remis au
messager pour garantir à son destinataire l'authenticité du message royal. La
présenter équivalait juridiquement à la présence du roi : une extension portable
de la souveraineté.

C'est exactement ce qu'est un lien d'attestation — un petit objet qu'on remet, et
qui parle à votre place.

Direction design **Fonte Hountondji**, d'après la corporation royale des
forgerons et orfèvres d'Abomey qui fondait le métal de la cour, récades
comprises. La récade a un manche et une lame : le manche porte, la lame atteste.
Toute surface du produit reprend cette partition.
