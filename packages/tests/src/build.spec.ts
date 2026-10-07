import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * Smoke tests for the published `build/` output (run `npm run build` first).
 *
 * The rest of the suite resolves `@peculiar/pdf-*` to `src` through tsconfig paths,
 * so it never executes the emitted JavaScript. Bundler options such as `unbundle`
 * change module evaluation order, which can break circular imports that the source
 * tolerates (e.g. decorators referencing a class that is not initialized yet).
 * Each entry is loaded in a fresh Node process, exactly as a consumer would load it.
 */

interface PackageJson {
  name: string;
  private?: boolean;
  main?: string;
  module?: string;
  bin?: Record<string, string>;
}

/** Export names of a module, plus the member names of `export * as ns` namespaces. */
type ExportShape = Record<string, string[] | null>;

const root = resolve(__dirname, "../../..");
const packagesDir = resolve(root, "packages");

const packages = readdirSync(packagesDir)
  .map((dir) => ({ dir: resolve(packagesDir, dir), json: resolve(packagesDir, dir, "package.json") }))
  .filter(({ json }) => existsSync(json))
  .map(({ dir, json }) => ({ dir, pkg: JSON.parse(readFileSync(json, "utf8")) as PackageJson }))
  .filter(({ pkg }) => !pkg.private);

const libraries = packages.filter(({ pkg }) => !pkg.bin);
const clis = packages.filter(({ pkg }) => pkg.bin);

const isBuilt = packages.every(({ dir }) => existsSync(resolve(dir, "build")));

const shapeOfSource = `
  function shapeOf(m) {
    const shape = {};
    for (const key of Object.keys(m).sort()) {
      if (key === "default" || key === "module.exports") continue;
      const value = m[key];
      shape[key] = value && typeof value === "object" && value[Symbol.toStringTag] === "Module"
        ? Object.keys(value).sort()
        : null;
    }
    return shape;
  }
`;

function shapeOf(m: Record<string, unknown>): ExportShape {
  const shape: ExportShape = {};
  for (const key of Object.keys(m).sort()) {
    if (key === "default" || key === "module.exports") continue;
    const value = m[key] as Record<PropertyKey, unknown> | undefined;
    shape[key] = value && typeof value === "object" && value[Symbol.toStringTag] === "Module" ? Object.keys(value).sort() : null;
  }
  return shape;
}

function runNode(script: string): string {
  return execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Loads a package by name through Node's CommonJS resolution (`main` / `exports`). */
function requireInNode(name: string): ExportShape {
  return JSON.parse(
    runNode(`
      import { createRequire } from "node:module";
      ${shapeOfSource}
      const m = createRequire(${JSON.stringify(`${root}/`)})(${JSON.stringify(name)});
      process.stdout.write(JSON.stringify(shapeOf(m)));
    `),
  );
}

/** Loads a file as ESM, as bundlers do through the `module` field. */
function importInNode(file: string): ExportShape {
  return JSON.parse(
    runNode(`
      ${shapeOfSource}
      const m = await import(${JSON.stringify(pathToFileURL(file).href)});
      process.stdout.write(JSON.stringify(shapeOf(m)));
    `),
  );
}

describe.skipIf(!isBuilt)("build output", () => {
  describe.each(libraries)("$pkg.name", ({ dir, pkg }) => {
    it("declares entry files that exist", () => {
      expect(pkg.main, "main").toBeDefined();
      expect(pkg.module, "module").toBeDefined();
      expect(existsSync(resolve(dir, pkg.main!)), pkg.main).toBe(true);
      expect(existsSync(resolve(dir, pkg.module!)), pkg.module).toBe(true);
    });

    it("loads as CommonJS with the same exports as the source", async () => {
      const source = shapeOf(await import(pkg.name));
      expect(requireInNode(pkg.name)).toEqual(source);
    });

    it("loads as ESM with the same exports as the source", async () => {
      const source = shapeOf(await import(pkg.name));
      expect(importInNode(resolve(dir, pkg.module!))).toEqual(source);
    });
  });

  describe.each(clis)("$pkg.name", ({ dir, pkg }) => {
    it.each(Object.entries(pkg.bin ?? {}))("runs the %s binary", (_, file) => {
      const bin = resolve(dir, file);
      expect(existsSync(bin), file).toBe(true);
      execFileSync(process.execPath, [bin, "--help"], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
    });
  });
});
