import { id_sha256 } from "@peculiar/asn1-rsa";
import { AsnConvert, OctetString } from "@peculiar/asn1-schema";
import {
  MessageImprint,
  TimeStampReq,
  TimeStampResp
} from "@peculiar/asn1-tsp";
import { AlgorithmIdentifier } from "@peculiar/asn1-x509";
import * as x509 from "@peculiar/x509";
import {
  CRL,
  DefaultCertificateStorageHandler,
  IResult,
  IsTrustedResult,
  OCSP,
  RevocationType,
  TimeStampToken
} from "@peculiarventures/pdf-doc";

interface RootCertificateStorageHandlerParams {
  trustedCertificates?: x509.X509Certificate[];
  certificates?: x509.X509Certificate[];
  revocations?: Record<string, CRL | OCSP>;
}

/**
 * Test implementation of ICertificateStorageHandler that mocks a root certificate storage.
 */
export class RootCertificateStorageHandler extends DefaultCertificateStorageHandler {
  private trustedCertificates: x509.X509Certificate[];
  private revocations: Record<string, CRL | OCSP>;

  constructor(params: RootCertificateStorageHandlerParams = {}) {
    super();
    this.trustedCertificates = params.trustedCertificates || [];
    for (const cert of this.trustedCertificates) {
      this.certificates.push(cert);
    }
    this.revocations = params.revocations || {};
    if (params.certificates) {
      for (const cert of params.certificates) {
        this.certificates.push(cert);
      }
    }
  }

  public override async isTrusted(
    cert: x509.X509Certificate
  ): Promise<IsTrustedResult> {
    for (const trustedCert of this.trustedCertificates) {
      if (trustedCert.equal(cert)) {
        return {
          result: true,
          target: this,
          source: "RootCertificateStorageHandler"
        };
      }
    }

    return {
      result: false,
      target: this,
      source: "RootCertificateStorageHandler"
    };
  }

  public override async fetchRevocation(
    type: "crl",
    cert: x509.X509Certificate
  ): Promise<IResult<CRL | null>>;
  public override async fetchRevocation(
    type: "ocsp",
    cert: x509.X509Certificate
  ): Promise<IResult<OCSP | null>>;
  public override async fetchRevocation(
    type: RevocationType,
    cert: x509.X509Certificate
  ): Promise<IResult<CRL | OCSP | null>> {
    if (type === "crl") {
      const crlDistriPoints = cert.getExtension(
        x509.CRLDistributionPointsExtension
      );
      if (crlDistriPoints) {
        for (const point of crlDistriPoints.distributionPoints) {
          const url =
            point.distributionPoint?.fullName?.[0].uniformResourceIdentifier;
          if (url && this.revocations[url]) {
            return {
              result: this.revocations[url] as CRL,
              target: this
            };
          }
        }
      }
    } else if (type === "ocsp") {
      const aia = cert.getExtension(x509.AuthorityInfoAccessExtension);
      if (aia) {
        for (const ocsp of aia.ocsp) {
          const url = ocsp.type === "url" ? ocsp.value : null;
          if (url && this.revocations[url]) {
            return {
              result: this.revocations[url] as OCSP,
              target: this
            };
          }
        }
      }
    }
    return {
      result: null,
      target: this
    };
  }
}

// function to get TimeStampToken from http server
export async function getTimeStampToken(
  signatureValue: BufferSource,
  url = "http://timestamp.digicert.com"
): Promise<TimeStampToken> {
  const signatureValueHash = await crypto.subtle.digest(
    "SHA-256",
    signatureValue
  );
  const timeStampRequest = new TimeStampReq({
    version: 1,
    messageImprint: new MessageImprint({
      hashAlgorithm: new AlgorithmIdentifier({
        algorithm: id_sha256,
        parameters: null
      }),
      hashedMessage: new OctetString(signatureValueHash)
    }),
    certReq: true
  });
  const timeStampRequestDer = AsnConvert.serialize(timeStampRequest);
  const timeStampResponse = await fetch(url, {
    method: "POST",
    body: timeStampRequestDer
  });
  const timeStampResponseDer = await timeStampResponse.arrayBuffer();
  const timeStampResp = AsnConvert.parse(timeStampResponseDer, TimeStampResp);
  if (timeStampResp.status.status) {
    throw new Error("Failed to get TimeStampToken");
  }
  const timeStampTokenDer = AsnConvert.serialize(timeStampResp.timeStampToken);
  const timeStampToken = TimeStampToken.fromBER(timeStampTokenDer);
  return timeStampToken;
}
