import { CRL } from "./cms/CRL";
import type { OCSP } from "./cms/OCSP";

/**
 * Registry class is designed for internal usage to resolve circular dependencies.
 * Implements Singleton pattern to maintain a global registry of key-value pairs.
 * @internal
 */
export class Registry {
  private static instance: Registry;
  private items = new Map<string, unknown>();

  public static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  public register(key: string, value: unknown): void {
    this.items.set(key, value);
  }

  public get(key: "CRL"): typeof CRL;
  public get(key: "OCSP"): typeof OCSP;
  public get(key: string): unknown;
  public get(key: string): unknown {
    const item = this.items.get(key);
    if (!item) {
      throw new Error(`Item '${key}' is not registered in Registry`);
    }
    return item;
  }
}
