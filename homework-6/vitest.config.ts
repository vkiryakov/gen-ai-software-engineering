import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: ["pipeline/**/*.ts", "mcp/queries.ts", "orchestrator.ts"],
      exclude: ["**/*.test.ts", "frontend/**"],
    },
  },
});
