import { defineConfig } from "tsdown";

export default defineConfig({
  // Build all packages in the monorepo.
  workspace: {
    include: ["packages/*"],
    exclude: ["packages/tests"],
  },

  // Required in workspace mode: package configs without `entry` are skipped.
  entry: "src/index.ts",

  // Every package is built as both ESM and CommonJS.
  format: ["esm", "cjs"],

  // Generate TypeScript declaration files.
  dts: true,

  // Clean output directories before building.
  clean: true,

  // Don't bundle dependencies from package.json.
  deps: {
    neverBundle: true,
  },
  // Node always resolves the CommonJS build and bundlers the ESM build (via the
  // `module` condition). Mapping `import`/`require` to different files would let
  // one process load two copies of a package and break `instanceof` checks.
  exports: {
    customExports(exports) {
      return Object.fromEntries(
        Object.entries(exports).map(([key, value]) =>
          value && typeof value === "object" && "import" in value && "require" in value ? [key, { module: value.import, default: value.require }] : [key, value],
        ),
      );
    },
  },

  outDir: "build",
  tsconfig: "tsconfig.compile.json",
});
