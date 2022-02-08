import { BufferSourceConverter, Convert } from "pvtsutils";
import { BufferSource } from "pvtsutils";
import { isEqualBuffer, utilConcatBuf } from "pvutils";
import { IPDFIndirect } from "../objects/Object";
import { FilterDictionary } from "../structure/dictionaries/Filter";
import { StandardEncryptDictionary } from "../structure/dictionaries/StandardEncrypt";
import * as pkijs from "pkijs";

import { algorithms, globalParametersCryptFilter, staticData, staticDataFF } from "./Constants";
import { EncryptionHandler } from "./EncryptionHandler";

const passwordPadding = new Uint8Array([0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08, 0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68,
  0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A]);

export interface Key {
  keyType: number;
  key: ArrayBuffer | null;
}

export class StandardEncryptionHandler extends EncryptionHandler {
  public static readonly NAME = "Standard";
  public name = StandardEncryptionHandler.NAME;

  public override dictionary!: StandardEncryptDictionary;

  public globalParameters?: globalParametersCryptFilter;

  public async encrypt(stream: BufferSource, parent: IPDFIndirect): Promise<ArrayBuffer> {
    const streamBuffer = BufferSourceConverter.toUint8Array(stream);

    let result: ArrayBuffer;
    const globalParameters = await this.getGlobalParameters();
    
    const dataIV = new Uint8Array(16);
    pkijs.getRandomValues(dataIV);

    const id = new Int32Array([parent.id]);
    const generation = new Int32Array([parent.generation]);
    let combinedKey = utilConcatBuf(globalParameters.stm.key, id.buffer.slice(0, 3), generation.buffer.slice(0, 2));

    switch (globalParameters.stm.keyType) {
      case "AESV2": {
        combinedKey = utilConcatBuf(combinedKey, staticData.buffer);

        const cutHash = await this.getCutHashV2(combinedKey, globalParameters.stm.key.byteLength, this.crypto);
        const key = await this.crypto.importKey("raw", cutHash, algorithms.aescbc, false, ["encrypt", "decrypt"]);

        const encryptionKey = await this.crypto.encrypt({
          name: "AES-CBC",
          length: 128,
          iv: dataIV
        },
          key,
          streamBuffer);

        result = utilConcatBuf(dataIV.buffer, encryptionKey);
      }
        break;
      case "AESV3": {
        const key = await this.crypto.importKey("raw", globalParameters.stm.key, algorithms.aescbc, false, ["encrypt", "decrypt"]);
        const encryptionsKey = await this.crypto.encrypt({
          name: "AES-CBC",
          length: 256,
          iv: dataIV
        },
          key,
          streamBuffer);

        result = utilConcatBuf(dataIV.buffer, encryptionsKey);
      }
        break;
      case "V2":
      default: {
        const cutHash = await this.getCutHashV2(combinedKey, globalParameters.stm.key.byteLength, this.crypto);
        result = await this.crypto.encrypt(algorithms.rc4, cutHash as any, streamBuffer);
      }
    }

    return result;
  }

