export const staticDataFF = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
export const staticData = new Uint8Array([0x73, 0x41, 0x6C, 0x54]);
export const algorithms = {
  md5: { name: "MD5" },
  rc4: { name: "RC4" },
  sha256: { name: "SHA-256" },
  sha384: { name: "SHA-384" },
  sha512: { name: "SHA-512" },
  AesCBC: { name: "AES-CBC" },
  AesECB: { name: "AES-ECB" }
};

export interface globalParametersCryptFilter {
  stm: {
    key: ArrayBuffer;
    keyType: string;
  };
  str: {
    key: ArrayBuffer;
    keyType: string;
  };
}

export interface clientSideParametersPublicKey {
  keys: CryptoKey[];
  certificates: any[];
  algorithm: string;
  encrypt?: {
    seed: ArrayBuffer;
    recipientsBuffer: ArrayBuffer;
  };
}
