import { defineConfig } from "vitest/config";

// Tests du site statique. Le CLI a sa propre configuration dans apps/cli.
export default defineConfig({
  test: { include: ["site/**/*.test.mjs"], environment: "node" },
});
