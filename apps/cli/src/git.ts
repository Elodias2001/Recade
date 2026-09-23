import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Les dépôts volumineux crachent beaucoup : CIR sort ~2 000 lignes de log. */
const MAX_BUFFER = 128 * 1024 * 1024;

export class GitError extends Error {
  constructor(
    message: string,
    readonly args: readonly string[],
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "GitError";
  }
}

/**
 * Appelle le binaire `git`.
 *
 * `execFile` avec un tableau d'arguments, jamais `exec` avec une chaîne :
 * un nom de branche ou d'auteur tordu deviendrait sinon une injection shell.
 */
export async function git(cwd: string, args: readonly string[]): Promise<string> {
  try {
    const { stdout } = await run("git", [...args], {
      cwd,
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
      encoding: "utf8",
    });
    return stdout;
  } catch (cause) {
    throw new GitError(`git ${args.join(" ")} a échoué`, args, { cause });
  }
}

/** Lignes non vides de la sortie. */
export async function gitLines(cwd: string, args: readonly string[]): Promise<string[]> {
  const out = await git(cwd, args);
  return out.split("\n").filter((l) => l.length > 0);
}

/** Racine du dépôt contenant `path`, ou `null` si on n'est pas dans un dépôt. */
export async function repoRoot(path: string): Promise<string | null> {
  try {
    const out = await git(path, ["rev-parse", "--show-toplevel"]);
    return out.trim() || null;
  } catch {
    return null;
  }
}

/** Le dépôt a-t-il au moins un commit ? Un dépôt fraîchement init n'en a pas. */
export async function hasCommits(root: string): Promise<boolean> {
  try {
    await git(root, ["rev-parse", "--verify", "HEAD"]);
    return true;
  } catch {
    return false;
  }
}
