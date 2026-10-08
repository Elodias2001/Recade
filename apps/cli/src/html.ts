import { createHash } from "node:crypto";
import type { Bundle, Portfolio } from "./schema.js";

/**
 * Rend l'attestation en un **fichier HTML autonome** : aucune ressource
 * externe, ni police, ni feuille de style, ni script distant. On peut le
 * joindre à un courriel, l'imprimer, l'archiver dix ans.
 *
 * Le bundle JSON est embarqué dans le document : le fichier HTML **est**
 * l'attestation, pas une image de celle-ci. `recade verify attestation.html`
 * le relit et le recalcule.
 *
 * Direction **Fonte Hountondji** : la récade a un manche et une lame. Le manche
 * porte (identité, période, ancrage), la lame atteste (les chiffres).
 */

const nf = new Intl.NumberFormat("fr-FR");
const mf = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const df = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

/** Échappe toute donnée issue de Git : un nom d'auteur peut contenir du HTML. */
function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function fingerprint(value: Bundle | Portfolio): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * Sceau dérivé de l'empreinte du bundle.
 *
 * Chaque roi du Dahomey portait son emblème gravé sur la lame de sa récade, au
 * point que les historiens datent un objet rien qu'en le regardant. Ici, 24
 * crans autour de l'anneau encodent les trois premiers octets de l'empreinte :
 * deux attestations différentes se distinguent à l'œil nu, et le même bundle
 * regravera toujours le même sceau.
 */
function seal(hex: string): string {
  const bits = Number.parseInt(hex.slice(0, 6), 16);
  const ticks: string[] = [];
  const SLOTS = 24;

  for (let i = 0; i < SLOTS; i += 1) {
    if (!((bits >> i) & 1)) continue;
    const angle = (i / SLOTS) * Math.PI * 2 - Math.PI / 2;
    const [x1, y1] = [32 + Math.cos(angle) * 27.5, 32 + Math.sin(angle) * 27.5];
    const [x2, y2] = [32 + Math.cos(angle) * 30.5, 32 + Math.sin(angle) * 30.5];
    ticks.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#B8863B" stroke-width="1.5"/>`,
    );
  }

  return `<svg viewBox="0 0 64 64" width="62" height="62" role="img" aria-label="Sceau dérivé de l'empreinte de l'attestation">
      <circle cx="32" cy="32" r="24.5" fill="none" stroke="#B8863B" stroke-width="1.4"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#B8863B" stroke-width="0.7" opacity=".5"/>
      ${ticks.join("\n      ")}
      <path d="M32 15 L42 25 L42 39 L32 49 L22 39 L22 25 Z" fill="none" stroke="#14120F" stroke-width="1.6"/>
      <path d="M32 22 L37.5 27.5 L37.5 36.5 L32 42 L26.5 36.5 L26.5 27.5 Z" fill="#B8863B"/>
      <circle cx="32" cy="32" r="3.2" fill="#F2EBDD"/>
    </svg>`;
}

/**
 * Une ligne de l'attestation.
 *
 * `preuve` n'est pas facultative, et c'est volontaire : la règle 2 d'AGENTS.md
 * dit qu'un compteur sans le moyen de le recalculer n'a pas sa place dans le
 * bundle. En la rendant obligatoire dans le type, le compilateur refuse un
 * chiffre orphelin avant même qu'un test ait à le dire.
 */
type Ligne = { label: string; value: string; preuve: string; note?: string };

function row(l: Ligne, i: number): string {
  const id = `pr-${i}`;
  return `<div class="r">
          <input type="checkbox" id="${id}" class="bascule">
          <div class="tete">
            <span>${esc(l.label)}</span>
            <label for="${id}" class="voir" title="Comment ce chiffre se recalcule">preuve</label>
            <b>${l.value}${l.note ? `<i>${esc(l.note)}</i>` : ""}</b>
          </div>
          <div class="preuve">${esc(l.preuve)}</div>
        </div>`;
}

