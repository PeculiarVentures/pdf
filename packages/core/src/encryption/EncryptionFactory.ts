import { ICryptoEngine } from "pkijs";
import { EncryptDictionary } from "../structure";
import { EncryptionHandler } from "./EncryptionHandler";
import { PublicKeyEncryptionHandler } from "./PublicKeyEncryptionHandler";
import { StandardEncryptionHandler } from "./StandardEncryptionHandler";

export interface EncryptionHandlerConstructor {
  new(dictionary: EncryptDictionary, crypot: ICryptoEngine): EncryptionHandler;
  NAME: string;
}


/**
 * Represents the global registry for encryption handlers. PDF document uses it for encryption handler getting
 */
export class EncryptionFactory {
  public static handlers = new Map<string, EncryptionHandlerConstructor>([
    [StandardEncryptionHandler.NAME, StandardEncryptionHandler],
  ]);

  /**
   * Registers encryption handler in the registry
   * 
   * If handler with the same name already exists, then replaces it
   * @param handler Constructor of the encryption handler
   */
  public static register(handler: EncryptionHandlerConstructor): void {
    this.handlers.set(handler.NAME, handler);
  }

  /**
   * Returns constructor of EncryptionHandler for specified type. If handler doesn't exists returns PublicKeyEncryptionHandler
   * @param type Textual name of the encryption handler
   * @returns 
   */
  public static get(type: string): EncryptionHandlerConstructor {
    const handler = this.handlers.get(type);
    if (!handler) {
      return PublicKeyEncryptionHandler;
    }

    return handler;
  }
}
