import { defineConfig } from "tsdown";

export default defineConfig({
  format: "cjs",
  // `bin` points at build/index.cjs; keep the .cjs extension the root config turns off.
  fixedExtension: true,
  dts: false,
  banner: "#!/usr/bin/env node",
  exports: false,
  attw: false,
});
