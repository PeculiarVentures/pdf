import type { X509Certificate, X509Certificates } from "@peculiar/x509";
import { type CRL } from "./CRL";
import { type OCSP } from "./OCSP";

export interface IResult<T> {
  target: ICertificateStorageHandler;
  result: T;
  error?: Error;
  /**
   * Prevents further propagation of the current event
   */
  stopPropagation?: boolean;
}

export interface IsTrustedResult extends IResult<boolean> {
  source?: string;
}

export type RevocationType = "crl" | "ocsp";

export interface ICertificateStorageHandler {

  parent: ICertificateStorageHandler | null;

  certificates: X509Certificates;
  crls: CRL[];
  ocsps: OCSP[];

  /**
   * Returns certificate that has the given serial number and issuer name
   * @param serialNumber DER encoded X509 serial number
   * @param issuer DER encoded X509 name
   * @returns X509 certificate or null
   */
  findCertificate(serialNumber: BufferSource, issuer: BufferSource): Promise<X509Certificate | null>;

  /**
   * Returns certificate that has the given subject public key identifier
   * @param spki Subject public key identifier
   * @returns X509 certificate or null
   */
  findCertificate(spki: BufferSource): Promise<X509Certificate | null>;

  findRevocation(type: "crl", cert: X509Certificate): Promise<IResult<CRL | null>>;
  findRevocation(type: "ocsp", cert: X509Certificate): Promise<IResult<OCSP | null>>;
  findRevocation(type: RevocationType, cert: X509Certificate): Promise<IResult<CRL | OCSP | null>>;
  fetchRevocation(type: "crl", cert: X509Certificate): Promise<IResult<CRL | null>>;
  fetchRevocation(type: "ocsp", cert: X509Certificate): Promise<IResult<OCSP | null>>;
  fetchRevocation(type: RevocationType, cert: X509Certificate): Promise<IResult<CRL | OCSP | null>>;

  /**
   * Returns issuer certificate
   * @param cert Issued certificate
   * @returns Issuer certificate or null
   */
  findIssuer(cert: X509Certificate): Promise<X509Certificate | null>;

  /**
   * Returns true if certificate is trusted
   */
  isTrusted(cert: X509Certificate): Promise<IsTrustedResult>;
}

export interface ICertificateStorage {
  certificateHandler: ICertificateStorageHandler;
}
