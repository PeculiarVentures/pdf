import { BufferSource, BufferSourceConverter } from "pvtsutils";
import * as pkijs from "pkijs";

import { algorithms, staticData } from "./Constants";
import { EncryptionHandler, EncryptionHandlerCreateParams } from "./EncryptionHandler";
import { Password, StandardEncryptionAlgorithm } from "./StandardEncryptionAlgorithms";
import {
  CryptoFilterMethods, CryptoFilterDictionary, EncryptDictionary,
  StandardEncryptDictionary, TrailerDictionary, UserAccessPermissionFlags,
} from "../structure";
import { PDFTextString, PDFStream, PDFHexString, PDFArray } from "../objects";

const keyUsages: KeyUsage[] = ["encrypt", "decrypt"];

export interface Key {
  keyType: number;
  key: ArrayBuffer | null;
}

export interface StandardEncryptionHandlerCreateCommonParams {
  permission?: UserAccessPermissionFlags;
  ownerPassword?: Password;
  userPassword?: Password;
  disableString?: boolean;
  disableStream?: boolean;
  encryptMetadata?: boolean;
}

export interface StandardEncryptionHandlerCreateParamsV4 extends EncryptionHandlerCreateParams, StandardEncryptionHandlerCreateCommonParams {
  algorithm: CryptoFilterMethods.RC4 | CryptoFilterMethods.AES128;
}

export interface StandardEncryptionHandlerCreateParamsV6 extends EncryptionHandlerCreateParams, StandardEncryptionHandlerCreateCommonParams {
  algorithm: CryptoFilterMethods.AES256;
  /**
   * Encryption key
   */
  key?: CryptoKey;
}

export interface EncryptionKey {
  type: CryptoFilterMethods;
  raw: Uint8Array;
}

export interface EncryptionKeys {
  stream: EncryptionKey;
  string: EncryptionKey;
}

export enum PasswordReason {
  first,
  incorrect,
}

const STD_CF = "StdCF";

export type StandardEncryptionHandlerCreateParams = StandardEncryptionHandlerCreateParamsV4 | StandardEncryptionHandlerCreateParamsV6;

export class StandardEncryptionHandler extends EncryptionHandler {
  public static readonly NAME = "Standard";

