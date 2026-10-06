import { defineConfig } from "tsdown";

export default defineConfig({
  format: "cjs",
  dts: false,
  banner: "#!/usr/bin/env node",
  exports: false,
  attw: false,
});
