import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.spec.ts"],
    pool: "forks",
    coverage: {
      provider: "v8",
      include: ["packages/**/src/**/*.ts"],
      exclude: ["**/*.spec.ts", "**/build/**"],
    },
  },
});
