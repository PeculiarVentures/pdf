import { X509Certificate } from "@peculiar/x509";
import { Convert } from "pvtsutils";
import * as pkijs from "pkijs";

import { AsnEncoded } from "./AsnEncoded";

/**
 * Represents a certificate identifier as defined in RFC 5035.
 * This class is used to uniquely identify X.509 certificates using a hash of the issuer name,
 * issuer public key, and the certificate serial number.
 */
export class CertificateID extends AsnEncoded<pkijs.CertID> {
  /** Default empty view for ASN.1 encoding */
  public static DEFAULT_VIEW = new Uint8Array(0);

  /**
   * Creates a new CertificateID instance for a given certificate and its issuer
   * @param algorithm - Hash algorithm to use for certificate identification (string or algorithm object)
   * @param cert - The certificate to create the identifier for
   * @param issuer - The issuer certificate
   * @returns A new CertificateID instance
   * @throws Error if the certificate was not signed by the specified issuer
   */
  public static async create(
    algorithm: AlgorithmIdentifier,
    cert: X509Certificate,
    issuer: X509Certificate
  ): Promise<CertificateID> {
    const pkiCertId = new pkijs.CertID();

    const engine = pkijs.getCrypto(true);

    // check if cert was signed by issuer
    const ok = await cert.verify(
      {
        signatureOnly: true,
        publicKey: issuer
      },
      engine.crypto
    );
    if (!ok) {
      throw new Error("Certificate was not signed by issuer");
    }

    await pkiCertId.createForCertificate(PKIUtils.x509ToCert(cert), {
      hashAlgorithm: typeof algorithm === "string" ? algorithm : algorithm.name,
      issuerCertificate: PKIUtils.x509ToCert(issuer)
    });

    const res = new CertificateID();
    res.fromSchema(pkiCertId);

    return res;
  }

  private _hashAlgorithm?: Algorithm;

  /**
   * Gets the hash algorithm used for certificate identification
   */
  public get hashAlgorithm(): Algorithm {
    if (!this._hashAlgorithm) {
      const raw = this.asn.hashAlgorithm.toSchema().toBER();
      this._hashAlgorithm = AlgorithmFactory.fromBER(raw);
    }
    return this._hashAlgorithm;
  }

  /**
   * Gets the hash of the issuer's subject name
   */
  public get issuerNameHash(): ArrayBuffer {
    return this.asn.issuerNameHash.valueBlock.valueHex;
  }

  /**
   * Gets the hash of the issuer's public key
   */
  public get issuerKeyHash(): ArrayBuffer {
    return this.asn.issuerKeyHash.valueBlock.valueHex;
  }

  /**
   * Gets the certificate serial number as a hexadecimal string
   */
  public get serialNumber(): string {
    return Convert.ToHex(this.asn.serialNumber.valueBlock.valueHex);
  }

  /**
   * Converts an ASN.1 schema to a CertID object
   * @param schema - The schema to convert
   * @returns A new CertID instance
   * @throws Error if the schema is invalid
   */
  protected onFromSchema(schema: pkijs.SchemaType): pkijs.CertID {
    if (schema instanceof pkijs.CertID) {
      return schema;
    }

    return new pkijs.CertID({ schema });
  }

  /**
   * Compares this CertificateID with another for equality
   * @param certId - The CertificateID to compare with
   * @returns `true` if the CertificateIDs are equal, `false` otherwise
   */
  public equal(certId: CertificateID): boolean {
    return this.asn.isEqual(certId.asn);
  }
}

import { PKIUtils } from "./PKIUtils";
import { AlgorithmFactory } from "./AlgorithmFactory";