  public static async create(params: StandardEncryptionHandlerCreateParams): Promise<StandardEncryptionHandler> {
    const doc = params.document;
    const crypto = params.crypto || pkijs.getCrypto(true);

    // params
    const userPassword = params.userPassword || "";
    const ownerPassword = params.ownerPassword || crypto.getRandomValues(new Uint8Array(16));
    const permissions = params.permission || 0;

    // create Encrypt dictionary
    const encrypt = StandardEncryptDictionary.create(doc).makeIndirect(false);

    // create StdCF Crypto Filter
    if (!params.disableStream || !params.disableString) {
      const filter = CryptoFilterDictionary.create(doc);
      filter.CFM = params.algorithm;
      filter.AuthEvent = "DocOpen";
      encrypt.CF.get().set(STD_CF, filter);
    }

    // fill Encrypt dictionary
    encrypt.Filter = "Standard";
    encrypt.P = new Int32Array([0xfffff000 | permissions])[0];
    encrypt.StmF = params.disableStream ? "Identity" : STD_CF;
    encrypt.StrF = params.disableString ? "Identity" : STD_CF;
    if (params.encryptMetadata !== undefined) {
      encrypt.EncryptMetadata = params.encryptMetadata;
    }

    switch (params.algorithm) {
      case CryptoFilterMethods.AES128:
        encrypt.R = 4;
        encrypt.Length = 128;
        encrypt.V = 4; // CF, StmF, and StrF
        break;
      case CryptoFilterMethods.AES256:
        encrypt.R = 6;
        encrypt.Length = 256;
        encrypt.V = 5; // CF, StmF, and StrF
        break;
      default:
        throw new Error("Unknown crypto method.");
    }

    // initialize Standard handler
    const handler = new StandardEncryptionHandler(encrypt, crypto);
    handler.crypto = crypto;

    // cache passwords
    handler.#userPassword = userPassword;
    handler.#ownerPassword = ownerPassword;

    // get xref for ID getting
    if (!doc.update.xref) {
      throw new Error("Cannot set ID for the PDF document handler. The XRef object is empty.");
    }
    const xref = doc.update.xref as unknown as TrailerDictionary;

    // If PDF has encryption it shall have the ID filed in XRef object
    let id = crypto.getRandomValues(new Uint8Array(16));
    if (!xref.has("ID")) {
      // Create ID object
      xref.set("ID", doc.createArray(
        doc.createHexString(id),
        doc.createHexString(crypto.getRandomValues(new Uint8Array(16))),
      ));
    } else {
      id = xref.get("ID", PDFArray).get(0, PDFHexString).toUint8Array();
    }

    switch (params.algorithm) {
      case CryptoFilterMethods.AES128: {
        // compute O values and set them into the Encrypt dictionary
        const o = await StandardEncryptionAlgorithm.algorithm3({
          crypto,
          length: encrypt.Length,
          revision: encrypt.R,
          user: userPassword,
          owner: ownerPassword,
        });
        encrypt.set("O", doc.createHexString(o));

        // compute U values and set them into the Encrypt dictionary
        const u = await StandardEncryptionAlgorithm.algorithm5({
          id,
          crypto,
          o,
          encryptMetadata: encrypt.EncryptMetadata,
          length: encrypt.Length,
          password: userPassword,
          permissions: encrypt.P,
          revision: encrypt.R,
        });
        encrypt.set("U", doc.createHexString(u));
        break;
      }
      case CryptoFilterMethods.AES256: {
        const encryptionKey = crypto.getRandomValues(new Uint8Array(32));

        const { u, ue } = await StandardEncryptionAlgorithm.algorithm8({
          password: userPassword,
          key: encryptionKey,
          crypto,
        });
        encrypt.set("U", doc.createHexString(u));
        encrypt.set("UE", doc.createHexString(ue));

        const { o, oe } = await StandardEncryptionAlgorithm.algorithm9({
          u,
          password: ownerPassword,
          key: encryptionKey,
          crypto,
        });
        encrypt.set("O", doc.createHexString(o));
        encrypt.set("OE", doc.createHexString(oe));

        const perms = await StandardEncryptionAlgorithm.algorithm10({
          permissions: encrypt.P,
          key: encryptionKey,
          encryptMetadata: encrypt.EncryptMetadata,
          crypto,
        });
        encrypt.set("Perms", doc.createHexString(perms));

        break;
      }
      default:
        throw new Error("Unknown crypto method.");
    }

    doc.update.xref!.Encrypt = encrypt;

    return handler;
  }

  public name = StandardEncryptionHandler.NAME;

  /**
   * cached user password
   */
  #userPassword?: Password;
  /**
   * cached owner password
   */
  #ownerPassword?: Password;
  /**
   * cached file encryption keys
   */
  #keys?: EncryptionKeys;

  /**
   * Handler which is used if User password is required
   */
  public onUserPassword?: (reason: number) => Promise<Password>;

  /**
   * PDF Standard Encrypt dictionary 
   */
  public override dictionary!: StandardEncryptDictionary;

  /**
   * Gets the revision number
   */
  public get revision(): number {
    return this.dictionary.R;
  }

  /**
   * Gets the encryption key length
   */
  public get length(): number {
    return this.dictionary.Length;
  }

  /**
   * Gets ID from the Trailer dictionary
   */
  public get id(): ArrayBuffer {
    const id = this.dictionary.documentUpdate?.id;
    if (!id || id.length === 0) {
      throw new Error("No ID element in document trailer");
    }

    return id[0].toArrayBuffer();
  }

  public async checkUserPassword(password: Password = ""): Promise<boolean> {
    const dict = this.dictionary;

    switch (this.revision) {
      case 2:
      case 3:
      case 4:
        return StandardEncryptionAlgorithm.algorithm6({
          crypto: this.crypto,
          password,
          length: dict.Length,
          o: dict.O.toUint8Array(),
          u: dict.U.toUint8Array(),
          id: this.id,
          revision: dict.R,
          permissions: dict.P,
          encryptMetadata: dict.EncryptMetadata,
        });
      case 6:
        return StandardEncryptionAlgorithm.algorithm11({
          crypto: this.crypto,
          password,
          u: dict.U.toUint8Array()
        });
      default:
        throw new Error("Cannot check the Owner password, unknown revision");
    }
  }

