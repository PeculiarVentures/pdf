import { ICryptoEngine } from "pkijs";
import { BufferSourceConverter, Convert } from "pvtsutils";
import { algorithms } from "./Constants";

export type Password = string | BufferSource;

export interface StandardAlgorithmParams {
  crypto: ICryptoEngine;
}

export interface StandardAlgorithm2Params extends StandardAlgorithmParams {
  password: Password;
  ownerValue: BufferSource;
  permissions: number;
  id: BufferSource;
  revision: number;
  encryptMetadata: boolean;
  length: number;
}

export interface StandardAlgorithm2AParams extends StandardAlgorithmParams {
  password: Password;
  u: BufferSource;
  p: number;
  perms: BufferSource;
  o: BufferSource;
  oe: BufferSource;
  ue: BufferSource;
}

export interface StandardAlgorithm2BParams extends StandardAlgorithmParams {
  password: Password;
  data: BufferSource;
  u?: BufferSource;
}

export interface StandardAlgorithm5Params extends StandardAlgorithmParams {
  /**
   * Encryption key based on the user password string and derived from algorithm2
   */
  encryptionKey: BufferSource;
  revision: number;
  id: BufferSource;
}

export interface StandardAlgorithm3Params extends StandardAlgorithmParams {
  owner: Password;
  user: Password;
  length: number;
  revision: number;
}

export interface StandardAlgorithm8Params extends StandardAlgorithmParams {
  password: Password;
  key: BufferSource;
  /**
   * @internal For test purpose only
   */
  random?: BufferSource;
}

export interface StandardAlgorithm8Result {
  u: ArrayBuffer;
  ue: ArrayBuffer;
}

export interface StandardAlgorithm9Params extends StandardAlgorithm8Params {
  u: BufferSource;
}

export interface StandardAlgorithm9Result {
  o: ArrayBuffer;
  oe: ArrayBuffer;
}

export interface StandardAlgorithm10Params extends StandardAlgorithmParams {
  permissions: number;
  key: ArrayBuffer;
  encryptMetadata?: boolean;
}

export interface StandardAlgorithm11Params extends StandardAlgorithmParams {
  // Password
  password: Password;
  u: BufferSource;
}

export interface StandardAlgorithm12Params extends StandardAlgorithm11Params {
  o: BufferSource;
}

const passwordPadding = new Uint8Array([0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08, 0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68,
  0x3E, 0x80, 0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A]);

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

/**
 * Pads the password the password using predefined PDF padding string
 * @param password Password
 * @returns 32-bytes buffer 
 */
