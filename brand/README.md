# Fonte Hountondji — kit de marque

Direction design validée le 23/09/2026. **Le nom du produit n'est pas encore
arrêté** : ce dossier ne contient donc que ce qui n'en dépend pas — l'emblème,
la palette et les gabarits. Les verrouillages (emblème + nom) seront ajoutés
dès que le nom sera choisi, puis ce dossier deviendra le `brand/` du projet.

## Origine

Les **Hountondji** étaient la corporation royale des forgerons et orfèvres
d'Abomey : tout le métal commandé par la cour sortait de chez eux, récades et
asen royaux compris. C'est un des leurs qui a forgé l'asen du roi Gbéhanzin.

## Principe structurel

La récade a un **manche** et une **lame**.
Le manche porte : identité, porteur, date. La lame atteste : emblème, chiffres.
Toute surface du produit reprend cette partition — ce n'est pas un motif de
fond, c'est l'anatomie de l'objet.

## Fichiers

### `svg/`
| Fichier | Usage |
|---|---|
| `embleme.svg` | Emblème bichrome (laiton + forge) sur transparent — usage par défaut |
| `embleme-mono-noir.svg` | Une seule encre, impression N&B, tampons |
| `embleme-mono-ivoire.svg` | Une seule encre claire, fonds sombres |
| `embleme-laiton.svg` | Laiton plein, une encre |
| `favicon.svg` | Version simplifiée : anneau intérieur et disque central retirés, illisibles sous 32 px |
| `tuile-sombre.svg` | Carré 512 sur noir de forge — avatar npm / GitHub |
| `tuile-claire.svg` | Carré 512 sur ivoire — documents, en-têtes |

### `png/`
`favicon-32` · `favicon-64` · `apple-touch-icon-180` · `embleme-256` ·
`embleme-1024` · `tuile-sombre-512` · `tuile-claire-512`.
Régénérés depuis les SVG — ne pas retoucher à la main.

### `ascii/`
Bannière du CLI. `banniere.txt` attend le nom.

## Palette

`palette.css` (variables CSS) et `tokens.json` (source de vérité, avec le rôle
de chaque couleur).

## Interdits

Pas de dégradé. Pas d'ombre portée diffuse. Pas de motif en fond d'écran.
Pas d'arrondi au-delà de 8 px. Du métal découpé, pas du décor plaqué.
