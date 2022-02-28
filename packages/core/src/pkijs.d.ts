declare module "pkijs" {

  interface AlgorithmParameters {
    algorithm: Algorithm; 
    usages: KeyUsage[];
  }
  export class CryptoEngine {
    constructor(parameters: any);
    subtle: SubtleCrypto;
    decrypt(...args: any[]): Promise<ArrayBuffer>;
    digest(...args: any[]): Promise<ArrayBuffer>;
    encrypt(...args: any[]): Promise<ArrayBuffer>;
    generateKey(...args: any[]): Promise<CryptoKey | CryptoKeyPair | ArrayBuffer>;
    getAlgorithmByOID(oid): Algorithm;
    getAlgorithmParameters(algName: string, usage: keyof SubtleCrypto): AlgorithmParameters;
    getPublicKey(publicKeyInfo: any, signatureAlgorithm: Algorithm, parameters?: any): Promise<CryptoKey>;
    fillPublicKeyParameters(publicKeyInfo: any, signatureAlgorithm: Algorithm): AlgorithmParameters;
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

  type Certificate = any;
  const Certificate = any;
  type CertID = any;
  const CertID = any;
  type CertificateChainValidationEngine = any;
  const CertificateChainValidationEngine = any;
  type ContentInfo = any;
  const ContentInfo = any;
  type CertificateRevocationList = any;
  const CertificateRevocationList = any;
  type OCSPResponse = any;
  const OCSPResponse = any;
  type ResponseBytes = any;
  const ResponseBytes = any;
  type BasicOCSPResponse = any;
  const BasicOCSPResponse = any;
  type SignedData = any;
  const SignedData = any;
  type EncapsulatedContentInfo = any;
  const EncapsulatedContentInfo = any;
  type IssuerAndSerialNumber = any;
  const IssuerAndSerialNumber = any;
  type SignedAndUnsignedAttributes = any;
  const SignedAndUnsignedAttributes = any;
  type AlgorithmIdentifier = any;
  const AlgorithmIdentifier = any;
  type SignerInfo = any;
  const SignerInfo = any;
  type Attribute = any;
  const Attribute = any;
  type EnvelopedData = any;
  const EnvelopedData = any;

  function getEngine(): any;
  function getCrypto(): any;

}




