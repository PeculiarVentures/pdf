import { EncryptDictionary } from "../structure/dictionaries/Encrypt";
import { EncryptionHandler } from "./EncryptionHandler";
import { PublicKeyEncryptionHandler } from "./PublicKeyEncryptionHandler";
import { StandardEncryptionHandler } from "./StandardEncryptionHandler";

export interface EncryptionHandlerConstructor {
  new(dictionary: EncryptDictionary): EncryptionHandler;
  NAME: string;
}

export class EncryptionFactory {
  public static handlers = new Map<string, EncryptionHandlerConstructor>([
    [StandardEncryptionHandler.NAME, StandardEncryptionHandler],
  ]);

  public static register(handler: EncryptionHandlerConstructor): void {
    this.handlers.set(handler.NAME, handler);
  }

  /**
   * 
   * @param type 
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
