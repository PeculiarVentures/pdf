import { ICryptoEngine } from "pkijs";
import { BufferSourceConverter } from "pvtsutils";
import { PDFStream, PDFTextString } from "../objects";
import { CryptoFilterMethods } from "../structure/dictionaries";
import { staticData } from "./Constants";

export interface EncryptionKey {
  type: CryptoFilterMethods;
  raw: Uint8Array;
}

export interface EncryptionKeys {
  stream: EncryptionKey;
  string: EncryptionKey;
}

export interface EncryptionAlgorithmsParams {
  /**
   * Encryption key
   */
  key: EncryptionKey;
  /**
   * Incoming data.
   */
  data: BufferSource;
  /**
   * Target object.
   */
  target: PDFStream | PDFTextString;
  crypto: ICryptoEngine;
}

interface EncryptionAlgorithmsCipherParams extends EncryptionAlgorithmsParams {
  /**
   * Determines if data should be encrypted or decrypted. If `true`, runs encryption, otherwise decryption.
   */
  encrypt: boolean;
}

const keyUsages: KeyUsage[] = ["encrypt", "decrypt"];

export abstract class EncryptionAlgorithms {

  private static async getCutHashV2(combinedKey: BufferSource, stmKeyByteLength: number, crypto: ICryptoEngine): Promise<ArrayBuffer> {
    const md = await crypto.digest("MD5", combinedKey);
    const initialKeyLength = stmKeyByteLength + 5;

    return md.slice(0, ((initialKeyLength > 16) ? 16 : initialKeyLength));
  }

  /**
   * Encrypts/decrypts incoming data.
   * @param params Parameters
   * @returns
   */
  private static async cipher(params: EncryptionAlgorithmsCipherParams): Promise<ArrayBuffer> {
    const { crypto, encrypt, key, target, data } = params;
    const view = BufferSourceConverter.toUint8Array(data);

    if (key.type === CryptoFilterMethods.None) {
      return view;
    }

    let cipherData: Uint8Array;
    let iv: Uint8Array;
    if (encrypt) {
      iv = crypto.getRandomValues(new Uint8Array(16));
      cipherData = view;
    } else if (key.type !== CryptoFilterMethods.RC4) {
      iv = view.slice(0, 16);
      cipherData = view.slice(16, view.byteLength);
    } else {
      iv = new Uint8Array();
      cipherData = view;
    }

    // Create combined key
    const parent = target.getIndirect(true);
    const id = new Int32Array([parent.id]);
    const generation = new Int32Array([parent.generation]);
    const combinedKey = BufferSourceConverter.concat([
      key.raw,
      id.buffer.slice(0, 3),
      generation.buffer.slice(0, 2)
    ]);

    const alg = { name: "AES-CBC", iv };
    switch (key.type) {
      case CryptoFilterMethods.AES128: {
        const cutHash = await this.getCutHashV2(BufferSourceConverter.concat(combinedKey, staticData), key.raw.length, crypto);
        const cryptoKey = await crypto.importKey("raw", cutHash, alg.name, false, keyUsages);

        if (encrypt) {
          return BufferSourceConverter.concat([
            iv,
            await crypto.encrypt(alg, cryptoKey, cipherData),
          ]);
        }

        return await crypto.decrypt(alg, cryptoKey, cipherData);
      }
      case CryptoFilterMethods.AES256: {
        const cryptoKey = await crypto.importKey("raw", key.raw, alg.name, false, keyUsages);

        if (encrypt) {
          return BufferSourceConverter.concat([
            iv,
            await crypto.encrypt(alg, cryptoKey, cipherData),
          ]);
        }

        return await crypto.decrypt(alg, cryptoKey, cipherData);
      }
      case CryptoFilterMethods.RC4:
      default: {
        const cutHash = await this.getCutHashV2(combinedKey, key.raw.length, crypto);
        const cryptoKey = cutHash as unknown as CryptoKey;

        if (encrypt) {
          return await crypto.encrypt("RC4", cryptoKey, cipherData);
        }

        return await crypto.decrypt("RC4", cryptoKey, cipherData);
      }
    }
  }

  public static async encrypt(params: EncryptionAlgorithmsParams): Promise<ArrayBuffer> {
    return this.cipher({
      encrypt: true,
      ...params,
    });
  }

  public static async decrypt(params: EncryptionAlgorithmsParams): Promise<ArrayBuffer> {
    return this.cipher({
      encrypt: false,
      ...params,
    });
  }

}
