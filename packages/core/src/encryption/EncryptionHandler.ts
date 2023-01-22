import * as pkijs from "pkijs";
import { BufferSource } from "pvtsutils";
import { PDFStream, PDFTextString } from "../objects";
import { type PDFDocument, EncryptDictionary } from "../structure";

export interface EncryptionHandlerCreateParams {
  document: PDFDocument;
  id?: string;
  crypto?: pkijs.ICryptoEngine;
}

export abstract class EncryptionHandler {

  /**
   * Name of the encryption handler
   */
  public abstract name: string;

  public crypto: pkijs.ICryptoEngine;
  public dictionary: EncryptDictionary;

  constructor(dictionary: EncryptDictionary, crypto: pkijs.ICryptoEngine) {
    this.dictionary = dictionary;
    this.crypto = crypto;
  }

  /**
   * Authenticates user
   */
  public abstract authenticate(): Promise<void>;

  /**
   * Encrypts incoming data 
   * @param data Data that should be encrypted
   * @param target Target object which includes that data
   * @returns Returns encrypted message
   */
  public abstract encrypt(data: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer>;
  /**
   * Decrypts incoming data 
   * @param data Data that should be decrypted
   * @param target Target object which includes that data
   * @returns Returns decrypted message
   */
  public abstract decrypt(data: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer>;

}