export function padPassword(password: Password = new Uint8Array(0)): ArrayBuffer {
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

interface CycleParams extends StandardAlgorithmParams {
  internalData: ArrayBuffer;
  roundNumber: number;
  check: boolean;
  isOwner?: boolean;
  password: ArrayBuffer;
  hashedUserPassword?: ArrayBuffer;
}

interface CycleResult {
  hash: ArrayBuffer;
  roundNumber: number;
  leastByte: number;
}

/**
 * Implements Password algorithms
 */
export class StandardEncryptionAlgorithm {

  private static async cycle(params: CycleParams): Promise<CycleResult> {
    // a) Make a new string, K1, consisting of 64 repetitions of the sequence: input password, K, the 48-byte user
    //    key. The 48 byte user key is only used when checking the owner password or creating the owner key. If
    //    checking the user password or creating the user key, K1 is the concatenation of the input password
    //    and K.
    let resultBuffer = new ArrayBuffer(0);
    let combinedBuffer = BufferSourceConverter.concat(params.password, params.internalData);
    if (params.isOwner) {
      combinedBuffer = BufferSourceConverter.concat(combinedBuffer, params.hashedUserPassword || new ArrayBuffer(0));
    }

    // 64 repetitions of the sequence
    for (let i = 0; i < 64; i++) {
      resultBuffer = BufferSourceConverter.concat(resultBuffer, combinedBuffer);
    }

    const importedKey = await params.crypto.importKey("raw", params.internalData.slice(0, 16), algorithms.AesCBC, false, ["encrypt"]);

    // b) Encrypt K1 with the AES-128 (CBC, no padding) algorithm, using the first 16 bytes of K as the key and the
    //    second 16 bytes of K as the initialization vector. The result of this encryption is E. 
    let encryptedResult = await params.crypto.encrypt({
      name: "AES-CBC",
      length: 128,
      iv: params.internalData.slice(16, 32)
    }, importedKey, resultBuffer);

    encryptedResult = encryptedResult.slice(0, resultBuffer.byteLength); // There is padding in WebCrypto - remove unnecessary tail bytes

    const view = new Uint8Array(encryptedResult);

    // c) Taking the first 16 bytes of E as an unsigned big-endian integer, compute the remainder, modulo 3. 
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
        // if the result is 0, the next hash used is SHA-256, 
        digestedEncryptResult = await params.crypto.digest(algorithms.sha256, encryptedResult);
        break;
      case 1:
        // if the result is 1, the next hash used is SHA-384, 
        digestedEncryptResult = await params.crypto.digest(algorithms.sha384, encryptedResult);
        break;
      case 2:
        // if the result is 2, the next hash used is SHA-512. 
        digestedEncryptResult = await params.crypto.digest(algorithms.sha512, encryptedResult);
        break;
      default:
        throw new Error("Something went wrong");
    }

    // Making additional check if needed
    if (params.check) {
      // e) Look at the very last byte of E. If the value of that byte (taken as an unsigned integer) is greater than the
      //    round number - 32, repeat steps (a-d) again. 
      // f) Repeat from steps (a-e) until the value of the last byte is ≤ (round number) - 32.
      if (view[view.length - 1] > (params.roundNumber - 32)) { // noinspection TailRecursionJS
        return this.cycle({
          internalData: digestedEncryptResult,
          roundNumber: params.roundNumber + 1,
          check: true,
          password: new ArrayBuffer(0),
          hashedUserPassword: new ArrayBuffer(0),
          crypto: params.crypto,
        });
      }
    }

    return {
      hash: digestedEncryptResult,
      roundNumber: params.roundNumber,
      leastByte: view[view.length - 1]
    };
  }

  /**
   * Computing a file encryption key in order to encrypt a document (revision 4 and earlier)
   * @param params Parameters
   * @returns Encryption key
   */
  public static async algorithm2(params: StandardAlgorithm2Params): Promise<Uint8Array> {
    // a) Prepare password
    const passwordPadded = padPassword(params.password);

    const hashData = BufferSourceConverter.concat(
      // b) Pass the padded password
      passwordPadded,
      // c) Pass the value of the encryption dictionary’s O entry to the MD5 hash function
      params.ownerValue,
      // d) Convert the integer value of the P entry to a 32-bit unsigned binary 
      //    number and pass these bytes to the MD5 hash function, low-order byte first.
      new Int32Array([params.permissions]),
      // e) Pass the first element of the file’s file identifier array
      params.id,
      // f) If document metadata is not being encrypted, pass 4 bytes with 
      //    the value 0xFFFFFFFF to the MD5 hash function
      (params.revision >= 4 && !params.encryptMetadata)
        ? new Uint8Array([255, 255, 255, 255])
        : new Uint8Array(),
    );
    // g) Finish the hash.
    let hash = await params.crypto.digest(algorithms.md5, hashData);

    // h) (Security handlers of revision 3 or greater) Do the following 50 times
    let counter = 50;
    while (params.revision > 3 && counter--) {
      hash = await params.crypto.digest(algorithms.md5, hash);
    }

    // i) Set the file encryption key to the first n bytes of the output from the final MD5 hash, where n shall always
    //    be 5 for security handlers of revision 2 but, for security handlers of revision 3 or greater, shall depend on
    //    the value of the encryption dictionary’s Length entry. 
    const hashView = new Uint8Array(hash);
    if (params.revision >= 3) {
      return hashView.slice(0, params.length >> 3);
    }

    return hashView.slice(0, 5);
  }

  /**
   * Retrieving the file encryption key from an encrypted document in order to decrypt it (revision 6 and later)
   * @param params Parameters
   */
  public static async algorithm2A(params: StandardAlgorithm2AParams): Promise<ArrayBuffer> {
    let eKey: ArrayBuffer;
    const uView = passwordToView(params.u).subarray(0, 48);

    // a) The UTF-8 password string shall be generated from Unicode input by processing the input string with the
    //    SASLprep (RFC 4013) profile of stringprep (RFC 3454) using the Normalize and BiDi options, and then
    //    converting to a UTF-8 representation.
    // b) Truncate the UTF-8 representation to 127 bytes if it is longer than 127 bytes.
    const passwordView = passwordToView(params.password).subarray(0, 127);

    // c) Test the password against the owner key by computing a hash using algorithm 2.B with an input string
    //    consisting of the UTF-8 password concatenated with the 8 bytes of owner Validation Salt, concatenated
    //    with the 48-byte U string. If the 32-byte result matches the first 32 bytes of the O string, this is the owner
    //    password.
    const ok = await this.algorithm12(params);
    if (ok) {
      // d) Compute an intermediate owner key by computing a hash using algorithm 2.B with an input string
      //    consisting of the UTF-8 owner password concatenated with the 8 bytes of owner Key Salt, concatenated
      //    with the 48-byte U string. The 32-byte result is the key used to decrypt the 32-byte OE string using AES256 in CBC mode with no padding and an initialization vector of zero. The 32-byte result is the file
      //    encryption key.
      const oView = passwordToView(params.o).subarray(0, 48);
      const uKey = await this.algorithm2B({
        data: BufferSourceConverter.concat(passwordView, oView.subarray(40, 48), uView),
        password: passwordView,
        u: uView,
        crypto: params.crypto,
      });
      const key = await params.crypto.importKey("raw", uKey, "AES-CBC", false, ["encrypt", "decrypt"]);
      eKey = await params.crypto.decrypt({
        name: "AES-CBC",
        iv: new ArrayBuffer(16),
        pad: true, // PDFCryptoEngine supports this option
      } as AesCbcParams, key, params.oe);

      eKey = eKey.slice(0, 32);
    } else {
      // e) Compute an intermediate user key by computing a hash using algorithm 2.B with an input string
      //    consisting of the UTF-8 user password concatenated with the 8 bytes of user Key Salt. The 32-byte result
      //    is the key used to decrypt the 32-byte UE string using AES-256 in CBC mode with no padding and an
      //    initialization vector of zero. The 32-byte result is the file encryption key.
      const uKey = await this.algorithm2B({
        data: BufferSourceConverter.concat(passwordView, uView.subarray(40, 48)),
        password: passwordView,
        crypto: params.crypto,
      });
      const key = await params.crypto.importKey("raw", uKey, "AES-CBC", false, ["encrypt", "decrypt"]);
      eKey = await params.crypto.decrypt({
        name: "AES-CBC",
        iv: new ArrayBuffer(16),
        pad: true, // PDFCryptoEngine supports this option
      } as AesCbcParams, key, params.ue);

      eKey = eKey.slice(0, 32);
    }

    // f) Decrypt the 16-byte Perms string using AES-256 in ECB mode with an initialization vector of zero and
    //    the file encryption key as the key. Verify that bytes 9-11 of the result are the characters "a", "d", "b". Bytes
    //    0-3 of the decrypted Perms entry, treated as a little-endian integer, are the user permissions. They shall
    //    match the value in the P key.
    const aesEcb = await params.crypto.importKey("raw", eKey, "AES-ECB", false, ["encrypt", "decrypt"]);
    const perms = await params.crypto.decrypt({
      name: "AES-ECB",
      iv: new ArrayBuffer(16),
      pad: true, // PDFCryptoEngine supports this option
    } as AesCbcParams, aesEcb, params.perms);
    const p = new Int32Array(perms.slice(0, 4))[0];
    const adb = perms.slice(9, 12);
    if (!(p === params.p && Convert.ToBinary(adb) === "adb")) {
      throw new Error("Cannot get the file encryption key, the field Perms doesn't match requirements.");
    }

    return eKey;
  }

  /**
   * Computing a hash (revision 6 and later)
   * @param params Parameters
   */
  public static async algorithm2B(params: StandardAlgorithm2BParams): Promise<ArrayBuffer> {
    const u = params.u || new ArrayBuffer(0);

    // Take the SHA-256 hash of the original input to the algorithm and name the resulting 32 bytes, K
    let k = await params.crypto.digest(algorithms.sha256, params.data);
    let e: ArrayBuffer;

    // Perform the following steps (a)-(d) 64 times:
    let i = -1;
    while (true) {
      i++;

      // a) Make a new string, K1, consisting of 64 repetitions of the sequence: input password, K, the 48-byte user
      //    key. The 48 byte user key is only used when checking the owner password or creating the owner key. If
      //    checking the user password or creating the user key, K1 is the concatenation of the input password
      //    and K. 
      const sequence = BufferSourceConverter.concat(passwordToView(params.password), k, u);
      const sequenceView = BufferSourceConverter.toUint8Array(sequence);
      const k1: Uint8Array = new Uint8Array(sequence.byteLength * 64);
      for (let i = 0; i < 64; i++) {
        k1.set(sequenceView, sequence.byteLength * i);
      }

      // b) Encrypt K1 with the AES-128 (CBC, no padding) algorithm, using the first 16 bytes of K as the key and the
      //    second 16 bytes of K as the initialization vector. The result of this encryption is E. 
      const aesKey = await params.crypto.importKey("raw", k.slice(0, 16), "AES-CBC", false, ["encrypt"]);
      e = await params.crypto.encrypt({ name: "AES-CBC", iv: BufferSourceConverter.toUint8Array(k).subarray(16, 32) }, aesKey, k1);
      e = e.slice(0, k1.byteLength); // There is padding in WebCrypto - remove unnecessary tail bytes

      // c) Taking the first 16 bytes of E as an unsigned big-endian integer, compute the remainder, modulo 3. If the
      //    result is 0, the next hash used is SHA-256, if the result is 1, the next hash used is SHA-384, if the result is 2,
      //    the next hash used is SHA-512. 
      const remainder = BufferSourceConverter.toUint8Array(e).subarray(0, 16).reduce((a, b) => a + b, 0) % 3;

      // d) Using the hash algorithm determined in step c, take the hash of E. The result is a new value of K, which
      //    will be 32, 48, or 64 bytes in length.
      switch (remainder) {
        case 0:
          k = await params.crypto.digest("SHA-256", e);
          break;
        case 1:
          k = await params.crypto.digest("SHA-384", e);
          break;
        case 2:
          k = await params.crypto.digest("SHA-512", e);
          break;
      }

      // Repeat the process (a-d) with this new value for K. Following 64 rounds (round number 0 to round
      // number 63)
      if (i < 63) {
        continue;
      }

      // Do the following, starting with round number 64:
      // e) Look at the very last byte of E. If the value of that byte (taken as an unsigned integer) is greater than the
      //    round number - 32, repeat steps (a-d) again.
      const eView = BufferSourceConverter.toUint8Array(e);
      if (eView[eView.length - 1] > i - 32) {
        continue;
      }

      // f)Repeat from steps (a-e) until the value of the last byte is ≤ (round number) - 32.
      break;
    }

    return k.slice(0, 32);
  }

  /**
   * Computing the encryption dictionary’s O-entry value (revision 4 and earlier)
   * @param owner The owner password
   */
  public static async algorithm3(params: StandardAlgorithm3Params): Promise<ArrayBuffer> {
    // This algorithm is deprecated in PDF 2.0.

    // a) Pad or truncate the owner password string
    const ownerPassword = padPassword(params.owner);

    // b) Initialize the MD5 hash function and pass the result of step (a) as input to this function.
    let hash = await params.crypto.digest(algorithms.md5, ownerPassword);
    let counter = 50;
    while (params.revision > 3 && counter--) {
      // c) (Security handlers of revision 3 or greater) Do the following 50 times
      hash = await params.crypto.digest(algorithms.md5, hash);
    }
    const hashView = BufferSourceConverter.toUint8Array(hash);

    // d) Create an RC4 file encryption key using the first n bytes of the output from the final MD5 hash,
    //    where n shall always be 5 for security handlers of revision 2 but, for security handlers of revision 3
    //    or greater, shall depend on the value of the encryption dictionary’s Length entry.
    const encKey = (params.revision >= 3)
      ? hashView.slice(0, params.length >> 3)
      : hashView.slice(0, 5);

    // e) Pad or truncate the user password string
    const userPassword = padPassword(params.user);

    // f) Encrypt the result of step (e), using an RC4 encryption function with the file encryption key 
    //    obtained instep (d).
    let checkData = await params.crypto.encrypt(algorithms.rc4, encKey as any, userPassword);

    // g) (Security handlers of revision 3 or greater) Do the following 19 times: 
    //    Take the output from the previous invocation of the RC4 function and pass it as input to a new invocation 
    //    of the function; use a file encryption key generated by taking each byte of the encryption key obtained
    //    in step (d) and performing an XOR (exclusive or) operation between that byte and the single-byte value
    //    of the iteration counter(from 1 to 19).
    if (params.revision >= 3) {
      const n = encKey.length;
      const derivedKey = new Uint8Array(n);
      for (let i = 1; i <= 19; ++i) {
        for (let j = 0; j < n; ++j) {
          derivedKey[j] = encKey[j] ^ i;
        }
        checkData = await params.crypto.encrypt(algorithms.rc4, derivedKey as any, checkData);
      }
    }

    // h) Store the output from the final invocation of the RC4 function as the value of the O entry
    //    in the encryption dictionary.
    return checkData;
  }

  /**
   * Computing the encryption dictionary’s U (user password) value (Security handlers of revision 3 or 4)
   * @param password User password
   * @returns 32-bytes check data
   */
  public static async algorithm5(params: StandardAlgorithm5Params): Promise<ArrayBuffer> {
    // a) Create a file encryption key based on the user password string, as described in 7.6.4.3.1, "Algorithm 2:
    //    Computing an encryption key in order to encrypt a document (revision 4 and earlier)".
    const encKey = BufferSourceConverter.toUint8Array(params.encryptionKey);

    const md5Data = BufferSourceConverter.concat(
      // b) Initialize the MD5 hash function and pass the 32-byte padding string shown in step (b) of 7.6.4.3.1,
      //    "Algorithm 2: Computing an encryption key in order to encrypt a document (revision 4 and earlier)" as
      //    input to this function.
      passwordPadding,
      // c) Pass the first element of the file’s file identifier array
      params.id,
    );
    const hash = await params.crypto.digest(algorithms.md5, md5Data);

    // d) Encrypt the 16-byte result of the hash, using an RC4 encryption function with the encryption key from
    //    step (a).
    let checkData = await params.crypto.encrypt(algorithms.rc4, encKey as any, hash);

    // e) Do the following 19 times: Take the output from the previous invocation of the RC4 function and pass it as
    //    input to a new invocation of the function; use a file encryption key generated by taking each byte of the
    //    original file encryption key obtained in step (a) and performing an XOR (exclusive or) operation between
    //    that byte and the single-byte value of the iteration counter (from 1 to 19). 
    const n = encKey.length;
    const derivedKey = new Uint8Array(n);
    for (let i = 1; i <= 19; ++i) {
      for (let j = 0; j < n; ++j) {
        derivedKey[j] = encKey[j] ^ i;
      }
      checkData = await params.crypto.encrypt(algorithms.rc4, derivedKey as any, checkData);
    }

    // f) Append 16 bytes of arbitrary padding to the output from the final invocation of the RC4 function and
    //    store the 32-byte result as the value of the U entry in the encryption dictionary.
    const res = new Uint8Array(32);
    res.set(new Uint8Array(checkData));

    return res;
  }

  /**
   * Computing the encryption dictionary’s U (user password) and UE (user encryption key) values
   * @param params Parameters
   */
  public static async algorithm8(params: StandardAlgorithm8Params): Promise<StandardAlgorithm8Result> {
    const { crypto } = params;
    const password = passwordToView(params.password);

    // a) Generate 16 random bytes of data using a strong random number generator. The first 8 bytes are the
    //    User Validation Salt. The second 8 bytes are the User Key Salt. Compute the 32-byte hash using algorithm
    //    2.B with an input string consisting of the UTF-8 password concatenated with the User Validation Salt. The
    //    48-byte string consisting of the 32-byte hash followed by the User Validation Salt followed by the User
    //    Key Salt is stored as the U key. 
    const random = BufferSourceConverter.toUint8Array(params.random || crypto.getRandomValues(new Uint8Array(16)));
    const userValidationSalt = random.subarray(0, 8);
    const userKeySalt = random.subarray(8);
    const hash = await this.algorithm2B({
      data: BufferSourceConverter.concat(password, userValidationSalt),
      password,
      crypto: params.crypto,
    });
    const u = BufferSourceConverter.concat(hash, userValidationSalt, userKeySalt);

    // b) Compute the 32-byte hash using algorithm 2.B with an input string consisting of the UTF-8 password
    //    concatenated with the User Key Salt. Using this hash as the key, encrypt the file encryption key using AES256 
    //    in CBC mode with no padding and an initialization vector of zero. The resulting 32-byte string is
    //    stored as the UE key. 
    const hashUE = await this.algorithm2B({
      data: BufferSourceConverter.concat(password, userKeySalt),
      password,
      crypto: params.crypto,
    });
    const key = await params.crypto.importKey("raw", hashUE, "AES-CBC", false, ["encrypt"]);
    const encryptedKey = await params.crypto.encrypt({
      name: "AES-CBC",
      iv: new ArrayBuffer(16),
    }, key, params.key);
    const ue = encryptedKey.slice(0, params.key.byteLength); // Remove AES padding

    return { u, ue };
  }

  /**
   * Computing the encryption dictionary’s O (owner password) and OE (owner encryption key) values
   * @param params Parameters
   */
  public static async algorithm9(params: StandardAlgorithm9Params): Promise<StandardAlgorithm9Result> {
    const { crypto } = params;
    const password = passwordToView(params.password);
    const u = BufferSourceConverter.toUint8Array(params.u).subarray(0, 48);

    // a) Generate 16 random bytes of data using a strong random number generator.
    const random = BufferSourceConverter.toUint8Array(params.random || crypto.getRandomValues(new Uint8Array(16)));
    //    The first 8 bytes are the Owner Validation Salt.
    const ownerValidationSalt = random.subarray(0, 8);
    //    The second 8 bytes are the Owner Key Salt. 
    const ownerKeySalt = random.subarray(8);
    //    Compute the 32-byte hash using algorithm 2.B with an input string consisting of the UTF-8 password concatenated with the Owner
    //    Validation Salt and then concatenated with the 48-byte U string as generated in Algorithm 8. 
    const hashO = await this.algorithm2B({
      data: BufferSourceConverter.concat(password, ownerValidationSalt, u),
      password,
      u,
      crypto,
    });
    //    The 48-byte string consisting of the 32-byte hash followed by the Owner Validation Salt followed by the Owner Key
    //    Salt is stored as the O key. 
    const o = BufferSourceConverter.concat(hashO, ownerValidationSalt, ownerKeySalt);

    // b) Compute the 32-byte hash using 7.6.4.3.3, "Algorithm 2.B: Computing a hash (revision 6 and later)" with
    //    an input string consisting of the UTF-8 password concatenated with the Owner Key Salt and then
    //    concatenated with the 48-byte U string as generated in 7.6.4.4.6, "Algorithm 8: Computing the encryption
    //    dictionary’s U (user password) and UE (user encryption) values (Security handlers of revision 6)". Using
    //    this hash as the key, encrypt the file encryption key using AES-256 in CBC mode with no padding and an
    //    initialization vector of zero. The resulting 32-byte string is stored as the OE key
    const hashOE = await this.algorithm2B({
      data: BufferSourceConverter.concat(password, ownerKeySalt, u),
      password,
      u,
      crypto,
    });
    const key = await crypto.importKey("raw", hashOE, algorithms.AesCBC, false, ["encrypt"]);
    const encryptedKey = await crypto.encrypt({
      name: "AES-CBC",
      iv: new ArrayBuffer(16),
    }, key, params.key);
    const oe = encryptedKey.slice(0, params.key.byteLength); // remove AES padding

    return { o, oe };
  }

  /**
   * Computing the encryption dictionary’s Perms (permissions) value (Security handlers of revision 6)
   * @param pBuffer Value from "P" PDF key (low byte first)
   * @param fileEncryptionKey File encryption key
   * @param encryptMetadata Flag from "EncryptMetadata" PDF key
   */
  public static async algorithm10(params: StandardAlgorithm10Params): Promise<ArrayBuffer> {
    // Fill a 16-byte block as follows:
    // a) Extend the permissions (contents of the P integer) to 64 bits by setting the upper 32 bits to all 1’s
    const constPart = new Uint8Array([
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      // c) Set byte 8 to the ASCII character "T" or "F" according to the EncryptMetadata Boolean.
      (params.encryptMetadata) ? 0x54 : 0x46,
      // d) Set bytes 9-11 to the ASCII characters '"a", "d", "b"
      0x61, 0x64, 0x62]);

    // b) Record the 8 bytes of permission in the bytes 0-7 of the block, low order byte first. 
    constPart.set(new Uint8Array(new Int32Array([params.permissions]).buffer)); // Set first 4 bytes as "P" value (low bytes first)

    // e)Set bytes 12-15 to 4 bytes of random data, which will be ignored. 
    const random = params.crypto.getRandomValues(new Uint8Array(4));

    // f) Encrypt the 16-byte block using AES-256 in ECB mode with an initialization vector of zero, using the file
    //    encryption key as the key. The result (16 bytes) is stored as the Perms string, and checked for validity
    //    when the file is opened.
    const key = await params.crypto.importKey("raw", params.key, { name: "AES-ECB", length: params.key.byteLength << 3 }, false, ["encrypt"]);
    const res = await params.crypto.encrypt({
      name: "AES-ECB",
      padding: false,
      iv: new ArrayBuffer(16)
    } as Algorithm, key, BufferSourceConverter.concat(constPart.buffer, random));

    return res.slice(0, 16);
  }

  /**
   * Authenticating the user password (Security handlers of revision 6) 
   * @param params Parameters
   */
  public static async algorithm11(params: StandardAlgorithm11Params): Promise<boolean> {
    // a) Test the password against the user key by computing the 32-byte hash using 7.6.4.3.3, "Algorithm 2.B:
    //     Computing a hash (revision 6 and later)" with an input string consisting of the UTF-8 password
    //     concatenated with the 8 bytes of User Validation Salt (see 7.6.4.4.6, "Algorithm 8: Computing the
    //     encryption dictionary’s U (user password) and UE (user encryption) values (Security handlers of revision
    //     6)"). If the 32- byte result matches the first 32 bytes of the U string, this is the user password. 
    const passwordView = passwordToView(params.password);
    const uView = BufferSourceConverter.toUint8Array(params.u);
    const userPassword = uView.subarray(0, 32);
    const userValidationSalt = uView.subarray(32, 40);

    const hash = await this.algorithm2B({
      data: BufferSourceConverter.concat(passwordView, userValidationSalt),
      password: passwordView,
      crypto: params.crypto,
    });

    return BufferSourceConverter.isEqual(hash, userPassword);
  }

  /**
   * Authenticating the owner password (Security handlers of revision 6) 
   * @param params Parameters
   */
  public static async algorithm12(params: StandardAlgorithm12Params): Promise<boolean> {
    // a) Test the password against the owner key by computing the 32-byte hash using algorithm 2.B with an
    //    input string consisting of the UTF-8 password concatenated with the 8 bytes of Owner Validation Salt and
    //    the 48 byte U string. If the 32 byte result matches the first 32 bytes of the O string, this is the owner
    //    password. 
    const passwordView = passwordToView(params.password);
    const uView = BufferSourceConverter.toUint8Array(params.u).subarray(0, 48);
    const oView = BufferSourceConverter.toUint8Array(params.o).subarray(0, 48);
    const ownerValidationSalt = oView.subarray(32, 40);
    const hash = await this.algorithm2B({
      data: BufferSourceConverter.concat(passwordView, ownerValidationSalt, uView),
      password: passwordView,
      u: uView,
      crypto: params.crypto,
    });

    return BufferSourceConverter.isEqual(hash, oView.subarray(0, 32));
  }
}
