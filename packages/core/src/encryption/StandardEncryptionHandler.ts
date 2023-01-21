import { BufferSourceConverter, Convert } from "pvtsutils";
import { BufferSource } from "pvtsutils";
import { utilConcatBuf } from "pvutils";
import { CryptoFilterMethods, CryptoFilterDictionary } from "../structure/dictionaries/CryptoFilter";
import { StandardEncryptDictionary, UserAccessPermissionFlags } from "../structure/dictionaries/StandardEncrypt";
import * as pkijs from "pkijs";

import { algorithms, globalParametersCryptFilter as GlobalParametersCryptFilter, staticData, staticDataFF } from "./Constants";
import { EncryptionHandler, EncryptionHandlerCreateParams } from "./EncryptionHandler";
import { StandardEncryptionAlgorithm } from "./StandardEncryptionAlgorithms";
import { EncryptDictionary, TrailerDictionary } from "../structure";
import { PDFTextString, PDFStream } from "../objects";

const passwordPadding = new Uint8Array([0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08, 0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68,
  0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A]);

const keyUsages: KeyUsage[] = ["encrypt", "decrypt"];

export interface Key {
  keyType: number;
  key: ArrayBuffer | null;
}

interface MakeGlobalCryptoParams {
  dictionary: StandardEncryptDictionary;
  id: ArrayBuffer;
  keyType: string;
  key: ArrayBuffer;
}

export type Password = string | BufferSource;

/**
 * Converts the Password into the Uint8Array
 * @param password Password
 * @returns 
 */
function passwordToView(password: Password): Uint8Array {
  if (typeof password === "string") {
    return new Uint8Array(Convert.FromUtf8String(password));
  }

  return BufferSourceConverter.toUint8Array(password);
}

interface UserValues {
  /**
   * Revision
   */
  r: number;
  /**
   * A 32-byte string, based on the user password
   */
  u: ArrayBuffer;
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
    const crypto = pkijs.getCrypto(true);

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
    const handler = new StandardEncryptionHandler(encrypt);
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
    if (!xref.has("ID")) {
      // Create ID object
      xref.set("ID", doc.createArray(
        doc.createHexString(crypto.getRandomValues(new Uint8Array(16))),
        doc.createHexString(crypto.getRandomValues(new Uint8Array(16))),
      ));
    }

