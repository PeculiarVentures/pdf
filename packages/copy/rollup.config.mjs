import path from "node:path";
import url from "node:url";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import pkg from "./package.json" assert { type: "json" };
import { ScriptTarget } from "typescript";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const banner = [].join("\n");
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
      },
      {
        banner,
        file: pkg.module,
        format: "es",
      },
    ]
  },
  {
    input,
    external: Object.keys(pkg.dependencies),
    plugins: [
      dts({
        tsconfig: path.resolve(__dirname, "./tsconfig.compile.json"),
        compilerOptions: {
          target: ScriptTarget.ES2022,
          removeComments: false,
        }
      })
    ],
    output: [
      {
        banner,
        file: pkg.types,
      }
    ]
  },
];
