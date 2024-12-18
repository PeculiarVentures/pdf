import { AsnConvert, OctetString } from "@peculiar/asn1-schema";
import {
  CertID,
  id_pkix_ocsp_nonce,
  OCSPRequest,
  OCSPResponse,
  OCSPResponseStatus,
  Request,
  TBSRequest
} from "@peculiar/asn1-ocsp";
import {
  id_ce_cRLDistributionPoints,
  CRLDistributionPoints,
  id_pe_authorityInfoAccess,
  AuthorityInfoAccessSyntax,
  id_ad_ocsp,
  Extension
} from "@peculiar/asn1-x509";
import {
  SubjectKeyIdentifierExtension,
  X509Certificate,
  X509Certificates
} from "@peculiar/x509";
import { isEqualBuffer } from "pvutils";
import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import * as pkijs from "pkijs";

export class DefaultCertificateStorageHandler
  implements ICertificateStorageHandler
{
  public parent: ICertificateStorageHandler | null = null;

  public static async getSKI(cert: X509Certificate): Promise<ArrayBuffer> {
    const skiExt = cert.getExtension(SubjectKeyIdentifierExtension);
    if (skiExt) {
      return Convert.FromHex(skiExt.keyId);
    }
    // compute SHA-1 digest from certificate's public key
    const crypto = pkijs.getCrypto(true).crypto;

    return cert.publicKey.getKeyIdentifier(crypto);
  }

  private static isEqualGeneralNamesAndRDNs(
    generalNames: pkijs.GeneralName[],
    rdn: pkijs.RelativeDistinguishedNames
  ): boolean {
    return (
      generalNames.length === 1 &&
      generalNames[0].type === 4 &&
      generalNames[0].value instanceof pkijs.RelativeDistinguishedNames &&
      rdn.isEqual(generalNames[0].value)
    );
  }

  public static async isIssuerCertificate(
    leaf: X509Certificate,
    issuer: X509Certificate
  ): Promise<boolean> {
    // leaf certificate's issuer name must be equal to issuer's subject name
    if (leaf.issuer !== issuer.subject) {
      return false;
    }

    const akiExt = PKIUtils.findExtension(
      PKIUtils.x509ToCert(leaf),
      PKIUtils.AUTHORITY_KEY_IDENTIFIER
    );
    if (akiExt) {
      const issuerSKI = await DefaultCertificateStorageHandler.getSKI(issuer);
      if ("keyIdentifier" in akiExt.parsedValue) {
        if (
          !isEqualBuffer(
            akiExt.parsedValue.keyIdentifier.valueBlock.valueHex,
            issuerSKI
          )
        ) {
          return false;
        }
      } else if (
        "authorityCertIssuer" in akiExt.parsedValue &&
        "authorityCertSerialNumber" in akiExt.parsedValue
      ) {
        const pkiIssuer = PKIUtils.x509ToCert(issuer);
        const { authorityCertIssuer, authorityCertSerialNumber } =
          akiExt.parsedValue;
        if (
          !(
            DefaultCertificateStorageHandler.isEqualGeneralNamesAndRDNs(
              authorityCertIssuer,
              pkiIssuer.issuer
            ) && pkiIssuer.serialNumber.isEqual(authorityCertSerialNumber)
          )
        ) {
          return false;
        }
      }
    }

    try {
      const res = await leaf.verify({
        publicKey: issuer,
        signatureOnly: true
      });

      return res;
    } catch {
      return false;
    }
  }

  public certificates = new X509Certificates();
  public crls: CRL[] = [];
  public ocsps: OCSP[] = [];

  public findCertificate(
    serialNumber: BufferSource,
    issuer: BufferSource
  ): Promise<X509Certificate | null>;
  public findCertificate(spki: BufferSource): Promise<X509Certificate | null>;
  // @internal
  public findCertificate(
    serialNumber: BufferSource,
    issuer?: BufferSource
  ): Promise<X509Certificate | null>;
  public async findCertificate(
    serialNumber: BufferSource,
    issuer?: BufferSource
  ): Promise<X509Certificate | null> {
    if (this.parent) {
      const cert = await this.parent.findCertificate(serialNumber, issuer);
      if (cert) {
        return cert;
      }
    }

    for (const cert of this.certificates) {
      const ok = await this.matchCertificate(cert, serialNumber, issuer);
      if (ok) {
        return cert;
      }
    }

    return null;
  }

  /**
   * Check if the certificate matches the given serial number and issuer name.
   * @param cert - The certificate to check.
   * @param serialNumber - The serial number to check.
   * @param issuer - The issuer name to check.
   * @returns Returns `true` if the certificate matches the given serial number and issuer name, otherwise `false`.
   */
  public matchCertificate(
    cert: X509Certificate,
    serialNumber: BufferSource,
    issuer: BufferSource
  ): Promise<boolean>;
  /**
   * Check if the certificate matches the given subject public key identifier.
   * @param cert - The certificate to check.
   * @param spki - The subject public key identifier to check.
   * @returns Returns `true` if the certificate matches the given subject public key identifier, otherwise `false`.
   */
  public matchCertificate(
    cert: X509Certificate,
    spki: BufferSource
  ): Promise<boolean>;
  // @internal
  public matchCertificate(
    cert: X509Certificate,
    serialNumber: BufferSource,
    issuer?: BufferSource
  ): Promise<boolean>;
  public async matchCertificate(
    cert: X509Certificate,
    serialNumber: BufferSource,
    issuer?: BufferSource
  ): Promise<boolean> {
    if (serialNumber && issuer) {
      // serial number and issuer
      serialNumber = BufferSourceConverter.toArrayBuffer(serialNumber);
      issuer = BufferSourceConverter.toArrayBuffer(issuer);

      const pkiCert = PKIUtils.x509ToCert(cert);
      if (
        isEqualBuffer(
          pkiCert.serialNumber.valueBeforeDecodeView,
          serialNumber
        ) &&
        isEqualBuffer(pkiCert.issuer.valueBeforeDecode, issuer)
      ) {
        return true;
      }
    } else {
      // spki
      serialNumber = BufferSourceConverter.toArrayBuffer(serialNumber);
      const ski = await DefaultCertificateStorageHandler.getSKI(cert);

      if (isEqualBuffer(ski, serialNumber)) {
        return true;
      }
    }

    return false;
  }

  public async findIssuer(
    cert: X509Certificate
  ): Promise<X509Certificate | null> {
    let issuerCert = await this.parent?.findIssuer(cert);
    if (issuerCert) {
      return issuerCert;
    }

    // Self-signed certificate
    if (await cert.isSelfSigned()) {
      issuerCert = cert;
    } else {
      for (const item of this.certificates) {
        const isIssuer =
          await DefaultCertificateStorageHandler.isIssuerCertificate(
            cert,
            item
          );
        if (isIssuer) {
          issuerCert = item;
          break;
        }
      }
    }

    return issuerCert || null;
  }

  public async isTrusted(cert: X509Certificate): Promise<IsTrustedResult> {
    if (this.parent) {
      const trusted = await this.parent.isTrusted(cert);
      if (trusted) {
        return trusted;
      }
    }
    return { target: this, result: false };
  }

  public findRevocation(
    type: "crl",
    cert: X509Certificate
  ): Promise<IResult<CRL | null>>;
  public findRevocation(
    type: "ocsp",
    cert: X509Certificate
  ): Promise<IResult<OCSP | null>>;
  public async findRevocation(
    type: RevocationType,
    cert: X509Certificate
  ): Promise<IResult<CRL | OCSP | null>> {
    let res;
    switch (type) {
      case "crl":
        res = await this.findCRL(cert);
        break;
      case "ocsp":
        res = await this.findOCSP(cert);
        break;
      default:
        throw new Error("Unknown type of the revocation item");
    }

    if (!(res && res.result) && this.parent) {
      return this.parent.findRevocation(type, cert);
    }

    return res;
  }

  protected async findCRL(cert: X509Certificate): Promise<IResult<CRL | null>> {
    // Looking for the crl in internal items
    for (const crl of this.crls) {
      const issuer = await this.findIssuer(cert);
      if (issuer && issuer.subject === crl.issuer) {
        const ok = await crl.verify(issuer);
        if (ok) {
          return { result: crl, target: this };
        }
      }
    }

    return { result: null, target: this };
  }

  protected async fetchCRL(cert: X509Certificate): Promise<IResult<CRL | null>>;
  protected async fetchCRL(uri: string): Promise<IResult<CRL | null>>;
  protected async fetchCRL(
    uriOrCert: X509Certificate | string
  ): Promise<IResult<CRL | null>> {
    let uri = "";
    if (uriOrCert instanceof X509Certificate) {
      const crlPoints = uriOrCert.getExtension(id_ce_cRLDistributionPoints);
      if (crlPoints) {
        const asnCrlPoints = AsnConvert.parse(
          crlPoints.value,
          CRLDistributionPoints
        );
        for (const point of asnCrlPoints) {
          if (point.distributionPoint && point.distributionPoint.fullName) {
            for (const fullName of point.distributionPoint.fullName) {
              if (
                fullName.uniformResourceIdentifier &&
                fullName.uniformResourceIdentifier.startsWith("http")
              ) {
                const crl = await this.fetchCRL(
                  fullName.uniformResourceIdentifier
                );
                if (crl.result) {
                  return crl;
                }
              }
            }
          }
        }
      }

      return {
        result: null,
        target: this
      };
    }
    uri = uriOrCert;

    try {
      const raw = await this.requestCRL(uri);

      return {
        result: CRL.fromBER(raw),
        target: this
      };
    } catch (e) {
      return {
        result: null,
        target: this,
        error:
          e instanceof Error ? e : new Error("Unknown error on CRL fetching")
      };
    }

    return {
      result: null,
      target: this
    };
  }

  public async requestCRL(uri: string): Promise<ArrayBuffer> {
    if (!globalThis.fetch) {
      throw new Error("`globalThis.fetch` is undefined.");
    }

    const resp = await fetch(uri);
    if (resp.status === 200) {
      return resp.arrayBuffer();
    }

    throw new Error(`Error on CRL requesting (HTTP status: ${resp.status}).`);
  }

  public fetchRevocation(
    type: "crl",
    cert: X509Certificate
  ): Promise<IResult<CRL | null>>;
  public fetchRevocation(
    type: "ocsp",
    cert: X509Certificate
  ): Promise<IResult<OCSP | null>>;
  public async fetchRevocation(
    type: RevocationType,
    cert: X509Certificate
  ): Promise<IResult<CRL | OCSP | null>> {
    if (this.parent) {
      const res = await this.parent.fetchRevocation(type, cert);
      if (res.result || res.stopPropagation) {
        return res;
      }
    }

    switch (type) {
      case "crl":
        return this.fetchCRL(cert);
      case "ocsp":
        return this.fetchOCSP(cert);
      default:
        throw new Error("Unknown type of the revocation item");
    }
  }

  protected async findOCSP(
    cert: X509Certificate
  ): Promise<IResult<OCSP | null>> {
    for (const ocsp of this.ocsps) {
      const issuer = await this.findIssuer(cert);
      if (issuer) {
        for (const ocspResponse of ocsp.asn.tbsResponseData.responses) {
          const certId = new CertificateID();
          certId.fromSchema(ocspResponse.certID);

          const currentCertID = await CertificateID.create(
            certId.hashAlgorithm,
            cert,
            issuer
          );
          if (currentCertID.equal(certId)) {
            return {
              result: ocsp,
              target: this
            };
          }
        }
      }
    }

    return {
      target: this,
      result: null
    };
  }

  public async fetchOCSP(cert: X509Certificate): Promise<IResult<OCSP | null>> {
    const authorityInfoAccess = cert.getExtension(id_pe_authorityInfoAccess);
    if (authorityInfoAccess) {
      const asnAuthorityInfoAccess = AsnConvert.parse(
        authorityInfoAccess.value,
        AuthorityInfoAccessSyntax
      );
      for (const accessDesc of asnAuthorityInfoAccess) {
        if (
          accessDesc.accessMethod === id_ad_ocsp &&
          accessDesc.accessLocation.uniformResourceIdentifier
        ) {
          try {
            const issuer = await this.findIssuer(cert);
            if (issuer) {
              const request = await this.createOCSPRequest(
                cert,
                issuer,
                "SHA-1"
              );
              const ocspRespRaw = await this.requestOCSP(
                accessDesc.accessLocation.uniformResourceIdentifier,
                request
              );

              const ocspResp = AsnConvert.parse(ocspRespRaw, OCSPResponse);
              if (ocspResp.responseStatus !== OCSPResponseStatus.successful) {
                return {
                  result: null,
                  target: this,
                  error: new Error(
                    `Bad OCSP response status '${
                      OCSPResponseStatus[ocspResp.responseStatus] ||
                      ocspResp.responseStatus
                    }'.`
                  )
                };
              }

              return {
                result: OCSP.fromBER(ocspResp.responseBytes!.response),
                target: this
              };
            }
          } catch (e) {
            return {
              result: null,
              target: this,
              error:
                e instanceof Error
                  ? e
                  : new Error("Unknown error on OCSP fetching")
            };
          }
        }
      }
    }

    return {
      result: null,
      target: this,
      error: new Error("Not implemented")
    };
  }

  public async createOCSPRequest(
    cert: X509Certificate,
    issuer: X509Certificate,
    hashAlgorithm: AlgorithmIdentifier = "SHA-256"
  ): Promise<ArrayBuffer> {
    const certID = await CertificateID.create(hashAlgorithm, cert, issuer);
    const nonce = pkijs.getCrypto(true).getRandomValues(new Uint8Array(20));
    const ocspReq = new OCSPRequest({
      tbsRequest: new TBSRequest({
        requestList: [
          new Request({
            reqCert: AsnConvert.parse(certID.toBER(), CertID),
            singleRequestExtensions: [
              new Extension({
                extnID: id_pkix_ocsp_nonce,
                extnValue: new OctetString(nonce)
              })
            ]
          })
        ]
      })
    });

    return AsnConvert.serialize(ocspReq);
  }

  public async requestOCSP(
    uri: string,
    ocspRequest: BufferSource
  ): Promise<ArrayBuffer> {
    if (!globalThis.fetch) {
      throw new Error("`globalThis.fetch` is undefined.");
    }

    const resp = await fetch(uri, {
      method: "POST",
      headers: {
        "content-type": "application/ocsp-request"
      },
      body: BufferSourceConverter.toArrayBuffer(ocspRequest)
    });
    if (resp.status === 200) {
      const ocspRespRaw = await resp.arrayBuffer();

      return ocspRespRaw;
    }

    throw new Error(`Error on CRL requesting (HTTP status: ${resp.status}).`);
  }
}

import { CRL } from "./CRL";
import { OCSP } from "./OCSP";
import { CertificateID } from "./CertID";
import { PKIUtils } from "./PKIUtils";

import type {
  ICertificateStorageHandler,
  IResult,
  IsTrustedResult,
  RevocationType
} from "./ICertificateStorageHandler";
