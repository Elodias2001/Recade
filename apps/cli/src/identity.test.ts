import { describe, expect, it } from "vitest";
import { groupAuthors, matchesIdentity, type Author, type IdentityConfig } from "./identity.js";

const a = (name: string, email: string, commits: number): Author => ({ name, email, commits });

describe("groupAuthors", () => {
  it("regroupe deux noms partageant une adresse", () => {
    // Cas réel CIR : elodias-dev et « Elodias ADIMOU - TCM » commitent sous la
    // même adresse. Les compter séparément sous-évalue de 441 commits.
    const groups = groupAuthors([
      a("elodias-dev", "elodias@thecreativemind.io", 593),
      a("Elodias ADIMOU - TCM", "elodias@thecreativemind.io", 441),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.commits).toBe(1034);
  });

  it("regroupe deux adresses partageant un nom", () => {
    // Cas réel CIR : Derrick commite depuis un .io et un .fr.
    const groups = groupAuthors([
      a("Derrick", "derrick@thecreativemind.io", 64),
      a("Derrick", "derrick.ahouissoussi@thecreativemind.fr", 1),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.commits).toBe(65);
  });

  it("fusionne en chaîne via un maillon commun", () => {
    const groups = groupAuthors([
      a("alpha", "un@x.io", 5),
      a("beta", "un@x.io", 3),
      a("beta", "deux@x.io", 2),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.commits).toBe(10);
  });

  it("ne rapproche pas deux personnes distinctes", () => {
    const groups = groupAuthors([
      a("Hervé Zossou", "herve@thecreativemind.io", 189),
      a("Judicael", "judicael@thecreativemind.io", 78),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("classe les groupes du plus contributeur au moins", () => {
    const groups = groupAuthors([
      a("petit", "p@x.io", 2),
      a("gros", "g@x.io", 90),
      a("moyen", "m@x.io", 40),
    ]);

    expect(groups.map((g) => g.commits)).toEqual([90, 40, 2]);
  });
});

describe("matchesIdentity", () => {
  const config: IdentityConfig = {
    version: 1,
    emails: ["elodias@thecreativemind.io"],
    names: ["Elodias TCM"],
  };

  it("reconnaît par adresse", () => {
    expect(matchesIdentity(a("peu importe", "elodias@thecreativemind.io", 1), config)).toBe(true);
  });

  it("reconnaît par nom quand l'adresse est celle d'une machine", () => {
    // Cas réel : « Elodias TCM <elodiastcm@macbook-pro-de-elodias.local> ».
    // Sans l'appariement par nom, ces commits sont perdus.
    const author = a("Elodias TCM", "elodiastcm@macbook-pro-de-elodias.local", 2);
    expect(matchesIdentity(author, config)).toBe(true);
  });

  it("ignore la casse de l'adresse et du nom", () => {
    expect(matchesIdentity(a("ELODIAS TCM", "ELODIAS@thecreativemind.io", 1), config)).toBe(true);
  });

  it("rejette un tiers", () => {
    expect(matchesIdentity(a("Derrick", "derrick@thecreativemind.io", 566), config)).toBe(false);
  });
});
