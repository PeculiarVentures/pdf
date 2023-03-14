import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import pkg from "./package.json" assert { type: "json" };

const banner = [
  "#!/usr/bin/env node"
].join("\n");
const input = "src/index.ts";

export default [
  {
    input,
    plugins: [
      resolve({
        mainFields: ["esnext", "module", "main"],
        preferBuiltins: true,
      }),
      commonjs(),
      typescript({
        check: true,
        clean: true,
        tsconfigOverride: {
          compilerOptions: {
            module: "es2015",
            removeComments: true
          }
        }
      }),
    ],
    external: Object.keys(pkg.dependencies),
    output: [
      {
        banner,
        file: pkg.main,
        format: "cjs",
      }
    ]
  },
];
