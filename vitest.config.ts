import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
