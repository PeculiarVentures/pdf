import { defineConfig } from "tsdown";

export default defineConfig({
  workspace: {
    include: ["packages/*"],
    exclude: ["packages/tests"],
  },
  entry: "src/index.ts",
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
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
