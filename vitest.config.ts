import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve @peculiar/pdf-* imports to the package sources through the tsconfig paths.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["packages/**/*.spec.ts"],
    pool: "forks",
    coverage: {
      reporter: ["text", "lcov", "text-summary"],
      provider: "v8",
      include: ["packages/**/src/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/build/**"],
    },
  },
});