  public async decrypt(stream: BufferSource, parent: IPDFIndirect): Promise<ArrayBuffer> {
    const streamBuffer = BufferSourceConverter.toUint8Array(stream);
    if (this.dictionary.v === 4) {
      if (this.dictionary.stmF === "Identity" && this.dictionary.strF === "Identity") {
        return streamBuffer;
      }
    }

    let result: ArrayBuffer;
    const globalParameters = await this.getGlobalParameters();

    const dataBuffer = streamBuffer.slice(16, streamBuffer.byteLength);
    const ivBuffer = streamBuffer.slice(0, 16);

    const id = new Int32Array([parent.id]);
    const generation = new Int32Array([parent.generation]);
    let combinedKey = utilConcatBuf(globalParameters.stm.key, id.buffer.slice(0, 3), generation.buffer.slice(0, 2));

    switch (globalParameters.stm.keyType) {
      case "AESV2": {

        combinedKey = utilConcatBuf(combinedKey, staticData);

        const cutHash = await this.getCutHashV2(combinedKey, globalParameters.stm.key.byteLength, this.crypto);

        const importedKey = await this.crypto.importKey("raw", cutHash, algorithms.aescbc, false, ["decrypt"]);
        result = await this.crypto.decrypt({
          name: "AES-CBC",
          length: 128,
          iv: ivBuffer
        },
          importedKey,
          dataBuffer);
      }
        break;
      case "AESV3": {
        const importedKey = await this.crypto.importKey("raw", globalParameters.stm.key, algorithms.aescbc, false, ["encrypt", "decrypt"]);
        result = await this.crypto.decrypt({
          name: "AES-CBC",
          length: 256,
          iv: ivBuffer
        },
          importedKey,
          dataBuffer);
      }
        break;
      case "V2":
      default: {
        const cutHash = await this.getCutHashV2(combinedKey, globalParameters.stm.key.byteLength, this.crypto);
        result = await this.crypto.decrypt(algorithms.rc4, cutHash as any, streamBuffer);
      }
    }

    return result;
  }

