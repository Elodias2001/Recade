import { execFile, spawn } from "node:child_process";
import { access, constants, stat, unlink } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";

const run = promisify(execFile);

/**
 * Chemins habituels d'un navigateur Chromium selon la plateforme.
 * `RECADE_CHROME` permet d'en imposer un autre.
 */
const CANDIDATES: Record<string, readonly string[]> = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
  linux: [],
};

const LINUX_BINARIES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];

export async function findChrome(): Promise<string | null> {
  const forced = process.env["RECADE_CHROME"];
  if (forced) return (await exists(forced)) ? forced : null;

  for (const path of CANDIDATES[process.platform] ?? []) {
    if (await exists(path)) return path;
  }

  for (const bin of LINUX_BINARIES) {
    const found = await run("which", [bin])
      .then((r) => r.stdout.trim())
      .catch(() => "");
    if (found) return found;
  }

  return null;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export class NoBrowserError extends Error {
  constructor() {
    super(
      "Aucun navigateur Chromium trouvé pour produire le PDF.\n" +
        "    Installez Google Chrome, ou indiquez-en un : RECADE_CHROME=/chemin/vers/chrome",
    );
    this.name = "NoBrowserError";
  }
}

/**
 * Imprime le HTML en PDF via un Chromium déjà installé.
 *
 * Le CLI n'embarque pas de navigateur : ce serait 300 Mo dans un paquet npm.
 * Et Chrome en mode `--print-to-pdf` ne rend pas la main une fois le fichier
 * écrit — on l'attend puis on le tue, sinon le processus traîne indéfiniment.
 */
export async function htmlToPdf(html: string, outPath: string): Promise<void> {
  const chrome = await findChrome();
  if (!chrome) throw new NoBrowserError();

  const dir = await mkdtemp(join(tmpdir(), "recade-"));
  const source = join(dir, "attestation.html");
  await writeFile(source, html, "utf8");
  await unlink(outPath).catch(() => undefined);

  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-pdf-header-footer",
      `--user-data-dir=${join(dir, "profil")}`,
      `--print-to-pdf=${outPath}`,
      `file://${source}`,
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForFile(outPath, 30_000);
  } finally {
    child.kill("SIGKILL");
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function waitForFile(path: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const size = await stat(path)
      .then((s) => s.size)
      .catch(() => 0);
    if (size > 0) {
      // Laisse Chrome finir d'écrire avant de le tuer.
      await new Promise((r) => setTimeout(r, 600));
      return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Le navigateur n'a pas produit le PDF dans le délai imparti.");
}
