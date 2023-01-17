import { ICryptoEngine } from "pkijs";
import { BufferSourceConverter, Convert } from "pvtsutils";
import { algorithms } from "./Constants";

export type Password = string | BufferSource;

export interface StandardAlgorithm2Params {
  password: Password;
  ownerValue: BufferSource;
  permissions: number;
  id: BufferSource;
  revision: number;
  encryptMetadata: boolean;
  length: number;
  crypto: ICryptoEngine;
}

export interface StandardAlgorithm5Params {
  /**
   * Encryption key based on the user password string and derived from algorithm2
   */
  encryptionKey: BufferSource;
  revision: number;
  id: BufferSource;
  crypto: ICryptoEngine;
}

export interface StandardAlgorithm3Params {
  owner: Password;
  user: Password;
  length: number;
  revision: number;
  crypto: ICryptoEngine;
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
function padPassword(password: Password = new Uint8Array(0)): ArrayBuffer {
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

/**
 * Implements Password algorithms
 */
export class StandardEncryptionAlgorithm {

  /**
   * Computing a file encryption key in order to encrypt a document (revision 4 and earlier)
   * @param password Password
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

}