  public async checkOwnerPassword(password: Password = ""): Promise<boolean> {
    const dict = this.dictionary;

    switch (this.revision) {
      case 2:
      case 3:
      case 4:
        return StandardEncryptionAlgorithm.algorithm7({
          crypto: this.crypto,
          revision: this.revision,
          user: await this.#getUserPassword(),
          owner: password,
          length: dict.Length,
          o: dict.O.toUint8Array(),
        });
      case 6:
        return StandardEncryptionAlgorithm.algorithm12({
          crypto: this.crypto,
          password,
          o: dict.O.toUint8Array(),
          u: dict.U.toUint8Array()
        });
      default:
        throw new Error("Cannot check the Owner password, unknown revision");
    }
  }

  /**
   * Returns the User cached password. 
   * 
   * If cache is empty it requests the User password using {@link onUserPassword} handler.
   * @returns Password
   */
  async #getUserPassword(): Promise<Password> {
    if (this.#userPassword) {
      // return cached password value
      return this.#userPassword;
    }

    // try default password
    if (await this.checkUserPassword()) {
      this.#userPassword = "";
    } else if (this.onUserPassword) {
      // if callback is set do while get correct password or Error
      let reason = PasswordReason.first;

      while (true) {
        const password = await this.onUserPassword(reason);
        if (await this.checkUserPassword(password)) {
          this.#userPassword = password;

          break;
        }

        reason = PasswordReason.incorrect;
      }
    } else {
      this.#userPassword = "";
    }

