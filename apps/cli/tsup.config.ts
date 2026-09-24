import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
  // La version est injectée à la construction : une constante écrite à la main
  // finit toujours par mentir sur ce qui est publié.
  define: { __VERSION__: JSON.stringify(version) },
});