  public async getGlobalParameters(): Promise<globalParametersCryptFilter> {
    if (!this.globalParameters) {
      // let password = new ArrayBuffer(0);

      const resultObject: globalParametersCryptFilter = {
        stm: {
          key: new ArrayBuffer(0),
          keyType: "",
        },
        str: {
          key: new ArrayBuffer(0),
          keyType: "",
        }
      };

      let userPasswordBuffer = new ArrayBuffer(0);
      if (this.dictionary.documentUpdate?.document.options?.password?.user) {
        userPasswordBuffer = Convert.FromString(this.dictionary.documentUpdate?.document.options?.password?.user);
      }
      // let ownerPasswordBuffer = new ArrayBuffer(0);

      // // Check client-side parameters
      // if ("Crypt" in _this.clientSideParameters) {
      //   // noinspection JSUnresolvedVariable
      //   if ("ownerPassword" in _Crypt) {
      //     // noinspection JSUnresolvedVariable
      //     //ownerPasswordBuffer = stringToArrayBuffer(_Crypt.ownerPassword);
      //     ownerPasswordBuffer = _Crypt.ownerPassword.slice(0);
      //   }

      //   // noinspection JSUnresolvedVariable
      //   if ("userPassword" in _Crypt) {
      //     // noinspection JSUnresolvedVariable
      //     //userPasswordBuffer = stringToArrayBuffer(_Crypt.userPassword);
      //     userPasswordBuffer = _Crypt.userPassword.slice(0);
      //   }
      // }

      const idSearch = this.dictionary.documentUpdate?.id;
      if (!idSearch) {
        throw new Error("No ID element in document trailer");
      }
      const trailerId = idSearch[0].toArrayBuffer();

      if (this.dictionary.r === 6) {
        throw new Error("Method not implemented");

        // // Get values necessary in case we are working with PDF 2.0 formated file
        //   // OE
        //   const oeSearch = _this.encryptGlobalParameters.dictionary.valueByName(new Name({ value: "OE" }));
        //   if (oeSearch.status === (-1))
        //     return resultObject; // Can not find value for hashed owner's password (extension)

        //   switch (true) {
        //     case (oeSearch.value.constructor.className === HexString.className):
        //       break;
        //     case (oeSearch.value.constructor.className === LiteralString.className):
        //       this.dictionary.oe = stringToArrayBuffer(oeSearch.value.value);
        //       break;
        //     default:
        //       return resultObject; // Incorrect type of OE element
        //   }

        //   // UE
        //   const ueSearch = _this.encryptGlobalParameters.dictionary.valueByName(new Name({ value: "UE" }));
        //   if (ueSearch.status === (-1))
        //     return resultObject; // Can not find value for hashed user's password (extension)

        //   switch (true) {
        //     case (ueSearch.value.constructor.className === HexString.className):
        //       this.dictionary.ue = ueSearch.value.decodedValue.buffer;
        //       break;
        //     case (ueSearch.value.constructor.className === LiteralString.className):
        //       this.dictionary.ue = stringToArrayBuffer(ueSearch.value.value);
        //       break;
        //     default:
        //       return resultObject; // Incorrect type of UE element
        //   }

        //   // Perms
        //   const permsSearch = _this.encryptGlobalParameters.dictionary.valueByName(new Name({ value: "Perms" }));
        //   if (ueSearch.status === (-1))
        //     return resultObject; // Can not find value for Perms

        //   switch (true) {
        //     case (permsSearch.value.constructor.className === HexString.className):
        //       this.dictionary.perms = permsSearch.value.decodedValue.buffer;
        //       break;
        //     case (permsSearch.value.constructor.className === LiteralString.className):
        //       this.dictionary.perms = stringToArrayBuffer(permsSearch.value.value);
        //       break;
        //     default:
        //       return resultObject; // Incorrect type of Perms element
        //   }
      }

      // let value = this.dictionary.length;
      // value = (value < 40) ? (value << 3) : value;

      const metadataSearch = this.dictionary.encryptMetadata || true;

      switch (true) {
        // Old version of encryption algorithms do not use filter names
        case (this.dictionary.v < 4):
          {
            const generatedKey = await this.generateKeyPasswordBased(this.dictionary.o.toArrayBuffer(), trailerId, this.dictionary.p, this.dictionary.r, this.dictionary.length, metadataSearch, userPasswordBuffer);
            resultObject.stm.key = generatedKey;
            resultObject.str.key = generatedKey;
          }

          break;
        // Case if we have equal crypto paramaters for both strings and streams
        case (this.dictionary.stmF === this.dictionary.strF):
          {
            let generatedKey;

            const filterParameters = this.getParametersByName(this.dictionary.stmF);
            if (!filterParameters.keyType) {
              throw new Error("Error getting necessary encryption parameters");
            }

            let keyLength = 0;

            // TODO length have default value
            if (this.dictionary.length) {
              keyLength = this.dictionary.length;
            } else {
              keyLength = filterParameters.keyLength;
            }

            if (this.dictionary.v === 5) {
              throw new Error("Metod not implemented");
              // generatedKey = await this.generateKeyPasswordBasedA(this.dictionary.o, this.dictionary.u, this.dictionary.oe, this.dictionary.ue, userPasswordBuffer);
            } else {
              generatedKey = await this.generateKeyPasswordBased(this.dictionary.o.toArrayBuffer(), trailerId, this.dictionary.p, this.dictionary.r, keyLength, this.dictionary.encryptMetadata, userPasswordBuffer);
            }

            resultObject.stm.key = generatedKey;
            resultObject.stm.keyType = filterParameters.keyType;
            resultObject.str.key = generatedKey;
            resultObject.str.keyType = filterParameters.keyType;
          }

          break;
        // Case if we have different parameters for strings and streams
        default:
          {
            // Initial variables
            let stmKeyLength = 0;
            let strKeyLength = 0;

            if ("length" in this.dictionary) {
              stmKeyLength = this.dictionary.length;
              strKeyLength = this.dictionary.length;
            }

            // Parameters for Stm
            const stmFilterParameters = this.getParametersByName(this.dictionary.stmF);
            if (!stmFilterParameters.keyType) {
              throw new Error("Error getting necessary encryption parameters for Stm");
            }

            if (stmKeyLength === 0)
              stmKeyLength = stmFilterParameters.keyLength;

            if (this.dictionary.v !== 5)
              resultObject.stm.key = await this.generateKeyPasswordBased(this.dictionary.o.toArrayBuffer().slice(0, 32), trailerId, this.dictionary.p, this.dictionary.r, stmKeyLength, this.dictionary.encryptMetadata, userPasswordBuffer);
            else {
              throw new Error("Method not implemented");
              // resultObject.Stm.key = await this.generateKeyPasswordBasedA(this.dictionary.o, this.dictionary.u, this.dictionary.oe, this.dictionary.ue, userPasswordBuffer);
            }

            resultObject.stm.keyType = stmFilterParameters.keyType;

            // Parameters for Str
            const strFilterParameters = this.getParametersByName(this.dictionary.strF);
            if (!strFilterParameters.keyType) {
              throw new Error("Error getting necessary encryption parameters for Str");
            }

            if (strKeyLength === 0)
              strKeyLength = strFilterParameters.keyLength;

            if (this.dictionary.v !== 5)
              resultObject.str.key = await this.generateKeyPasswordBased(this.dictionary.o.toArrayBuffer().slice(0, 32), trailerId, this.dictionary.p, this.dictionary.r, strKeyLength, this.dictionary.encryptMetadata, userPasswordBuffer);
            else {
              throw new Error("Method not implemented");
              // resultObject.Str.key = await this.generateKeyPasswordBasedA(this.dictionary.o, this.dictionary.u, this.dictionary.oe, this.dictionary.ue, userPasswordBuffer);
            }

            resultObject.str.keyType = strFilterParameters.keyType;
          }
      }
      this.globalParameters = resultObject;
    }

    return this.globalParameters;
  }

