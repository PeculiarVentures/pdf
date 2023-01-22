import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";

const pkg = require("./package.json");

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
