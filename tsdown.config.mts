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
  exports: {
    all: false,
    legacy: true,
  },
  outDir: "build",
  tsconfig: "tsconfig.compile.json",
});
