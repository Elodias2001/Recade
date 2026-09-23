import pc from "picocolors";
import type { Bundle } from "./schema.js";
import type { Verification } from "./verify.js";

/**
 * Sortie terminal selon le principe **manche / lame** : le manche porte
 * (identité, période, dépôt), la lame atteste (les chiffres).
 */

const nf = new Intl.NumberFormat("fr-FR");
const mf = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" });

const laiton = (s: string): string => pc.yellow(s);
const cendre = (s: string): string => pc.dim(s);

const month = (iso: string): string => mf.format(new Date(iso));
const rule = (w = 62): string => cendre("─".repeat(w));

function line(label: string, value: string, note?: string): string {
  const padded = label.padEnd(20, " ");
  return `  ${cendre(padded)}${value}${note ? `   ${cendre(note)}` : ""}`;
}

export function renderBundle(bundle: Bundle): string {
  const { repository: repo, contribution: me, volume, stack } = bundle;
  const out: string[] = [];

  // ---- manche ----
  out.push("");
  out.push(`  ${laiton("◆")}  ${pc.bold("RÉCADE")}   ${cendre("attestation de contribution")}`);
  out.push(`     ${pc.bold(repo.name)} ${cendre("· scan local, aucun code transmis")}`);
  out.push("");
  out.push(rule());

  // ---- lame ----
  out.push(
    line("Période", `${month(me.firstCommitDate)} → ${month(me.lastCommitDate)}`),
  );

  const rankNote =
    repo.contributors > 1
      ? `${me.rank}${me.rank === 1 ? "er" : "e"} contributeur sur ${repo.contributors}`
      : "seul contributeur";
  out.push(
    line("Commits signés", `${nf.format(me.commits)} / ${nf.format(repo.totalCommits)}`, rankNote),
  );

  if (me.mergesIntegrated > 0) {
    out.push(
      line("PR fusionnées", nf.format(me.mergesIntegrated), "relues sous votre responsabilité"),
    );
  }

  const top = volume[0];
  if (top) {
    const rest = volume.slice(1, 3).map((v) => `${v.language} ${nf.format(v.lines)}`);
    out.push(
      line(
        "Volume du dépôt",
        `${nf.format(top.lines)} lignes ${top.language}`,
        rest.length > 0 ? rest.join(" · ") : undefined,
      ),
    );
  }

  if (stack.length > 0) out.push(line("Stack détectée", stack.join(" · ")));

  out.push(rule());

  // ---- identités retenues : l'audit du comptage ----
  out.push(`  ${cendre("Identités retenues")}`);
  for (const s of me.signatures) {
    out.push(
      `    ${laiton("·")} ${s.name} ${cendre(`<${s.email}>`)}  ${pc.bold(nf.format(s.commits))}`,
    );
  }

  out.push(rule());
  out.push(
    `  ${cendre(`HEAD ${repo.headSha.slice(0, 7)} · ${nf.format(me.mergeShas.length)} SHA de fusion embarqués`)}`,
  );
  out.push(`  ${cendre("réfutable par")} ${laiton("recade verify")}`);
  out.push("");

  return out.join("\n");
}

export function renderAuthors(
  groups: ReadonlyArray<{
    key: string;
    commits: number;
    signatures: ReadonlyArray<{ name: string; email: string; commits: number }>;
  }>,
  mineKeys: ReadonlySet<string>,
): string {
  const out: string[] = [""];
  out.push(`  ${pc.bold("Auteurs du dépôt")} ${cendre("(signatures regroupées)")}`);
  out.push("");

  for (const g of groups) {
    const isMine = g.signatures.some((s) => mineKeys.has(s.email));
    const mark = isMine ? laiton("◆") : cendre("·");
    out.push(`  ${mark} ${pc.bold(nf.format(g.commits).padStart(5))}  ${g.signatures[0]?.name ?? g.key}`);
    for (const s of g.signatures) {
      out.push(`         ${cendre(`${s.name} <${s.email}>`)}  ${cendre(nf.format(s.commits))}`);
    }
  }

  out.push("");
  return out.join("\n");
}

export function renderVerification(v: Verification): string {
  const out: string[] = [""];
  const confirmee = v.verdict === "confirmée";

  out.push(`  ${laiton("◆")}  ${pc.bold("RÉCADE")}   ${cendre("vérification d'attestation")}`);
  out.push(`     ${pc.bold(v.repositoryName)}`);
  out.push("");
  out.push(rule());

  for (const c of v.checks) {
    const mark =
      c.status === "ok" ? pc.green("✓") : c.status === "divergent" ? pc.red("✗") : pc.red("?");
    const label = cendre(c.label.padEnd(22, " "));
    const detail =
      c.status === "ok"
        ? c.found
        : `${pc.red(c.found)}   ${cendre(`attesté : ${c.claimed}`)}`;
    out.push(`  ${mark} ${label}${detail}`);
  }

  out.push(rule());

  if (v.notVerified.length > 0) {
    out.push(`  ${cendre(`Non recalculé par cette version : ${v.notVerified.join(" · ")}`)}`);
  }

  out.push("");
  out.push(
    confirmee
      ? `  ${pc.green("✓")} ${pc.bold("Attestation confirmée")} ${cendre("— tous les compteurs se recalculent à l'identique.")}`
      : `  ${pc.red("✗")} ${pc.bold("Attestation réfutée")} ${cendre("— au moins un compteur ne tient pas.")}`,
  );
  out.push("");

  return out.join("\n");
}