    switch (params.algorithm) {
      case CryptoFilterMethods.AES128: {
        // compute O values and set them into the Encrypt dictionary
        const o = await handler.computeOwnerValues(ownerPassword, userPassword);
        encrypt.set("O", doc.createHexString(o));

        // compute U values and set them into the Encrypt dictionary
        const uVal = await handler.computeUserValues(userPassword);
        encrypt.set("U", doc.createHexString(uVal.u));
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

  /**
   * Pads the password the password using predefined PDF padding string
   * @param password Password
   * @returns 32-bytes buffer 
   */
  public static padPassword(password: Password = new Uint8Array(0)): ArrayBuffer {
    // That is, if the password string is n bytes long, append the first 32 - n bytes of the padding string to
    // the end of the password string. If the password string is empty (zero-length), meaning there is no
    // user password, substitute the entire padding string in its place.

    const passwordView = passwordToView(password).subarray(0, 32);
    if (passwordView.length === 32) {
      return passwordView;
    }

    const result = new Uint8Array(32);
    // copy password into the 32-bytes buffer
    result.set(passwordView);
    if (passwordView.length < result.length) {
      // copy padding string after the copied password
      result.set(passwordPadding.subarray(0, 32 - passwordView.length), passwordView.length);
    }

    return result;
  }

  public async checkUserPassword(password: Password = ""): Promise<boolean> {
    if (this.revision === 6) {
      return StandardEncryptionAlgorithm.algorithm11({
        password,
        u: this.dictionary.U.toUint8Array(),
        crypto: this.crypto,
      });
    } else if (this.revision === 3 || this.revision === 4) {
      const values = await this.computeUserValues(password);

      return BufferSourceConverter.isEqual(
        BufferSourceConverter.toUint8Array(values.u).subarray(0, 16), // encryption key is first 16 bytes
        this.dictionary.U.toUint8Array().subarray(0, 16),
      );
    }

    throw new Error("Cannot check user password, unsupported revision");
  }

  public async checkOwnerPassword(owner: Password = ""): Promise<boolean> {
    const values = await this.computeOwnerValues(owner);

    return BufferSourceConverter.isEqual(values, this.dictionary.O.toArrayBuffer());
  }

  protected async computeUserValues(password: Password): Promise<UserValues> {
    switch (this.revision) {
      case 2:
      case 3:
      case 4:
        {
          // Compute "U" value
          if (this.revision < 3) {
            throw new Error("Not implemented");
            // return {
            //   r: this.revision,
            //   u: await StandardEncryptionAlgorithm.algorithm4(this.dictionary.O.toArrayBuffer(), this.id, this.dictionary.P, this.revision, this.dictionary.Length, this.dictionary.EncryptMetadata, passwordView),
            // };
          } else {
            const encryptionKey = await StandardEncryptionAlgorithm.algorithm2({
              id: this.id,
              password,
              revision: this.dictionary.R,
              encryptMetadata: this.dictionary.EncryptMetadata,
              permissions: this.dictionary.P,
              ownerValue: this.dictionary.O.toUint8Array(),
              length: this.length,
              crypto: this.crypto,
            });

            return {
              r: this.revision,
              u: await StandardEncryptionAlgorithm.algorithm5({
                revision: this.revision,
                encryptionKey,
                id: this.id,
                crypto: this.crypto,
              }),
            };
          }
        }
        break;
      case 6:
        {
          throw new Error("Not implemented");
          // // Compute "U" and "UE" values
          // const [uValue, ueValue] = await this.algorithm8(key, userPasswordBuffer);
          // //#endregion

          // // Compute "O" and "OE" values
          // const [oValue, oeValue] = await this.algorithm9(uValue, key, ownerPasswordBuffer);

          // // Compute "Perms" value
          // const permsValue = await this.algorithm10(pValueBuffer, key, encryptMetadata);
        }
        break;
      default:
        throw `Incorrect revision number: ${this.revision}`;
    }
  }

  public async computeOwnerValues(owner: Password, user?: Password): Promise<ArrayBuffer> {
    if (user === undefined) {
      user = await this.#getUserPassword();
    }

    switch (this.revision) {
      case 2:
      case 3:
      case 4:
        {
          // Compute "O" value
          return await StandardEncryptionAlgorithm.algorithm3({
            length: this.length,
            owner: owner,
            revision: this.revision,
            user,
            crypto: this.crypto,
          });

        }
        break;
      case 6:
        {
          throw new Error("Not implemented");
        }
      default:
        throw `Incorrect revision number: ${this.revision}`;
    }
  }

  #userPassword?: Password;
  #ownerPassword?: Password;

  onUserPassword?: (reason: number) => Promise<Password>;

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

  #getOwnerPassword(): Password {
    if (!this.#ownerPassword) {
      throw new Error("Cannot get the Owner password. It is not set.");
    }

    return this.#ownerPassword;
  }

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
        ownerValue: this.dictionary.O.toUint8Array(),
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
   * Encryption keys
   */
  #keys?: EncryptionKeys;

  /**
   * Gets cached or computes encryption keys using the user password
   * @returns 
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

  /**
   * Generate cryptographic key for password-based encryption
   * @param hashedOwnerPassword Hashed owner password ("O" entry from crypto dictionary)
   * @param fileIdentifier PDF file identifier (first element of "ID" array from PDF trailer)
   * @param pEntry Used flags ("P" entry from crypto dictionary)
   * @param revision The used revision ("R" element from crypto dictionary)
   * @param keyLength Key length (in bits) as how its stated in crypto dictionary ("Length" element of crypto dictionary)
   * @param metadataEncrypted Was PDF metadata encrypted or not ("EncryptMetadata" element of crypto dictionary)
   * @param password Used password
   */
  public async generateKeyPasswordBased(hashedOwnerPassword: BufferSource, fileIdentifier: BufferSource, pEntry: number, revision: number, keyLength = 40, metadataEncrypted = false, password?: ArrayBuffer): Promise<ArrayBuffer> {
    const pEntryArrayBuffer = new Uint32Array([pEntry]);

    const passwordBuffer = StandardEncryptionHandler.padPassword(password);

    // Combine all necessary values and make the first hash
    let combinedBuffer = BufferSourceConverter.concat(
      passwordBuffer,
      hashedOwnerPassword,
      pEntryArrayBuffer,
      fileIdentifier);

    if (revision > 3 && !metadataEncrypted) {
      combinedBuffer = BufferSourceConverter.concat(combinedBuffer, staticDataFF);
    }

    let digestResult = await this.crypto.digest(algorithms.md5, combinedBuffer);

    // Make additional hashing if needed
    if (revision >= 3) {
      for (let i = 0; i < 50; i++) {
        digestResult = await this.crypto.digest(algorithms.md5, digestResult);
      }
    }

    return digestResult.slice(0, keyLength >> 3);
  }

  /**
   * Computing a file encryption key in order to encrypt a document (revision 4 and earlier)
   * @param password Password
   * @returns Encryption key
   */
  protected async algorithm2(password: Password): Promise<Uint8Array> {
    // a) Prepare password
    const passwordPadded = StandardEncryptionHandler.padPassword(password);

    const hashData = BufferSourceConverter.concat(
      // b) Pass the padded password
      passwordPadded,
      // c) Pass the value of the encryption dictionary’s O entry to the MD5 hash function
      this.dictionary.O.toArrayBuffer(),
      // d) Convert the integer value of the P entry to a 32-bit unsigned binary 
      //    number and pass these bytes to the MD5 hash function, low-order byte first.
      new Int32Array([this.dictionary.P]),
      // e) Pass the first element of the file’s file identifier array
      this.id,
      // f) If document metadata is not being encrypted, pass 4 bytes with 
      //    the value 0xFFFFFFFF to the MD5 hash function
      (this.revision > 4 && !this.dictionary.EncryptMetadata)
        ? new Uint8Array([255, 255, 255, 255])
        : new Uint8Array(),
    );
    // g) Finish the hash.
    let hash = await this.crypto.digest(algorithms.md5, hashData);

    // h) (Security handlers of revision 3 or greater) Do the following 50 times
    let counter = 50;
    while (this.revision > 3 && counter--) {
      hash = await this.crypto.digest(algorithms.md5, hash);
    }

    // i) Set the file encryption key to the first n bytes of the output from the final MD5 hash, where n shall always
    //    be 5 for security handlers of revision 2 but, for security handlers of revision 3 or greater, shall depend on
    //    the value of the encryption dictionary’s Length entry. 
    const hashView = new Uint8Array(hash);
    if (this.revision > 3) {
      return hashView.slice(0, this.dictionary.Length >> 3);
    }

    return hashView.slice(0, 5);
  }

  /**
   * Algorithm 5 (Computing the encryption dictionary’s U (user password) value (Security handlers of revision 3 or greater))
   * @param hashedOwnerPassword
   * @param hashedOwnerPassword Hashed owner password ("O" entry from crypto dictionary)
   * @param fileIdentifier PDF file identifier (first element of "ID" array from PDF trailer)
   * @param pEntry Used flags ("P" entry from crypto dictionary)
   * @param revision The used revision ("R" element from crypto dictionary)
   * @param Key length (in bits) as how its stated in crypto dictionary ("Length" element of crypto dictionary)
   * @param Was PDF metadata encrypted or not ("EncryptMetadata" element of crypto dictionary)
   * @param Used password
   */
  public async algorithm5_old(hashedOwnerPassword: BufferSource, fileIdentifier: BufferSource, pEntry: number, revision: number, keyLength = 40, metadataEncrypted = false, password = (new ArrayBuffer(0))): Promise<ArrayBuffer> {

    const passwordBuffer = StandardEncryptionHandler.padPassword(password);

    const key = await this.generateKeyPasswordBased(hashedOwnerPassword, fileIdentifier, pEntry, revision, keyLength, metadataEncrypted, passwordBuffer);

    // Initialize the MD5 hash function and pass the 32-byte padding string
    const hash = await this.crypto.digest(algorithms.md5, BufferSourceConverter.concat(passwordPadding.buffer, fileIdentifier));

    let encryptionKey = await this.crypto.encrypt(algorithms.rc4, key as any, hash);
    encryptionKey = await this.makeAdditionalEncryption(encryptionKey);

    const arbitraryPadding = this.crypto.getRandomValues(new Uint8Array(16));

    // Append arbitrary padding
    return BufferSourceConverter.concat(encryptionKey, arbitraryPadding);
  }

  /**
  * Algorithm 4 (Computing the encryption dictionary’s U (user password) value (Security handlers of revision 2))
  * @param hashedOwnerPassword Hashed owner password ("O" entry from crypto dictionary)
  * @param fileIdentifier PDF file identifier (first element of "ID" array from PDF trailer)
  * @param pEntry Used flags ("P" entry from crypto dictionary)
  * @param revision The used revision ("R" element from crypto dictionary)
  * @param Key length (in bits) as how its stated in crypto dictionary ("Length" element of crypto dictionary)
  * @param Was PDF metadata encrypted or not ("EncryptMetadata" element of crypto dictionary)
  * @param Used password
  */
  public async algorithm4(hashedOwnerPassword: BufferSource, fileIdentifier: ArrayBuffer, pEntry: number, revision: number, keyLength = 40, metadataEncrypted = false, password = (new ArrayBuffer(0))): Promise<ArrayBuffer> {
    const key = await this.generateKeyPasswordBased(hashedOwnerPassword, fileIdentifier, pEntry, revision, keyLength, metadataEncrypted, password);

    return this.crypto.encrypt(algorithms.rc4, key as any, passwordPadding);
  }

  private async internalCycle(internalData: ArrayBuffer, roundNumber: number, check = false, isOwner = false, password = new ArrayBuffer(0), hashedUserPassword = new ArrayBuffer(0)): Promise<{
    hash: ArrayBuffer;
    roundNumber: number;
    leastByte: number;
  }> {
    let resultBuffer = new ArrayBuffer(0);
    let combinedBuffer = utilConcatBuf(password, internalData);
    if (isOwner) {
      combinedBuffer = utilConcatBuf(combinedBuffer, hashedUserPassword);
    }

    // 64 repetitions of the sequence
    for (let i = 0; i < 64; i++) {
      resultBuffer = utilConcatBuf(resultBuffer, combinedBuffer);
    }

    const importedKey = await this.crypto.importKey("raw", internalData.slice(0, 16), algorithms.AesCBC, false, ["encrypt"]);

    let encryptedResult = await this.crypto.encrypt({
      name: "AES-CBC",
      length: 128,
      iv: internalData.slice(16, 32)
    }, importedKey, resultBuffer);

    encryptedResult = encryptedResult.slice(0, resultBuffer.byteLength); // There is padding in WebCrypto - remove unnecesary tail bytes

    const view = new Uint8Array(encryptedResult);

    let remainder = 0;

    // The math trick I got from PDF.js (https://github.com/mozilla/pdf.js)
    for (let i = 0; i < 16; i++) {
      remainder *= (256 % 3);
      remainder %= 3;
      remainder += ((view[i] >>> 0) % 3);
      remainder %= 3;
    }

    // Calculate appropriate hash
    let digestedEncryptResult;

    switch (remainder) {
      case 0:
        digestedEncryptResult = await this.crypto.digest(algorithms.sha256, encryptedResult);
        break;
      case 1:
        digestedEncryptResult = await this.crypto.digest(algorithms.sha384, encryptedResult);
        break;
      case 2:
        digestedEncryptResult = await this.crypto.digest(algorithms.sha512, encryptedResult);
        break;
      default:
        throw new Error("Something went wrong");
    }

    // Making additional check if needed
    if (check) {
      if (view[view.length - 1] > (roundNumber - 32)) { // noinspection TailRecursionJS
        return this.internalCycle(digestedEncryptResult, roundNumber + 1, true);
      }
    }

    return {
      hash: digestedEncryptResult,
      roundNumber,
      leastByte: view[view.length - 1]
    };
  }

  // private async checkPassword(key: Key, password: ArrayBuffer, combinedValidationBuffer: ArrayBuffer, combinedKeyBuffer: ArrayBuffer, hashedPassword: ArrayBuffer, owner = false): Promise<Key> {
  //   const hashedUserPasswordForOwner = owner ? hashedPassword.slice(0, 48) : undefined;
  //   const passwordCheck = await this.algorithm2B(combinedValidationBuffer, owner, password, hashedUserPasswordForOwner);

  //   if (isEqualBuffer(passwordCheck, hashedPassword.slice(0, 32))) {
  //     key.keyType = owner ? 2 : 1;
  //     key.key = await this.algorithm2B(combinedKeyBuffer, owner, password, hashedUserPasswordForOwner);
  //   } else {
  //     let combinedEmptyValidationBuffer = utilConcatBuf(new ArrayBuffer(0), hashedPassword.slice(32, 40));
  //     let combinedEmptyKeyBuffer = utilConcatBuf(new ArrayBuffer(0), hashedPassword.slice(40, 48));

  //     if (hashedUserPasswordForOwner) {
  //       combinedEmptyValidationBuffer = utilConcatBuf(combinedEmptyValidationBuffer, hashedUserPasswordForOwner);
  //       combinedEmptyKeyBuffer = utilConcatBuf(combinedEmptyKeyBuffer, hashedUserPasswordForOwner);
  //     }

  //     const emptyPasswordCheck = await this.algorithm2B(combinedEmptyValidationBuffer, owner, new ArrayBuffer(0), hashedUserPasswordForOwner);
  //     if (isEqualBuffer(emptyPasswordCheck, hashedPassword.slice(0, 32))) {
  //       key.keyType = owner ? 2 : 1;
  //       key.key = await this.algorithm2B(combinedEmptyKeyBuffer, owner, new ArrayBuffer(0), hashedUserPasswordForOwner);
  //     }
  //   }

  //   return key;
  // }

  /**
   * Generate cryptographic key for password-based encryption (PDF 2.0 algorithm)
   * @param hashedOwnerPassword Hashed owner password ("O" entry from crypto dictionary)
   * @param hashedUserPassword Hashed user password ("U" entry from crypto dictionary)
   * @param ownerEncryptedKey Owner's encrypted key ("OE" entry from crypto dictionary)
   * @param userEncryptedKey User's encrypted key ("UE" entry from crypto dictionary)
   * @param password User password
   */
  // public async generateKeyPasswordBasedA(hashedOwnerPassword: ArrayBuffer, hashedUserPassword: ArrayBuffer, ownerEncryptedKey: ArrayBuffer, userEncryptedKey: ArrayBuffer, password = new ArrayBuffer(0)): Promise<ArrayBuffer> {
  //   // Initial variables
  //   let key: Key = {
  //     keyType: 0,
  //     key: null,
  //   };

  //   const combinedValidationUserBuffer = utilConcatBuf(password, hashedUserPassword.slice(32, 40));
  //   const combinedValidationOwnerBuffer = utilConcatBuf(password, hashedOwnerPassword.slice(32, 40), hashedUserPassword.slice(0, 48));

  //   const combinedKeyUserBuffer = utilConcatBuf(password, hashedUserPassword.slice(40, 48));
  //   const combinedKeyOwnerBuffer = utilConcatBuf(password, hashedOwnerPassword.slice(40, 48), hashedUserPassword.slice(0, 48));

  //   // TODO don't change the input variable
  //   if (password.byteLength) {
  //     password = password.slice(0, password.byteLength > 127 ? 127 : password.byteLength);
  //   }

  //   key = await this.checkPassword(key, password, combinedValidationUserBuffer, combinedKeyUserBuffer, hashedUserPassword);

  //   if (!key) {
  //     key = await this.checkPassword(key, password, combinedValidationOwnerBuffer, combinedKeyOwnerBuffer, hashedUserPassword, true);
  //   }

  //   if (!key.key) {
  //     throw new Error("No key found");
  //   }

  //   // Import key
  //   const importKeyResult = await this.crypto.importKey("raw", key.key, algorithms.AesCBC, false, keyUsages);

  //   return this.crypto.decrypt({
  //     name: "AES-CBC",
  //     length: 256,
  //     iv: (new ArrayBuffer(16)),
  //     pad: true
  //   } as Algorithm, importKeyResult, key.keyType === 1 ? userEncryptedKey : ownerEncryptedKey);

  // }

  /**
   * Algorithm 3 (Computing the encryption dictionary’s O (owner password) value)
   * @param ownerPassword
   * @param userPassword
   * @param revision The used revision ("R" element from crypto dictionary)
   * @param keyLength Key length (in bits) as how its stated in crypto dictionary ("Length" element of crypto dictionary)
   */
  public async algorithm3(ownerPassword: ArrayBuffer, userPassword: ArrayBuffer, revision: number, keyLength = 40): Promise<ArrayBuffer> {
    let encryptionKey = new ArrayBuffer(keyLength >> 3);

    const ownerPasswordBuffer = StandardEncryptionHandler.padPassword(ownerPassword.byteLength ? ownerPassword : userPassword);
    const userPasswordBuffer = StandardEncryptionHandler.padPassword(userPassword);

    // Make first MD5 hash
    const firstHash = await this.crypto.digest(algorithms.md5, ownerPasswordBuffer);

    // Make additional hashing if needed
    if (revision < 3) {
      return firstHash;
    }

    let internalSequence = firstHash;
    for (let i = 0; i < 50; i++) {
      internalSequence = await this.crypto.digest(algorithms.md5, internalSequence);
    }

    encryptionKey = await this.crypto.encrypt(algorithms.rc4, internalSequence.slice(0, keyLength >> 3) as any, userPasswordBuffer);
    if (revision < 3) {
      return encryptionKey;
    }

    return this.makeAdditionalEncryption(encryptionKey);
  }

  private async makeAdditionalEncryption(encryptionKey: ArrayBuffer): Promise<ArrayBuffer> {
    let result = encryptionKey;
    const encryptionKeyView = new Uint8Array(result);

    for (let i = 1; i < 20; i++) {
      const currentKeyBuffer = new ArrayBuffer(result.byteLength);
      const currentKeyView = new Uint8Array(currentKeyBuffer);

      for (let j = 0; j < result.byteLength; j++) {
        currentKeyView[j] = encryptionKeyView[j] ^ i;
      }

      result = await this.crypto.encrypt(algorithms.rc4, currentKeyBuffer as any, result);
    }

    return result;
  }

  private async getCutHashV2(combinedKey: BufferSource, stmKeyByteLength: number): Promise<ArrayBuffer> {
    const md = await this.crypto.digest(algorithms.md5, combinedKey);
    const initialKeyLength = stmKeyByteLength + 5;

    return md.slice(0, ((initialKeyLength > 16) ? 16 : initialKeyLength));
  }

  // public async makeGlobalCryptoParameters(params: {
  //   algorithmType?: string;
  //   idBuffer?: ArrayBuffer;
  //   userPassword?: ArrayBuffer;
  //   ownerPassword?: ArrayBuffer;
  //   permission?: number;
  //   encryptMetadata?: boolean;
  //   fileEncryptionKey?: ArrayBuffer;
  //   revision: 2 | 3 | 4 | 6;
  //   keyLength: number;
  // }): Promise<MakeGlobalCryptoParams> {
  //   //#region Initial variables
  //   let idBuffer: ArrayBuffer;
  //   let idView: Uint8Array;
  //   let userPasswordBuffer = new ArrayBuffer(0);
  //   let ownerPasswordBuffer = new ArrayBuffer(0);

  //   let keyLength = 40;

  //   let oValue = new ArrayBuffer(0);
  //   let oeValue = new ArrayBuffer(0);
  //   let uValue = new ArrayBuffer(0);
  //   let ueValue = new ArrayBuffer(0);
  //   let permsValue = new ArrayBuffer(0);

  //   let pValue = (-44);
  //   let pValueBuffer = (new Uint8Array([0xD4, 0xFF, 0xFF, 0xFF])).buffer;

  //   let encryptMetadata = true;

  //   let keyType;
  //   let key: ArrayBuffer | null = null;

  //   let resultDictionary;
  //   //#endregion

  //   //#region Check input parameters
  //   if (!params.idBuffer) {
  //     idBuffer = new ArrayBuffer(64);
  //     idView = new Uint8Array(idBuffer);
  //     this.crypto.getRandomValues(idView);
  //   } else {
  //     idBuffer = params.idBuffer;
  //     idView = new Uint8Array(idBuffer);
  //   }

  //   if (params.userPassword) {
  //     userPasswordBuffer = params.userPassword.slice(0);
  //   }
  //   if (params.ownerPassword) {
  //     ownerPasswordBuffer = params.ownerPassword.slice(0);
  //   }

  //   if ((ownerPasswordBuffer.byteLength === 0) && (userPasswordBuffer.byteLength === 0)) {
  //     throw new Error("At least one of user and owner password must be present");
  //   }

  //   // TODO: Probably the block should be removed, NEED TO BE TESTED !!!
  //   if (ownerPasswordBuffer.byteLength === 0) {
  //     ownerPasswordBuffer = userPasswordBuffer.slice(0);
  //   }

  //   if (!params.revision) {
  //     throw new Error("Parameter revision is mandatory for password-based encryption");
  //   }

  //   if (params.permission) {
  //     pValue = params.permission;
  //     pValueBuffer = (new Uint8Array((new Int32Array([pValue])).buffer)).buffer;
  //   }

  //   if (params.fileEncryptionKey) {
  //     key = params.fileEncryptionKey;
  //   }

  //   if (params.encryptMetadata) {
  //     encryptMetadata = params.encryptMetadata;
  //   }
  //   //#endregion

  //   //#region Special actions depending on selected "revision"
  //   switch (params.revision) {
  //     case 2:
  //     case 3:
  //     case 4:
  //       {
  //         //#region Initial checks
  //         if (ownerPasswordBuffer.byteLength === 0)
  //           ownerPasswordBuffer = userPasswordBuffer.slice(0);

  //         if (params.keyLength) {
  //           if ((params.keyLength < 40) || (params.keyLength > 128)) {
  //             throw new Error("Value of keyLength must be in range [40, 128]");
  //           }

  //           keyLength = params.keyLength;
  //         }

  //         let algorithmType = "RC4";

  //         if (params.algorithmType)
  //           algorithmType = params.algorithmType;

  //         if ((algorithmType.toUpperCase() === "AES") && (params.revision === 4))
  //           keyType = "AESV2";
  //         else
  //           keyType = "V2";
  //         //#endregion

  //         // Compute "O" value
  //         oValue = await this.algorithm3(ownerPasswordBuffer, userPasswordBuffer, params.revision, keyLength);

  //         // Compute "U" value
  //         if (params.revision < 3) {
  //           uValue = await this.algorithm4(oValue, idBuffer, pValue, params.revision, keyLength, encryptMetadata, userPasswordBuffer);
  //         }
  //         uValue = await this.algorithm5_old(oValue, idBuffer, pValue, params.revision, keyLength, encryptMetadata, userPasswordBuffer);

  //         // Compute file encryption key value
  //         key = await this.generateKeyPasswordBased(oValue, idBuffer, pValue, params.revision, keyLength, encryptMetadata, userPasswordBuffer);

  //         //#region Create and return final "Dictionary" value
  //         const doc = this.dictionary.documentUpdate!.document;
  //         if (params.revision < 4) {
  //           resultDictionary = doc.createDictionary(
  //             ["Filter", doc.createName("Standard")],
  //             ["V", doc.createNumber((params.revision === 2) ? 1 : 2)],
  //             ["R", doc.createNumber(params.revision)],
  //             ["P", doc.createNumber(pValue)],
  //             ["Length", doc.createNumber(keyLength)],
  //             ["O", doc.createString(Convert.ToBinary(oValue))],
  //             ["U", doc.createString(Convert.ToBinary(uValue))],
  //           );
  //         } else {
  //           resultDictionary = doc.createDictionary(
  //             ["Filter", doc.createName("Standard")],
  //             ["Length", doc.createNumber(keyLength)],
  //             ["V", doc.createNumber(4)],
  //             ["R", doc.createNumber(4)],
  //             ["P", doc.createNumber(pValue)],
  //             ["O", doc.createString(Convert.ToBinary(oValue))],
  //             ["U", doc.createString(Convert.ToBinary(uValue))],
  //             ["StmF", doc.createName("StdCF")],
  //             ["StrF", doc.createName("StdCF")],
  //             ["CF", doc.createDictionary(
  //               ["StdCF", doc.createDictionary(
  //                 ["AuthEvent", doc.createName("DocOpen")],
  //                 ["CFM", doc.createName(keyType)],
  //                 ["Length", doc.createNumber(16)],
  //               )],
  //             )],
  //           );
  //         }
  //         //#endregion
  //       }
  //       break;
  //     case 6:
  //       {
  //         keyType = "AESV3";
  //         if (key === null) {
  //           //#region Generate file encryption key
  //           const generateKeyResult = await this.crypto.generateKey({
  //             name: "AES-CBC",
  //             length: 256
  //           }, true, keyUsages);

  //           key = await this.crypto.exportKey("raw", generateKeyResult);
  //           //#endregion
  //         }

  //         //#region Compute "U" and "UE" values
  //         [uValue, ueValue] = await this.algorithm8(key, userPasswordBuffer);
  //         //#endregion

  //         //#region Compute "O" and "OE" values
  //         [oValue, oeValue] = await this.algorithm9(uValue, key, ownerPasswordBuffer);
  //         //#endregion

  //         //#region Compute "Perms" value
  //         permsValue = await this.algorithm10(pValueBuffer, key, encryptMetadata);
  //         //#endregion

  //         //#region Create and return final "Dictionary" value
  //         const doc = this.dictionary.documentUpdate!.document;
  //         resultDictionary = doc.createDictionary(
  //           ["Filter", doc.createName("Standard")],
  //           ["Length", doc.createNumber(256)],
  //           ["V", doc.createNumber(5)],
  //           ["P", doc.createNumber(pValue)],
  //           ["O", doc.createString(Convert.ToBinary(oValue))],
  //           ["U", doc.createString(Convert.ToBinary(uValue))],
  //           ["OE", doc.createString(Convert.ToBinary(oeValue))],
  //           ["UE", doc.createString(Convert.ToBinary(ueValue))],
  //           ["Perms", doc.createString(Convert.ToBinary(permsValue))],
  //           ["StmF", doc.createName("StdCF")],
  //           ["StrF", doc.createName("StdCF")],
  //           ["CF", doc.createDictionary(
  //             ["StdCF", doc.createDictionary(
  //               ["AuthEvent", doc.createName("DocOpen")],
  //               ["CFM", doc.createName("AESV3")],
  //               ["Length", doc.createNumber(32)],
  //             )],
  //           )],
  //         );
  //         #endregion;
  //       }
  //       break;
  //     default:
  //       throw `Incorrect revision number: ${params.revision}`;
  //   }
  //   //#endregion

  //   //#region Make output values
  //   return {
  //     dictionary: resultDictionary.to(StandardEncryptDictionary),
  //     id: idBuffer,
  //     keyType,
  //     key
  //   };
  //   //#endregion
  // }

  protected async cipher(encrypt: boolean, stream: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer> {
    const view = BufferSourceConverter.toUint8Array(stream);

    // Get crypto key for the target object
    const keys = await this.#getKeys();
    const key = (target instanceof PDFStream)
      ? keys.stream // use StmF key for Stream
      : keys.string; // use StrF key for Literal and Hexadecimal strings

    if (key.type === CryptoFilterMethods.None) {
      return view;
    }

    let data: Uint8Array;
    let iv: Uint8Array;
    if (encrypt) {
      iv = this.crypto.getRandomValues(new Uint8Array(16));
      data = view;
    } else {
      iv = view.slice(0, 16);
      data = view.slice(16, view.byteLength);
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
            await this.crypto.encrypt(alg, cryptoKey, data),
          ]);
        }

        return await this.crypto.decrypt(alg, cryptoKey, data);
      }
      case CryptoFilterMethods.AES256: {
        const cryptoKey = await this.crypto.importKey("raw", key.raw, algorithms.AesCBC, false, keyUsages);
        const alg = { name: "AES-CBC", iv };

        if (encrypt) {
          return BufferSourceConverter.concat([
            iv,
            await this.crypto.encrypt(alg, cryptoKey, data),
          ]);
        }

        return await this.crypto.decrypt(alg, cryptoKey, data);
      }
      case CryptoFilterMethods.RC4:
      default: {
        const cryptoKey = await this.getCutHashV2(combinedKey, key.raw.byteLength) as any;

        if (encrypt) {
          return await this.crypto.encrypt(algorithms.rc4, cryptoKey, data);
        }

        return await this.crypto.decrypt(algorithms.rc4, cryptoKey, data);
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
