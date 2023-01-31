import * as pkijs from "pkijs";
import { BufferSourceConverter } from "pvtsutils";

const id_SHA3_256 = "2.16.840.1.101.3.4.2.8";
const id_SHA3_384 = "2.16.840.1.101.3.4.2.9";
const id_SHA3_512 = "2.16.840.1.101.3.4.2.10";
const name_SHA3_256 = "SHA3-256";
const name_SHA3_384 = "SHA3-384";
const name_SHA3_512 = "SHA3-512";

const id_ECDSA_with_SHA3_256 = "2.16.840.1.101.3.4.3.10";
const id_ECDSA_with_SHA3_384 = "2.16.840.1.101.3.4.3.11";
const id_ECDSA_with_SHA3_512 = "2.16.840.1.101.3.4.3.12";

function md5(data: ArrayBuffer | Uint8Array, offset: number, length: number): Promise<ArrayBuffer> {
  const r = new Uint8Array([
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]);

  const k = new Int32Array([
    -680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426,
    -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162,
    1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632,
    643717713, -373897302, -701558691, 38016083, -660478335, -405537848,
    568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784,
    1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556,
    -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222,
    -722521979, 76029189, -640364487, -421815835, 530742520, -995338651,
    -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606,
    -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649,
    -145523070, -1120210379, 718787259, -343485551]);

  let h0 = 1732584193;
  let h1 = -271733879;
  let h2 = -1732584194;
  let h3 = 271733878;

  // pre-processing
  if (data instanceof ArrayBuffer) {
    length = data.byteLength;
    data = new Uint8Array(data);
  }

  const paddedLength = (length + 72) & ~63; // data + 9 extra bytes
  const padded = new Uint8Array(paddedLength);

  let i;
  let j;

  for (i = 0; i < length; ++i)
    padded[i] = (data as Uint8Array)[offset++];

  padded[i++] = 0x80;
  const n = paddedLength - 8;

  while (i < n)
    padded[i++] = 0;

  padded[i++] = (length << 3) & 0xFF;
  padded[i++] = (length >> 5) & 0xFF;
  padded[i++] = (length >> 13) & 0xFF;
  padded[i++] = (length >> 21) & 0xFF;
  padded[i++] = (length >>> 29) & 0xFF;
  padded[i++] = 0;
  padded[i++] = 0;
  padded[i++] = 0;

  // chunking
  // TODO ArrayBuffer ?
  const w = new Int32Array(16);
  for (i = 0; i < paddedLength;) {
    for (j = 0; j < 16; ++j, i += 4) {
      w[j] = (padded[i] | (padded[i + 1] << 8) |
        (padded[i + 2] << 16) | (padded[i + 3] << 24));
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let f;
    let g;

    for (j = 0; j < 64; ++j) {
      switch (true) {
        case (j < 16):
          f = (b & c) | ((~b) & d);
          g = j;
          break;
        case (j < 32):
          f = (d & b) | ((~d) & c);
          g = (5 * j + 1) & 15;
          break;
        case (j < 48):
          f = b ^ c ^ d;
          g = (3 * j + 5) & 15;
          break;
        default:
          f = c ^ (b | (~d));
          g = (7 * j) & 15;
      }

      const tmp = d;
      const rotateArg = (a + f + k[j] + w[g]) | 0;
      const rotate = r[j];

      d = c;
      c = b;
      b = (b + ((rotateArg << rotate) | (rotateArg >>> (32 - rotate)))) | 0;
      a = tmp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }

  return Promise.resolve((new Uint8Array([
    h0 & 0xFF, (h0 >> 8) & 0xFF, (h0 >> 16) & 0xFF, (h0 >>> 24) & 0xFF,
    h1 & 0xFF, (h1 >> 8) & 0xFF, (h1 >> 16) & 0xFF, (h1 >>> 24) & 0xFF,
    h2 & 0xFF, (h2 >> 8) & 0xFF, (h2 >> 16) & 0xFF, (h2 >>> 24) & 0xFF,
    h3 & 0xFF, (h3 >> 8) & 0xFF, (h3 >> 16) & 0xFF, (h3 >>> 24) & 0xFF
  ])).buffer);
}

/**
 *
 * @param key secret key for encryption/decryption
 * @param data string to be encrypted/decrypted
 * @return Promise
 */
function rc4(key: Uint8Array, data: Uint8Array): Promise<ArrayBuffer> {
  if ((key instanceof Uint8Array) === false)
    key = new Uint8Array(key);

  if ((data instanceof Uint8Array) === false)
    data = new Uint8Array(data);

  const s = new Uint8Array(256);
  let j = 0;
  let x;
  const res = new Uint8Array(data.length);

  for (let i = 0; i < 256; i++)
    s[i] = i;

  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
  }

  let i = 0;
  j = 0;

  for (let y = 0; y < data.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
    res[y] = data[y] ^ s[(s[i] + s[j]) % 256];
  }

  return Promise.resolve(res.buffer);
}

/**
 * Making decryption for non-padded data
 * @param crypto WebCrypto Subtle
 * @param algorithm Used algorithm description
 * @param key WebCrypto key. WARNING: in order to process correctly the key must be created with [encrypt, decrypt] usages
 * @param data Data to decrypt (non-padded)
 */
async function decryptWithPadding(crypto: SubtleCrypto, algorithm: AesCtrParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer> {
  const moduloBlock = 16 - (data.byteLength % 16);

  // Calculate absent tail for encrypted content
  const iv = BufferSourceConverter.toUint8Array(data).subarray(data.byteLength - 16);
  const pad = new Uint8Array(moduloBlock).fill(moduloBlock);
  const result = await crypto.encrypt({
    name: algorithm.name,
    length: algorithm.length,
    iv,
  }, key, pad);

  // Append encrypted tail and decrypt initial data
  const dataWithPad = BufferSourceConverter.concat(data, result);

  return crypto.decrypt(algorithm, key, dataWithPad);
}

export class PDFCryptoEngine extends pkijs.CryptoEngine {

  public override getOIDByAlgorithm(algorithm: Algorithm, safety?: boolean, target?: string): string {
    switch (algorithm.name.toLowerCase()) {
      case name_SHA3_256.toLowerCase():
        return id_SHA3_256;
      case name_SHA3_384.toLowerCase():
        return id_SHA3_384;
      case name_SHA3_512.toLowerCase():
        return id_SHA3_512;
      case "shake128":
        return "2.16.840.1.101.3.4.2.11";
      case "shake256":
        return "2.16.840.1.101.3.4.2.12";
      case "ecdsa":
        if ("namedCurve" in algorithm) {
          switch ((algorithm as any).namedCurve.toLowerCase()) {
            case "brainpoolP256r1":
              return "1.3.36.3.3.2.8.1.1.7";
            case "brainpoolP384r1":
              return "1.3.36.3.3.2.8.1.1.11";
            case "brainpoolP512r1":
              return "1.3.36.3.3.2.8.1.1.13";
          }
        }

        return super.getOIDByAlgorithm(algorithm, safety, target);

      case "eddsa":
        if ("namedCurve" in algorithm) {
          switch ((algorithm as any).namedCurve.toLowerCase()) {
            case "ed25519":
              return "1.3.101.112";
            case "ed448":
              return "1.3.101.113";
          }
        }

        return super.getOIDByAlgorithm(algorithm, safety, target);
    }

    return super.getOIDByAlgorithm(algorithm, safety, target);
  }

  public override async getSignatureParameters(privateKey: CryptoKey, hashAlgorithm = "SHA-1"): Promise<pkijs.CryptoEngineSignatureParams> {
    const signatureAlgorithm = new pkijs.AlgorithmIdentifier();

    //region Get a "default parameters" for current algorithm
    const parameters = this.getAlgorithmParameters(privateKey.algorithm.name, "sign");
    parameters.algorithm = {
      ...parameters.algorithm,
      hash: {
        name: hashAlgorithm,
      }
    } as EcdsaParams;
    //endregion

    //region Fill internal structures base on "privateKey" and "hashAlgorithm"
    switch (privateKey.algorithm.name.toUpperCase()) {
      case "ECDSA":
        switch (hashAlgorithm.toUpperCase()) {
          case name_SHA3_256:
            signatureAlgorithm.algorithmId = id_ECDSA_with_SHA3_256;
            break;
          case name_SHA3_384:
            signatureAlgorithm.algorithmId = id_ECDSA_with_SHA3_384;
            break;
          case name_SHA3_512:
            signatureAlgorithm.algorithmId = id_ECDSA_with_SHA3_512;
            break;
          default:
            return super.getSignatureParameters(privateKey, hashAlgorithm);
        }
        break;
      case "EDDSA":
        signatureAlgorithm.algorithmId = this.getOIDByAlgorithm(privateKey.algorithm);
        break;
      default:
        return super.getSignatureParameters(privateKey, hashAlgorithm);
    }
    //endregion

    return {
      signatureAlgorithm,
      parameters
    };
  }

  public override getAlgorithmByOID(oid: string): Algorithm {
    const alg = super.getAlgorithmByOID(oid) as Algorithm;

    if (!alg || !alg.name) {
      switch (oid) {
        case "1.3.36.3.3.2.8.1.1.7": // brainpoolP256r1 
          return { name: "ECDSA", namedCurve: "brainpoolP256r1" } as Algorithm;
        case "1.3.36.3.3.2.8.1.1.11": // brainpoolP384r1 
          return { name: "ECDSA", namedCurve: "brainpoolP384r1" } as Algorithm;
        case "1.3.36.3.3.2.8.1.1.13": // brainpoolP512r1 
          return { name: "ECDSA", namedCurve: "brainpoolP512r1" } as Algorithm;
        case "1.3.101.112": // curveEd25519 
          return { name: "EdDSA", namedCurve: "Ed25519" } as Algorithm;
        case "1.3.101.113": // curveEd448 
          return { name: "EdDSA", namedCurve: "Ed448" } as Algorithm;
        case "2.16.840.1.101.3.4.2.11": // shake128 
          return { name: "shake128" } as Algorithm;
        case "2.16.840.1.101.3.4.2.12": // shake256 
          return { name: "shake256" } as Algorithm;
        case id_SHA3_256:
          return { name: name_SHA3_256 };
        case id_SHA3_384:
          return { name: name_SHA3_384 };
        case id_SHA3_512:
          return { name: name_SHA3_512 };
        case id_ECDSA_with_SHA3_256:
          return { name: "ECDSA", hash: name_SHA3_256 } as Algorithm;
        case id_ECDSA_with_SHA3_384:
          return { name: "ECDSA", hash: name_SHA3_384 } as Algorithm;
        case id_ECDSA_with_SHA3_512:
          return { name: "ECDSA", hash: name_SHA3_512 } as Algorithm;
      }
    }

    return alg;
  }

  public override async getPublicKey(publicKeyInfo: pkijs.PublicKeyInfo, signatureAlgorithm: pkijs.AlgorithmIdentifier, parameters?: pkijs.CryptoEnginePublicKeyParams): Promise<CryptoKey> {
    parameters ??= this.fillPublicKeyParameters(publicKeyInfo, signatureAlgorithm);

    const publicKeyInfoSchema = publicKeyInfo.toSchema();
    const publicKeyInfoBuffer = publicKeyInfoSchema.toBER(false);
    const publicKeyInfoView = new Uint8Array(publicKeyInfoBuffer);

    try {
      switch ((parameters.algorithm as any).algorithm.name.toLowerCase()) {
        case "ecdsa":
          {
            const algorithm: EcKeyImportParams = {
              name: "ECDSA",
              namedCurve: "P-256",
            };
            const namedCurve = publicKeyInfo.algorithm.algorithmParams.valueBlock.toString();
            switch (namedCurve) {
              case "1.2.840.10045.3.1.7":
                algorithm.namedCurve = "P-256";
                break;
              case "1.3.36.3.3.2.8.1.1.7":
                algorithm.namedCurve = "brainpoolP256r1";
                break;
              case "1.3.36.3.3.2.8.1.1.11":
                algorithm.namedCurve = "brainpoolP384r1";
                break;
              case "1.3.132.0.34":
                algorithm.namedCurve = "P-384";
                break;
              case "1.3.36.3.3.2.8.1.1.13":
                algorithm.namedCurve = "brainpoolP512r1";
                break;
              case "1.3.132.0.35":
                algorithm.namedCurve = "P-521";
                break;
            }

            return this.subtle.importKey("spki", publicKeyInfoView, algorithm, true, ["verify"]);
          }
        case "eddsa":
          {
            const algorithm = this.getAlgorithmByOID(publicKeyInfo.algorithm.algorithmId);

            return this.subtle.importKey("spki", publicKeyInfoView, algorithm, true, ["verify"]);
          }
      }
    } catch (e) {
      // nothing
    }

    return super.getPublicKey(publicKeyInfo, signatureAlgorithm, parameters);
  }

  public override getAlgorithmParameters(algName: string, usage: pkijs.CryptoEngineAlgorithmOperation): pkijs.CryptoEngineAlgorithmParams {
    const params = super.getAlgorithmParameters(algName, usage) || {};

    if (!(params.algorithm as any).name) {
      switch (algName.toLowerCase()) {
        case "eddsa": {
          params.algorithm = {
            name: "EdDSA",
          };
          switch (usage.toLowerCase()) {
            case "importkey":
              params.usages = ["verify"];
              break;
            case "sign":
              params.usages = ["sign"];
              break;
            case "verify":
              params.usages = ["verify"];
              break;
          }
        }
      }
    }

    return params;
  }

  public override async digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer> {
    const buf = BufferSourceConverter.toArrayBuffer(data);

    if (algorithm instanceof Object) {
      if (algorithm.name.toLowerCase() === "md5")
        return md5(buf, 0, buf.byteLength);
    } else {
      if (algorithm.toLowerCase() === "md5")
        return md5(buf, 0, buf.byteLength);
    }

    return super.digest(algorithm, buf);
  }

  public override async generateKey(algorithm: RsaHashedKeyGenParams | EcKeyGenParams, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair>;
  public override async generateKey(algorithm: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  public override async generateKey(algorithm: globalThis.AlgorithmIdentifier, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair | CryptoKey>;
  public override async generateKey(algorithm: globalThis.AlgorithmIdentifier, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair | CryptoKey> {
    if (typeof algorithm !== "string" && algorithm.name.toLowerCase() === "rc4") {
      const key = new Uint8Array((algorithm as any).length);
      pkijs.getRandomValues(key);

      return key.buffer as unknown as CryptoKey; // TODO Change to CryptoKey
    }

    return super.generateKey(algorithm, extractable, keyUsages);
  }

  public override async encrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer> {
    if (typeof algorithm === "string") {
      // convert String algorithm to Algorithm
      algorithm = { name: algorithm };
    }

    if (algorithm.name.toLowerCase() === "rc4") {
      return rc4(key as any, BufferSourceConverter.toUint8Array(data));
    }

    return super.encrypt(algorithm, key, data);
  }

  public override decrypt(...args: any[]): Promise<ArrayBuffer> {
    // eslint-disable-next-line prefer-const
    let [alg, key, data] = args;

    if (typeof alg === "string") {
      // convert String algorithm to Algorithm
      alg = { name: alg };
    }

    switch (alg.name.toLowerCase()) {
      case "rc4":
        return rc4(key, data);
      case "aes-cbc":
      case "aes-ecb":
        {
          if ("pad" in alg)
            return decryptWithPadding(this.subtle, alg, key, data);

          break;
        }
      default:
    }

    return (super.decrypt as any)(...args);
  }

}