  public getParametersByName(filterName: string) {
    const result = {
      keyLength: 0,
      keyType: ""
    };

    if (!this.dictionary.cf || !this.dictionary.cf.has(filterName)) {
      return result;
    }

    const streamFilterParameters = this.dictionary.cf.get(filterName, FilterDictionary);
    // TODO change check
    if (!(streamFilterParameters instanceof FilterDictionary)) {
      throw new Error(`${filterName} is not Filter Dictionary`);
    }

    const cfmSearch = streamFilterParameters.cfm;

    switch (cfmSearch) {
      case "V2":
        {
          result.keyType = cfmSearch;

          const length = streamFilterParameters.length;
          if (!length) {
            return result;
          }
          result.keyLength = (length < 40) ? (length << 3) : length;
        }
        break;
      case "AESV2":
        result.keyType = cfmSearch;
        result.keyLength = 128;
        break;
      case "AESV3":
        result.keyType = cfmSearch;
        result.keyLength = 256;
        break;
      default:
    }

    return result;
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
  public async generateKeyPasswordBased(hashedOwnerPassword: BufferSource, fileIdentifier: ArrayBuffer, pEntry: number, revision: number, keyLength = 40, metadataEncrypted = false, password?: ArrayBuffer): Promise<ArrayBuffer> {

    const ownerPassword = BufferSourceConverter.toArrayBuffer(hashedOwnerPassword).slice(0, 32);
    const pEntryArrayBuffer = new Uint32Array([pEntry]).buffer;

    const passwordBuffer = this.mixedPassword(password);

    // Combine all necessary values and make the first hash
    let combinedBuffer = utilConcatBuf(passwordBuffer,
      ownerPassword,
      pEntryArrayBuffer,
      fileIdentifier);

    if (revision > 3 && !metadataEncrypted) {
      combinedBuffer = utilConcatBuf(combinedBuffer, staticDataFF.buffer);
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

  public mixedPassword(password?: ArrayBuffer): ArrayBuffer {
    let passwordBuffer: ArrayBuffer;
    if (!password) {
      passwordBuffer = passwordPadding.buffer;
    } else if (password.byteLength >= 32) {
      passwordBuffer = password.slice(0, 32);
    } else {
      const additional = passwordPadding.subarray(0, 32 - password.byteLength);
      passwordBuffer = utilConcatBuf(password, additional);
    }

    return passwordBuffer;
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
  public async algorithm5(hashedOwnerPassword: BufferSource, fileIdentifier: ArrayBuffer, pEntry: number, revision: number, keyLength = 40, metadataEncrypted = false, password = (new ArrayBuffer(0))): Promise<ArrayBuffer> {
    const arbitraryPaddingBuffer = new ArrayBuffer(16);
    const arbitraryPaddingView = new Uint8Array(arbitraryPaddingBuffer);
    pkijs.getRandomValues(arbitraryPaddingView);

    // TODO left operations?
    // const passwordBuffer = this.mixedPassword(password);

    const key = await this.generateKeyPasswordBased(hashedOwnerPassword, fileIdentifier, pEntry, revision, keyLength, metadataEncrypted, password);

    // Initialise the MD5 hash function and pass the 32-byte padding string
    const hash = await this.crypto.digest(algorithms.md5, utilConcatBuf(passwordPadding.buffer, fileIdentifier));

    let encryptionKey = await this.crypto.encrypt(algorithms.rc4, key as any, hash);
    encryptionKey = await this.makeAdditionalEncryption(encryptionKey);

    // Append arbitrary padding
    return utilConcatBuf(encryptionKey, arbitraryPaddingBuffer);
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

    return this.crypto.encrypt(algorithms.rc4, key as any, passwordPadding.buffer);
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

    const importedKey = await this.crypto.importKey("raw", internalData.slice(0, 16), algorithms.aescbc, false, ["encrypt"]);

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

  /**
   * Algorithm 2.B (Computing a hash)
   * @param data
   * @param isOwner True only in case the "O" entry would be calculated
   * @param password Used password
   * @param hashedUserPassword Hashed user password ("U" entry from crypto dictionary)
   */
  public async algorithm2B(data: ArrayBuffer, isOwner = false, password = new ArrayBuffer(0), hashedUserPassword = new ArrayBuffer(0)): Promise<ArrayBuffer> {
    // Initially hash input data using SHA-256
    const digestResult = await this.crypto.digest(algorithms.sha256, data);

    // Running the major cycle
    let internalResult = await this.internalCycle(digestResult, 0, false, isOwner, password, hashedUserPassword);

    // Major cycle
    for (let i = 0; i < 63; i++) {
      internalResult = await this.internalCycle(internalResult.hash, internalResult.roundNumber + 1, false, isOwner, password, hashedUserPassword);
    }

    // Cycle with check
    internalResult = await this.internalCycle(internalResult.hash, internalResult.roundNumber + 1, true, isOwner, password, hashedUserPassword);

    return internalResult.hash.slice(0, 32);
  }

  private async checkPassword(key: Key, password: ArrayBuffer, combinedValidationBuffer: ArrayBuffer, combinedKeyBuffer: ArrayBuffer, hashedPassword: ArrayBuffer, owner = false): Promise<Key> {
    const hashedUserPasswordForOwner = owner ? hashedPassword.slice(0, 48) : undefined;
    const passwordCheck = await this.algorithm2B(combinedValidationBuffer, owner, password, hashedUserPasswordForOwner);

    if (isEqualBuffer(passwordCheck, hashedPassword.slice(0, 32))) {
      key.keyType = owner ? 2 : 1;
      key.key = await this.algorithm2B(combinedKeyBuffer, owner, password, hashedUserPasswordForOwner);
    } else {
      let combinedEmptyValidationBuffer = utilConcatBuf(new ArrayBuffer(0), hashedPassword.slice(32, 40));
      let combinedEmptyKeyBuffer = utilConcatBuf(new ArrayBuffer(0), hashedPassword.slice(40, 48));

      if (hashedUserPasswordForOwner) {
        combinedEmptyValidationBuffer = utilConcatBuf(combinedEmptyValidationBuffer, hashedUserPasswordForOwner);
        combinedEmptyKeyBuffer = utilConcatBuf(combinedEmptyKeyBuffer, hashedUserPasswordForOwner);
      }

      const emptyPasswordCheck = await this.algorithm2B(combinedEmptyValidationBuffer, owner, new ArrayBuffer(0), hashedUserPasswordForOwner);
      if (isEqualBuffer(emptyPasswordCheck, hashedPassword.slice(0, 32))) {
        key.keyType = owner ? 2 : 1;
        key.key = await this.algorithm2B(combinedEmptyKeyBuffer, owner, new ArrayBuffer(0), hashedUserPasswordForOwner);
      }
    }

    return key;
  }

  /**
   * Generate cryptographic key for password-based encryption (PDF 2.0 algorithm)
   * @param hashedOwnerPassword Hashed owner password ("O" entry from crypto dictionary)
   * @param hashedUserPassword Hashed user password ("U" entry from crypto dictionary)
   * @param ownerEncryptedKey Owner's encrypted key ("OE" entry from crypto dictionary)
   * @param userEncryptedKey User's encrypted key ("UE" entry from crypto dictionary)
   * @param password User password
   */
  public async generateKeyPasswordBasedA(hashedOwnerPassword: ArrayBuffer, hashedUserPassword: ArrayBuffer, ownerEncryptedKey: ArrayBuffer, userEncryptedKey: ArrayBuffer, password = new ArrayBuffer(0)): Promise<ArrayBuffer> {
    // Initial variables
    let key: Key = {
      keyType: 0,
      key: null,
    };

    const combinedValidationUserBuffer = utilConcatBuf(password, hashedUserPassword.slice(32, 40));
    const combinedValidationOwnerBuffer = utilConcatBuf(password, hashedOwnerPassword.slice(32, 40), hashedUserPassword.slice(0, 48));

    const combinedKeyUserBuffer = utilConcatBuf(password, hashedUserPassword.slice(40, 48));
    const combinedKeyOwnerBuffer = utilConcatBuf(password, hashedOwnerPassword.slice(40, 48), hashedUserPassword.slice(0, 48));

    // TODO не красиво изменять input
    if (password.byteLength) {
      password = password.slice(0, password.byteLength > 127 ? 127 : password.byteLength);
    }

    key = await this.checkPassword(key, password, combinedValidationUserBuffer, combinedKeyUserBuffer, hashedUserPassword);

    if (!key) {
      key = await this.checkPassword(key, password, combinedValidationOwnerBuffer, combinedKeyOwnerBuffer, hashedUserPassword, true);
    }

    if (!key.key) {
      throw new Error("No key found");
    }

    // Import key
    const importKeyResult = await this.crypto.importKey("raw", key.key, algorithms.aescbc, false, ["encrypt", "decrypt"]);

    return this.crypto.decrypt({
      name: "AES-CBC",
      length: 256,
      iv: (new ArrayBuffer(16)),
      pad: true
    } as Algorithm, importKeyResult, key.keyType === 1 ? userEncryptedKey : ownerEncryptedKey);

  }

  /**
   * Algorithm 3 (Computing the encryption dictionary’s O (owner password) value)
   * @param ownerPassword
   * @param userPassword
   * @param revision The used revision ("R" element from crypto dictionary)
   * @param keyLength Key length (in bits) as how its stated in crypto dictionary ("Length" element of crypto dictionary)
   */
  public async algorithm3(ownerPassword: ArrayBuffer, userPassword: ArrayBuffer, revision: number, keyLength = 40): Promise<ArrayBuffer> {
    let encryptionKey = new ArrayBuffer(keyLength >> 3);

    const ownerPasswordBuffer = this.mixedPassword(ownerPassword.byteLength ? ownerPassword : userPassword);
    const userPasswordBuffer = this.mixedPassword(userPassword);

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

  /**
   * Algorithm 8 (Computing the encryption dictionary’s U (user password) and UE (user encryption key) values)
   * @param fileEncryptionKey The encryption key used for encryption for entire PDF
   * @param Used password
   */
  public async algorithm8(fileEncryptionKey: ArrayBuffer, password = (new ArrayBuffer(0))): Promise<[ArrayBuffer, ArrayBuffer]> {
    const randomBuffer = new ArrayBuffer(16);
    const randomView = new Uint8Array(randomBuffer);
    pkijs.getRandomValues(randomView);

    const hashU = await this.algorithm2B(utilConcatBuf(password, randomBuffer.slice(0, 8)), false, password);
    const uKey = utilConcatBuf(hashU, randomBuffer);

    const hashUE = await this.algorithm2B(utilConcatBuf(password, randomBuffer.slice(8, 16)), false, password);

    const key = await this.crypto.importKey("raw", hashUE, algorithms.aescbc, false, ["encrypt"]);
    const encryptionKey = await this.crypto.encrypt({
      name: "AES-CBC",
      length: 256,
      iv: new ArrayBuffer(16)
    }, key, fileEncryptionKey);
    const ueKey = encryptionKey.slice(0, fileEncryptionKey.byteLength);

    return [uKey, ueKey];
  }

  /**
   * Algorithm 9: Computing the encryption dictionary’s O (owner password) and OE (owner encryption key) values
   * @param hashedUserPassword Hashed owner password ("O" entry from crypto dictionary)
   * @param fileEncryptionKey File encryption key
   * @param password Used password
   */
  public async algorithm9(hashedUserPassword: ArrayBuffer, fileEncryptionKey: ArrayBuffer, password = (new ArrayBuffer(0))): Promise<[ArrayBuffer, ArrayBuffer]> {
    const randomBuffer = new ArrayBuffer(16);
    const randomView = new Uint8Array(randomBuffer);
    pkijs.getRandomValues(randomView);

    const hashO = await this.algorithm2B(utilConcatBuf(password, randomBuffer.slice(0, 8), hashedUserPassword), true, password, hashedUserPassword.slice(0, 48));
    const oKey = utilConcatBuf(hashO, randomBuffer);

    // Compute the "OE" value
    const hashOE = await this.algorithm2B(utilConcatBuf(password, randomBuffer.slice(8, 16), hashedUserPassword), true, password, hashedUserPassword.slice(0, 48));
    const key = await this.crypto.importKey("raw", hashOE, algorithms.aescbc, false, ["encrypt"]);
    const encryptionKey = await this.crypto.encrypt({
      name: "AES-CBC",
      length: 256,
      iv: new ArrayBuffer(16)
    }, key, fileEncryptionKey);
    const oeKey = encryptionKey.slice(0, fileEncryptionKey.byteLength);

    return [oKey, oeKey];
  }

  /**
   * Algorithm 10: Computing the encryption dictionary’s Perms (permissions) value
   * @param pBuffer Value from "P" PDF key (low byte first)
   * @param fileEncryptionKey File encryption key
   * @param encryptMetadata Flag from "EncryptMetadata" PDF key
   */
  public async algorithm10(pBuffer: ArrayBuffer, fileEncryptionKey: ArrayBuffer, encryptMetadata = false): Promise<ArrayBuffer> {
    const constPart = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, (encryptMetadata) ? 0x54 : 0x46, 0x61, 0x64, 0x62]);
    constPart.set(new Uint8Array(pBuffer)); // Set first 4 bytes as "P" value (low bytes first)

    const randomBuffer = new ArrayBuffer(4);
    const randomView = new Uint8Array(randomBuffer);
    pkijs.getRandomValues(randomView);

    const key = await this.crypto.importKey("raw", fileEncryptionKey, algorithms.aesecb, false, ["encrypt"]);
    const encryptionsKey = await this.crypto.encrypt({
      name: "AES-ECB",
      padding: false,
      iv: new ArrayBuffer(16)
    } as Algorithm, key, utilConcatBuf(constPart.buffer, randomBuffer));

    return encryptionsKey;
  }

  private async getCutHashV2(combinedKey: ArrayBuffer, stmKeyByteLength: number, crypto: SubtleCrypto) {
    const md = await crypto.digest(algorithms.md5, combinedKey);
    const initialKeyLength = stmKeyByteLength + 5;

    return md.slice(0, ((initialKeyLength > 16) ? 16 : initialKeyLength));
  }
}
