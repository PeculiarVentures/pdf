import * as pkijs from "pkijs";
import { BufferSource } from "pvtsutils";
import { IPDFIndirect } from "../objects";
import { EncryptDictionary } from "../structure/dictionaries/Encrypt";

export abstract class EncryptionHandler {
  public abstract name: string;

  public crypto: SubtleCrypto;
  public dictionary: EncryptDictionary;

  constructor(dictionary: EncryptDictionary) {
    this.dictionary = dictionary;
    this.crypto = EncryptionHandler.getCrypto();
  }

  public abstract encrypt(text: BufferSource, parent: IPDFIndirect): Promise<ArrayBuffer>;
  public abstract decrypt(text: BufferSource, parent: IPDFIndirect): Promise<ArrayBuffer>;

  public static getCrypto(): SubtleCrypto {
    const crypto = pkijs.getCrypto();
    if (!crypto) {
      throw new Error("Unable to create WebCrypto object");
    }

    return crypto;
  }
}
