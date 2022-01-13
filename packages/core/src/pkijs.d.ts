declare module "pkijs" {
  export class CryptoEngine {
    constructor(parameters: any);
    subtle: SubtleCrypto;
    decrypt(...args: any[]): Promise<ArrayBuffer>;
    digest(...args: any[]): Promise<ArrayBuffer>;
    encrypt(...args: any[]): Promise<ArrayBuffer>;
    generateKey(...args: any[]): Promise<CryptoKey | CryptoKeyPair | ArrayBuffer>;
  }

  export class Time {
    type: number;
    value: Date;
  }
  export class Extension {
    critical: boolean;
    extnID: string;
    extnValue: any;
    parsedValue?: any;
  }

  export interface Certificate {
    tbs: ArrayBuffer;
    version: number;
    serialNumber: any;
    issuer: any;
    subject: any;
    notBefore: Time;
    notAfter: Time;
    extensions: Extension[];
    subjectPublicKeyInfo: any;
    signatureAlgorithm: any;
    signature: any;
  }

  function getRandomValues<T extends Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | null>(array: T): T;

}