export function renderHtmlAttestation(bundle: Bundle): string {
  const { repository: repo, contribution: me, volume, stack } = bundle;
  const print = fingerprint(bundle);

  const period = `${mf.format(new Date(me.firstCommitDate))} → ${mf.format(new Date(me.lastCommitDate))}`;
  const rankNote =
    repo.contributors > 1
      ? `${me.rank}${me.rank === 1 ? "er" : "e"} contributeur sur ${repo.contributors}`
      : "seul contributeur";

  const ancrage = repo.headSha.slice(0, 10);
  const lignes: Ligne[] = [
    {
      label: "Commits signés",
      value: `${nf.format(me.commits)} <small>/ ${nf.format(repo.totalCommits)}</small>`,
      note: rankNote,
      preuve: `Recompté par git log dans l'arbre du commit ${ancrage}, limité aux signatures listées plus bas.`,
    },
    ...(me.mergesIntegrated > 0
      ? [
          {
            label: "Fusions intégrées",
            value: nf.format(me.mergesIntegrated),
            note: "relues sous sa responsabilité",
            preuve: `${nf.format(me.mergeShas.length)} empreintes de fusion voyagent dans ce document, confrontées une par une au dépôt.`,
          },
        ]
      : []),
    ...volume.slice(0, 4).map((v) => ({
      label: `Lignes ${v.language}`,
      value: nf.format(v.lines),
      preuve: `Comptées par git grep -cI dans l'arbre du commit ${ancrage}, jamais sur le dossier de travail.`,
    })),
    {
      label: "Fichiers suivis",
      value: nf.format(repo.trackedFiles),
      preuve: `Relevés par git ls-tree dans l'arbre du commit ${ancrage}, hors chemins vendorisés.`,
    },
  ];
  const rows = lignes.map(row).join("\n        ");

  const signatures = me.signatures
    .map(
      (s) =>
        `<li><span>${esc(s.name)}</span> <code>${esc(s.email)}</code> <b>${nf.format(s.commits)}</b></li>`,
    )
    .join("\n          ");

  const stackHtml = stack.map((t) => `<span class="tag">${esc(t)}</span>`).join("");

  // Le bundle voyage dans le document. `<` est neutralisé pour qu'aucune
  // chaîne du JSON ne puisse refermer la balise script.
  const embedded = JSON.stringify(bundle).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Attestation de contribution — ${esc(repo.name)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  :root {
    --forge:#14120F; --forge-2:#2A241C; --laiton:#B8863B; --laiton-clair:#E0B65C;
    --laiton-fonce:#7A5115; --vert:#5E7A66; --ivoire:#F2EBDD; --ivoire-2:#DCD2BE; --cendre:#8A8073;
  }
  *{box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{
    margin:0;padding:32px 16px;background:#E7E3DA;
    font-family:"Avenir Next","Helvetica Neue",Segoe UI,Arial,sans-serif;
    font-size:14px;line-height:1.5;color:var(--forge);
  }
  .sheet{max-width:760px;margin:0 auto;background:var(--ivoire);
    box-shadow:0 1px 2px rgba(20,18,15,.14),0 18px 50px rgba(20,18,15,.16)}
  .manche{background:var(--forge);color:#fff;padding:26px 30px;
    display:flex;justify-content:space-between;align-items:center;gap:24px}
  .manche h1{margin:0;font-size:12px;font-weight:600;letter-spacing:2.6px;
    text-transform:uppercase;color:var(--laiton)}
  .manche .repo{margin-top:8px;font-size:26px;font-weight:600;letter-spacing:-.5px}
  .manche .sub{margin-top:7px;font-size:12.5px;color:rgba(255,255,255,.7)}
  .seal{flex:0 0 auto;opacity:.97}
  .lame{padding:26px 30px 30px}
  .bloc+.bloc{margin-top:22px}
  h2{margin:0 0 12px;font-size:10.5px;font-weight:700;letter-spacing:1.6px;
    text-transform:uppercase;color:var(--cendre);
    padding-bottom:7px;border-bottom:1px solid var(--ivoire-2)}
  .r{padding:8px 0;border-bottom:1px solid #E7DFCD}
  .r:last-child{border-bottom:0}
  .r .tete{display:flex;align-items:baseline;gap:10px}
  .r .tete b{margin-left:auto}
  .r span{color:#5D554A;font-size:13.5px}

  /* Le dépliage d'une preuve est le SEUL mouvement admis dans l'attestation.
     Il passe par une case à cocher : ce document est autonome et ne contient
     aucun script. À l'impression, tout est déplié d'office. */
  .bascule{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;
    clip-path:inset(50%);white-space:nowrap}
  .voir{font-size:10px;letter-spacing:.6px;color:var(--cendre);cursor:pointer;
    user-select:none;border-bottom:1px dotted var(--ivoire-2);line-height:1.2}
  .voir:hover{color:var(--laiton-fonce);border-bottom-color:var(--laiton)}
  .bascule:checked~.tete .voir{color:var(--laiton-fonce);border-bottom-style:solid}
  .bascule:focus-visible+.voir{outline:2px solid var(--laiton);outline-offset:2px}
  .bascule:checked~.voir .o,.bascule:not(:checked)~.voir .f{display:none}
  .preuve{max-height:0;overflow:hidden;opacity:0;font-size:11.5px;line-height:1.5;
    color:#5D554A;transition:max-height .28s ease,opacity .2s ease,margin-top .28s ease}
  .bascule:checked~.preuve{max-height:8rem;opacity:1;margin-top:5px}
  .r b{font-weight:600;font-size:15px;text-align:right;white-space:nowrap}
  .r b small{font-weight:400;color:var(--cendre);font-size:12.5px}
  .r b i{display:block;font-style:normal;font-size:11px;font-weight:400;
    color:var(--cendre);margin-top:2px}
  ul.sig{list-style:none;margin:0;padding:0}
  ul.sig li{display:flex;align-items:baseline;gap:10px;padding:6px 0;
    border-bottom:1px solid #E7DFCD;font-size:13px}
  ul.sig li:last-child{border-bottom:0}
  ul.sig code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:11.5px;color:var(--cendre);flex:1}
  ul.sig b{font-weight:600}
  .tag{display:inline-block;margin:0 5px 5px 0;padding:3px 9px;
    background:#EDE4D2;border:1px solid var(--ivoire-2);
    font-size:11.5px;color:#4A4339}
  .pied{background:var(--forge-2);color:rgba(255,255,255,.72);
    padding:16px 30px;font-size:11px;line-height:1.75}
  .pied code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    color:var(--laiton-clair);word-break:break-all}
  .pied strong{color:#fff;font-weight:600}
  .pied .portee{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.14)}
  @media print{
    body{background:#fff;padding:0} .sheet{box-shadow:none;max-width:none}
    /* un document imprimé ne se déplie pas : tout est montré */
    .voir,.bascule{display:none}
    .preuve{max-height:none;opacity:1;margin-top:5px;overflow:visible}
    .r{break-inside:avoid}
  }
  @media (max-width:560px){ .manche{flex-direction:column;align-items:flex-start} }
</style>
</head>
<body>
  <main class="sheet">

    <header class="manche">
      <div>
        <h1>Attestation de contribution</h1>
        <div class="repo">${esc(repo.name)}</div>
        <div class="sub">${esc(period)} · mesurée dans le dépôt, aucun code transmis</div>
      </div>
      <div class="seal">${seal(print)}</div>
    </header>

    <div class="lame">
      <section class="bloc">
        <h2>Ce que le dépôt atteste</h2>
        ${rows}
      </section>

      <section class="bloc">
        <h2>Signatures reconnues</h2>
        <ul class="sig">
          ${signatures}
        </ul>
      </section>

      ${
        stack.length > 0
          ? `<section class="bloc">
        <h2>Stack détectée</h2>
        <div>${stackHtml}</div>
      </section>`
          : ""
      }
    </div>

    <footer class="pied">
      <div><strong>Ancrage</strong> — commit <code>${esc(repo.headSha)}</code></div>
      <div><strong>Premier commit</strong> — <code>${esc(repo.firstCommitSha)}</code></div>
      <div><strong>Empreinte</strong> — <code>${print}</code></div>
      ${repo.remote ? `<div><strong>Dépôt</strong> — <code>${esc(repo.remote)}</code></div>` : ""}
      <div class="portee">
        <strong>Portée de la vérification.</strong>
        Tous les chiffres ci-dessus se recalculent depuis le commit d'ancrage par
        <strong>quiconque dispose de ce dépôt</strong> :
        <code>recade verify cette-attestation.html &lt;dépôt&gt;</code>.
        Si le dépôt est privé et que vous n'y avez pas accès, ces chiffres restent
        <strong>déclaratifs</strong> — demandez leur confirmation à celui qui le détient.
      </div>
      <div style="margin-top:8px;opacity:.75">Émise le ${esc(df.format(new Date(bundle.generatedAt)))}.</div>
    </footer>

  </main>

  <script type="application/json" id="recade-bundle">${embedded}</script>
</body>
</html>
`;
}

/**
 * Rend un **dossier** : plusieurs attestations et leurs cumuls, en un fichier.
 *
 * Même principe que l'attestation simple — autonome, bundle embarqué, sceau
 * dérivé de l'empreinte — mais la lame porte d'abord les cumuls, puis une
 * ligne par dépôt. C'est la forme qu'attend un appel d'offres.
 */
export function renderHtmlPortfolio(portfolio: Portfolio): string {
  const { holder, totals, attestations } = portfolio;
  const print = fingerprint(portfolio);

  const period = `${mf.format(new Date(totals.firstCommitDate))} → ${mf.format(new Date(totals.lastCommitDate))}`;
  const years = Math.max(
    1,
    Math.round(
      (new Date(totals.lastCommitDate).getTime() - new Date(totals.firstCommitDate).getTime()) /
        (365.25 * 24 * 3600 * 1000),
    ),
  );

  const chiffres = [
    [String(totals.repositories), totals.repositories > 1 ? "plateformes" : "plateforme"],
    [String(totals.leading), totals.leading > 1 ? "en tête" : "en tête"],
    [nf.format(totals.commits), "commits signés"],
    [nf.format(totals.mergesIntegrated), "fusions intégrées"],
  ]
    .map(([v, l]) => `<div><b>${esc(v ?? "")}</b><span>${esc(l ?? "")}</span></div>`)
    .join("");

  const cartes = attestations
    .map((b) => {
      const rang =
        b.repository.contributors > 1
          ? `${b.contribution.rank}<sup>${b.contribution.rank === 1 ? "er" : "e"}</sup> / ${b.repository.contributors}`
          : "seul";
      const top = b.volume[0];
      return `<article class="dep">
          <header>
            <h3>${esc(b.repository.name)}</h3>
            <span class="per">${esc(mf.format(new Date(b.contribution.firstCommitDate)))} → ${esc(mf.format(new Date(b.contribution.lastCommitDate)))}</span>
          </header>
          <dl>
            <div><dt>Commits</dt><dd>${nf.format(b.contribution.commits)} <small>/ ${nf.format(b.repository.totalCommits)}</small></dd></div>
            <div><dt>Rang</dt><dd>${rang}</dd></div>
            <div><dt>Fusions</dt><dd>${nf.format(b.contribution.mergesIntegrated)}</dd></div>
            <div><dt>Volume</dt><dd>${top ? `${nf.format(top.lines)} <small>l. ${esc(top.language)}</small>` : "—"}</dd></div>
          </dl>
          <footer>${b.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</footer>
        </article>`;
    })
    .join("\n        ");

  const signatures = holder.signatures
    .map(
      (s) =>
        `<li><span>${esc(s.name)}</span> <code>${esc(s.email)}</code> <b>${nf.format(s.commits)}</b></li>`,
    )
    .join("\n          ");

  const embedded = JSON.stringify(portfolio).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dossier de contribution — ${nf.format(totals.repositories)} plateformes</title>
<style>
  @page { size: A4; margin: 14mm; }
  :root{--forge:#14120F;--forge-2:#2A241C;--laiton:#B8863B;--laiton-clair:#E0B65C;
    --ivoire:#F2EBDD;--ivoire-2:#DCD2BE;--cendre:#8A8073}
  *{box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{margin:0;padding:32px 16px;background:#E7E3DA;
    font-family:"Avenir Next","Helvetica Neue",Segoe UI,Arial,sans-serif;
    font-size:14px;line-height:1.5;color:var(--forge)}
  .sheet{max-width:820px;margin:0 auto;background:var(--ivoire);
    box-shadow:0 1px 2px rgba(20,18,15,.14),0 18px 50px rgba(20,18,15,.16)}
  .manche{background:var(--forge);color:#fff;padding:26px 30px;
    display:flex;justify-content:space-between;align-items:center;gap:24px}
  .manche h1{margin:0;font-size:12px;font-weight:600;letter-spacing:2.6px;
    text-transform:uppercase;color:var(--laiton)}
  .manche .big{margin-top:8px;font-size:25px;font-weight:600;letter-spacing:-.5px}
  .manche .sub{margin-top:7px;font-size:12.5px;color:rgba(255,255,255,.7)}
  .cumuls{display:flex;background:#FAF4E8;border-bottom:1px solid #E8DDC6}
  .cumuls div{flex:1;padding:16px 10px 15px 30px}
  .cumuls div+div{border-left:1px solid #EFE6D4;padding-left:20px}
  .cumuls b{display:block;font-size:24px;font-weight:600;letter-spacing:-.6px;color:var(--forge)}
  .cumuls span{display:block;margin-top:3px;font-size:10px;font-weight:600;
    letter-spacing:.9px;text-transform:uppercase;color:#97824F}
  .lame{padding:24px 30px 28px}
  h2{margin:0 0 14px;font-size:10.5px;font-weight:700;letter-spacing:1.6px;
    text-transform:uppercase;color:var(--cendre);padding-bottom:7px;
    border-bottom:1px solid var(--ivoire-2)}
  .dep{border:1px solid var(--ivoire-2);border-top:2px solid var(--laiton);
    padding:14px 16px;margin-bottom:12px;break-inside:avoid}
  .dep header{display:flex;justify-content:space-between;align-items:baseline;gap:14px}
  .dep h3{margin:0;font-size:16px;font-weight:600;letter-spacing:-.2px}
  .dep .per{font-size:11px;color:var(--cendre);white-space:nowrap}
  .dep dl{display:flex;gap:26px;margin:12px 0 0;padding:0;flex-wrap:wrap}
  .dep dt{font-size:9.5px;font-weight:600;letter-spacing:.8px;
    text-transform:uppercase;color:var(--cendre)}
  .dep dd{margin:2px 0 0;font-size:17px;font-weight:600;letter-spacing:-.3px}
  .dep dd small{font-size:11.5px;font-weight:400;color:var(--cendre)}
  .dep footer{margin-top:12px;padding-top:10px;border-top:1px solid #E7DFCD}
  .tag{display:inline-block;margin:0 4px 4px 0;padding:2px 8px;background:#EDE4D2;
    border:1px solid var(--ivoire-2);font-size:11px;color:#4A4339}
  ul.sig{list-style:none;margin:0;padding:0}
  ul.sig li{display:flex;align-items:baseline;gap:10px;padding:6px 0;
    border-bottom:1px solid #E7DFCD;font-size:13px}
  ul.sig li:last-child{border-bottom:0}
  ul.sig code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:11.5px;color:var(--cendre);flex:1}
  .pied{background:var(--forge-2);color:rgba(255,255,255,.72);padding:16px 30px;
    font-size:11px;line-height:1.75}
  .pied code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    color:var(--laiton-clair);word-break:break-all}
  .pied strong{color:#fff;font-weight:600}
  .pied .portee{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.14)}
  @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;max-width:none}}
  @media (max-width:620px){.manche,.cumuls{flex-direction:column;align-items:flex-start}
    .cumuls div+div{border-left:0;padding-left:30px}}
</style>
</head>
<body>
  <main class="sheet">

    <header class="manche">
      <div>
        <h1>Dossier de contribution</h1>
        <div class="big">${nf.format(totals.repositories)} plateformes conçues et mises en production</div>
        <div class="sub">${esc(period)} · ${years} an${years > 1 ? "s" : ""} · mesuré dans les dépôts, aucun code transmis</div>
      </div>
      <div class="seal">${seal(print)}</div>
    </header>

    <div class="cumuls">${chiffres}</div>

    <div class="lame">
      <section>
        <h2>Plateforme par plateforme</h2>
        ${cartes}
      </section>

      <section style="margin-top:22px">
        <h2>Signatures reconnues</h2>
        <ul class="sig">
          ${signatures}
        </ul>
      </section>
    </div>

    <footer class="pied">
      <div><strong>Empreinte du dossier</strong> — <code>${print}</code></div>
      <div class="portee">
        <strong>Portée de la vérification.</strong>
        Chaque plateforme porte son commit d'ancrage, et ses chiffres se
        recalculent par <strong>quiconque dispose du dépôt correspondant</strong> :
        <code>recade verify ce-dossier.html &lt;dépôt…&gt;</code>.
        Les dépôts privés auxquels vous n'avez pas accès restent
        <strong>déclaratifs</strong> — demandez-en confirmation à leur détenteur.
      </div>
      <div style="margin-top:8px;opacity:.75">Émis le ${esc(df.format(new Date(portfolio.generatedAt)))}.</div>
    </footer>

  </main>

  <script type="application/json" id="recade-bundle">${embedded}</script>
</body>
</html>
`;
}
