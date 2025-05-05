import { X509Certificate, X509Certificates } from "@peculiar/x509";
import * as pkijs from "pkijs";

export enum CertificateChainStatusCode {
  unknown = -1,
  /**
   * Success
   */
  success = 0,
  /**
   * Unable to build certificate chain - using "keyCertSign" flag set without BasicConstraints
   */
  badKeyCertSign = 3,
  /**
   * Unable to build certificate chain - "keyCertSign" flag was not set
   */
  badKeyCertSign2 = 4,
  /**
   * Unable to build certificate chain - intermediate certificate must have "cRLSign" key usage flag
   */
  badCrlSign = 5,
  /**
   * Unable to parse critical certificate extension: <name>
   */
  badCriticalExtension = 6,
  /**
   * Unable to build certificate chain - more than one possible end-user certificate
   */
  multipleEnds = 7,
  /**
   * The certificate is either not yet valid or expired
   */
  badDate = 8,
  /**
   * Too short certificate path
   */
  shortPath = 9,
  /**
   * Incorrect name chaining
   */
  badNameChaining = 10,
  /**
   * No revocation values found for one of certificates
   */
  revocationNotFound = 11,
  /**
   * Revoked
   */
  revokedOCSP = 12,
  /**
   * CRL issuer certificate is not a CA certificate or does not have crlSign flag
   */
  badCrlCa = 13,
  /**
   * One of intermediate certificates is not a CA certificate
   */
  badCA = 14,
  /**
   * No necessary name form found
   */
  policyName = 21,
  /**
   * Failed to meet "permitted sub-trees" name constraint
   */
  policyNameConstraint = 41,
  /**
   * Failed to meet "excluded sub-trees" name constraint
   */
  policyNameConstraint2 = 42,
  /**
   * Failed to meet "excluded sub-trees" name constraint
   */
  policyNameConstraint3 = 43,
  /**
   * Unable to find certificate path
   */
  badPath = 60,
  /**
   * Parent certificates are not included in trusted list
   */
  untrusted = 97
}

export interface CertificateChainResult {
  result: boolean | null;
  resultCode: CertificateChainStatusCode;
  chain: X509Certificates;
  trustListSource?: string;
  resultMessage: string;
  revocationMode?: ChainRevocationMode;
  revocations?: (CRL | OCSP)[];
}

export type RevocationMode = "no" | "online" | "offline";
export interface ChainBuildParams {
  checkDate?: Date;
  revocationMode?: RevocationMode;
  preferCRL?: boolean;
}

export type ChainRevocationMode = "no" | "online" | "offline" | "all";

export class CertificateChain implements storageHandler.ICertificateStorage {
  public certificateHandler: storageHandler.ICertificateStorageHandler =
    new DefaultCertificateStorageHandler();

  protected async buildChainNoCheck(
    cert: X509Certificate
  ): Promise<X509Certificates> {
    const chain = new X509Certificates();
    let lastCert: X509Certificate | null = cert;
    let isTrusted: storageHandler.IsTrustedResult | null = null;
    while (lastCert) {
      chain.push(lastCert);

      isTrusted = await this.certificateHandler.isTrusted(lastCert);
      if (lastCert.subject === lastCert.issuer || isTrusted.result) {
        break;
      }

      lastCert = await this.certificateHandler.findIssuer(lastCert);
    }

    return chain;
  }

  public async build(
    cert: X509Certificate,
    params: ChainBuildParams = {}
  ): Promise<CertificateChainResult> {
    // Set default parameters
    params = Object.assign<ChainBuildParams, ChainBuildParams>(
      { revocationMode: "no" },
      params
    );

    //
    const chain = await this.buildChainNoCheck(cert);
    const trustedChain = await this.certificateHandler.isTrusted(
      chain[chain.length - 1]
    );
    if (!trustedChain.result) {
      return {
        chain,
        result: false,
        resultMessage: "Parent certificates are not included in trusted list",
        resultCode: CertificateChainStatusCode.badPath
      };
    }

    // Handle the case where the leaf certificate itself is trusted
    if (chain.length === 1 && trustedChain.result) {
      // IMPORTANT: This check must come before the date check because Adobe Acrobat
      // explicitly trusts certificates in the trusted list, even if they are expired.
      // This behavior ensures compatibility with Adobe Acrobat's handling of trusted certificates.
      return {
        chain,
        result: true,
        resultMessage: "Certificate is trusted",
        resultCode: CertificateChainStatusCode.success,
        trustListSource: trustedChain.source,
        revocationMode: params.revocationMode
      };
    }

    const checkDate = params.checkDate || new Date();
    for (const chainCert of chain) {
      if (
        chainCert.notBefore.getTime() > checkDate.getTime() ||
        chainCert.notAfter.getTime() < checkDate.getTime()
      ) {
        return {
          resultMessage: "The certificate is either not yet valid or expired",
          chain,
          result: false,
          resultCode: CertificateChainStatusCode.badDate
        };
      }
    }

    const revocations: (CRL | OCSP)[] = [];
    if (params.revocationMode !== "no") {
      const revocationTypeOrder: storageHandler.RevocationType[] = [
        "ocsp",
        "crl"
      ];
      if (params.preferCRL) {
        revocationTypeOrder.reverse();
      }

      for (const cert of chain) {
        if (cert === chain[chain.length - 1]) {
          // Don't get revocation item for the trusted certificate
          break;
        }
        let revocationResult:
          | storageHandler.IResult<CRL | OCSP | null>
          | undefined;
        for (const revocationType of revocationTypeOrder) {
          if (revocationResult && revocationResult.result) {
            break;
          }
          if (params.revocationMode === "offline") {
            revocationResult = await this.certificateHandler.findRevocation(
              revocationType,
              cert
            );
          } else if (params.revocationMode === "online") {
            revocationResult = await this.certificateHandler.fetchRevocation(
              revocationType,
              cert
            );
          }
        }
        if (revocationResult && revocationResult.result) {
          revocations.push(revocationResult.result);
        }
      }
    }

    const chainEngineParams = {
      checkDate,
      certs: [] as pkijs.Certificate[],
      trustedCerts: [] as pkijs.Certificate[],
      crls: [] as pkijs.CertificateRevocationList[],
      ocsps: [] as pkijs.BasicOCSPResponse[]
    };

    for (const revocation of revocations) {
      if (revocation instanceof CRL) {
        chainEngineParams.crls.push(revocation.asn);
      } else if (revocation instanceof OCSP) {
        chainEngineParams.ocsps.push(revocation.asn);
      }
    }

    for (const certChain of chain) {
      chainEngineParams.certs.push(PKIUtils.x509ToCert(certChain));
    }
    chainEngineParams.certs.reverse();
    chainEngineParams.trustedCerts.push(
      PKIUtils.x509ToCert(chain[chain.length - 1])
    );

    const chainEngine = new pkijs.CertificateChainValidationEngine(
      chainEngineParams
    );

    const chainEngineResult =
      (await chainEngine.verify()) as CertificateChainResult;
    // console.log({
    //   cert: cert.subject,
    //   params: chainEngineParams,
    //   chainEngineResult,
    // });
    chainEngineResult.chain = chain;
    chainEngineResult.revocationMode = params.revocationMode;
    if (revocations.length) {
      chainEngineResult.revocations = revocations;
    }
    chainEngineResult.trustListSource = trustedChain.source;

    return chainEngineResult;
  }
}

import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";
import { PKIUtils } from "./PKIUtils";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";

import type * as storageHandler from "./ICertificateStorageHandler";
