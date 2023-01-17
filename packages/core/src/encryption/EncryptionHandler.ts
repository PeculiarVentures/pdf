import * as pkijs from "pkijs";
import { BufferSource } from "pvtsutils";
import { PDFStream, PDFTextString } from "../objects";
import type { PDFDocument } from "../structure";
import { EncryptDictionary } from "../structure/dictionaries/Encrypt";

export interface EncryptionHandlerCreateParams {
  document: PDFDocument;
  id?: string;
}

export abstract class EncryptionHandler {

  /**
   * Name of the encryption handler
   */
  public abstract name: string;

  public crypto: pkijs.ICryptoEngine;
  public dictionary: EncryptDictionary;

  constructor(dictionary: EncryptDictionary) {
    this.dictionary = dictionary;
    this.crypto = EncryptionHandler.getCrypto();
  }

  public abstract authenticate(): Promise<void>;

  public abstract encrypt(text: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer>;
  public abstract decrypt(text: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer>;

  public static getCrypto(): pkijs.ICryptoEngine {
    const crypto = pkijs.getCrypto();
    if (!crypto) {
      throw new Error("Unable to create WebCrypto object");
    }

    return crypto;
  }
}