    return this.#userPassword;
  }

  /**
   * Returns the Owner cached password.
   * 
   * If cache is empty, throws an error.
   * @returns Password
   */
  #getOwnerPassword(): Password {
    if (!this.#ownerPassword) {
      throw new Error("Cannot get the Owner password. It is not set.");
    }

    return this.#ownerPassword;
  }

  /**
   * Returns encryption file key for specified Crypto Filter Name (eg CFStd)
   * @param password Password
   * @param filterName Filter name
   * @returns Encryption key
   */
  protected async getKeyF(password: Password, filterName: string): Promise<EncryptionKey> {
    if (filterName === EncryptDictionary.IDENTITY) {
      return {
        type: CryptoFilterMethods.None,
        raw: new Uint8Array,
      };
    }

    // get specified crypto filter
    const filter = this.dictionary.CF.get(true).getItem(filterName);

    // Use parameters from the crypto filter if it's needed
    let length = filter.Length || this.length;
    switch (filter.Type) {
      // When CFM is AESV2, the Length key shall be ignored and a value of 128 bits used.
      case CryptoFilterMethods.AES128:
        length = 128;
        break;
      // When CFM is AESV3, the Length key shall be ignored and a value of 256 bits used.
      case CryptoFilterMethods.AES256:
        length = 256;
        break;
    }

    // compute the encryption file
    let encKey: ArrayBuffer;
    if (this.revision === 6) {
      if (!(this.dictionary.UE && this.dictionary.OE && this.dictionary.Perms)) {
        throw new Error("Cannot get required filed from Standard Encrypt dictionary for Revision 6");
      }
      encKey = await StandardEncryptionAlgorithm.algorithm2A({
        password,
        u: this.dictionary.U.toUint8Array(),
        ue: this.dictionary.UE.toUint8Array(),
        o: this.dictionary.O.toUint8Array(),
        oe: this.dictionary.OE.toUint8Array(),
        p: this.dictionary.P,
        perms: this.dictionary.Perms.toUint8Array(),
        crypto: this.crypto,
      });
    } else {
      encKey = await StandardEncryptionAlgorithm.algorithm2({
        id: this.id,
        password,
        revision: this.dictionary.R,
        encryptMetadata: this.dictionary.EncryptMetadata,
        permissions: this.dictionary.P,
        o: this.dictionary.O.toUint8Array(),
        length,
        crypto: this.crypto,
      });
    }

    return {
      type: filter.CFM as CryptoFilterMethods,
      raw: BufferSourceConverter.toUint8Array(encKey),
    };
  }

  /**
   * Gets cached or computes encryption keys using the user password
   * @returns Encryption keys
   */
  async #getKeys(): Promise<EncryptionKeys> {
    if (this.#keys) {
      return this.#keys;
    }

    const password = await this.#getUserPassword();

    if (this.dictionary.V >= 4) {
      if (this.dictionary.StmF === this.dictionary.StrF) {
        const key = await this.getKeyF(password, this.dictionary.StmF);

        this.#keys = {
          stream: key,
          string: key,
        };
      } else {
        const keys = await Promise.all([
          this.getKeyF(password, this.dictionary.StmF),
          this.getKeyF(password, this.dictionary.StrF),
        ]);

        this.#keys = {
          stream: keys[0],
          string: keys[1],
        };
      }
    } else {
      throw new Error("Crypto mechanisms with V less than 4 are not supported.");
    }

    return this.#keys;
  }

  private async getCutHashV2(combinedKey: BufferSource, stmKeyByteLength: number): Promise<ArrayBuffer> {
    const md = await this.crypto.digest(algorithms.md5, combinedKey);
    const initialKeyLength = stmKeyByteLength + 5;

    return md.slice(0, ((initialKeyLength > 16) ? 16 : initialKeyLength));
  }

  /**
   * Encrypts/decrypts incoming data.
   * @param encrypt If `true`, runs encryption, otherwise decryption.
   * @param data Incoming data.
   * @param target Target object. The cipher shall use different keys for Streams and Text encryption.
   * @returns 
   */
  protected async cipher(encrypt: boolean, data: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer> {
    const view = BufferSourceConverter.toUint8Array(data);

    // Get crypto key for the target object
    const keys = await this.#getKeys();
    const key = (target instanceof PDFStream)
      ? keys.stream // use StmF key for Stream
      : keys.string; // use StrF key for Literal and Hexadecimal strings

    if (key.type === CryptoFilterMethods.None) {
      return view;
    }

    let cipherData: Uint8Array;
    let iv: Uint8Array;
    if (encrypt) {
      iv = this.crypto.getRandomValues(new Uint8Array(16));
      cipherData = view;
    } else {
      iv = view.slice(0, 16);
      cipherData = view.slice(16, view.byteLength);
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

    switch (key.type) {
      case CryptoFilterMethods.AES128: {
        const cutHash = await this.getCutHashV2(BufferSourceConverter.concat(combinedKey, staticData), key.raw.length);
        const cryptoKey = await this.crypto.importKey("raw", cutHash, algorithms.AesCBC, false, keyUsages);
        const alg = { name: "AES-CBC", iv };

        if (encrypt) {
          return BufferSourceConverter.concat([
            iv,
            await this.crypto.encrypt(alg, cryptoKey, cipherData),
          ]);
        }

        return await this.crypto.decrypt(alg, cryptoKey, cipherData);
      }
      case CryptoFilterMethods.AES256: {
        const cryptoKey = await this.crypto.importKey("raw", key.raw, algorithms.AesCBC, false, keyUsages);
        const alg = { name: "AES-CBC", iv };

        if (encrypt) {
          return BufferSourceConverter.concat([
            iv,
            await this.crypto.encrypt(alg, cryptoKey, cipherData),
          ]);
        }

        return await this.crypto.decrypt(alg, cryptoKey, cipherData);
      }
      case CryptoFilterMethods.RC4:
      default: {
        const cryptoKey = await this.getCutHashV2(combinedKey, key.raw.byteLength) as any;

        if (encrypt) {
          return await this.crypto.encrypt(algorithms.rc4, cryptoKey, cipherData);
        }

        return await this.crypto.decrypt(algorithms.rc4, cryptoKey, cipherData);
      }
    }
  }

  public async authenticate(): Promise<void> {
    await this.#getKeys();
  }

  public async decrypt(stream: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer> {
    return this.cipher(false, stream, target);
  }

  public async encrypt(stream: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer> {
    return this.cipher(true, stream, target);
  }

}
