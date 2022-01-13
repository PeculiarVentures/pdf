export interface Time {
  type: number;
  value: Date;
}

export interface AsnObject {
  toBER(): ArrayBuffer;
}

export interface PkiObject {
  toSchema(): AsnObject;
}

export interface Extension extends PkiObject {
  critical: boolean;
  extnID: string;
  extnValue: any;
  parsedValue?: any;
}

export interface Certificate extends PkiObject {
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

  verify(issuer?: Certificate): Promise<boolean>;
}

export interface Attribute extends PkiObject {
  type: string;
  values: any[];
}

export interface CertificateRevocationList extends PkiObject {
  isCertificateRevoked(cert: Certificate): boolean;
}

export enum OCSPStatus {
  good = 0,
  revoked = 1,
  unknown = 2,
}

export interface OCSPCertificateStatus {
  isForCertificate: boolean;
  status: OCSPStatus;
}

export interface BasicOCSPResponse extends PkiObject {
  getCertificateStatus(cert: Certificate, issuer: Certificate): Promise<OCSPCertificateStatus>
}

export interface OCSPResponse extends PkiObject {
  responseBytes: {
    responseType: string;
    response: any;
  }
}
