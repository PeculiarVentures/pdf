import { defineConfig } from "tsdown";

export default defineConfig({
  // Builds every packages/* package with the options below; paths resolve from each package directory.
  workspace: {
    include: ["packages/*"],
    // Private test helpers; never built or published.
    exclude: ["packages/tests"],
  },
  entry: {
    index: "src/index.ts",
  },
  // ESM only. CommonJS consumers load it through require(esm) on Node ^20.19 / >=22.12.
  format: ["esm"],
  platform: "neutral",
  dts: true,
  clean: true,
  // One bundled build/index.js per package (as in x509 3): core and doc have
  // import cycles that decorators and module-level registrations only survive
  // in bundled evaluation order (see packages/tests/src/build.spec.ts).
  unbundle: false,
  // Keep .js/.d.ts output names (package.json is "type": "module")
  // instead of fixed .mjs/.d.mts extensions.
  fixedExtension: false,
  deps: {
    neverBundle: true,
  },
  exports: {
    legacy: true,
    // pdf-cli declares its `pvpdf` command itself; auto-detection would name it after the package.
    bin: false,
  },
  outputOptions: {
    // Drop TSDoc from the JS output; docs ship in the .d.ts files. Keep
    // @__PURE__ annotations so bundlers can tree-shake.
    comments: { legal: true, annotation: true, jsdoc: false },
  },
  outDir: "build",
  // The root tsconfig: its paths resolve @peculiar/pdf-* imports to the sibling sources.
  tsconfig: "../../tsconfig.json",
  attw: {
    level: "error",
    profile: "esm-only",
  },
});
