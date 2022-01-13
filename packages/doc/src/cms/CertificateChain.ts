const pkijs = require("pkijs");
import { X509Certificate, X509Certificates } from "@peculiar/x509";
import { CertificateRevocationList, BasicOCSPResponse, Certificate } from "./PKITypes";
import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";
import { ICertificateStorage, ICertificateStorageHandler } from "./ICertificateStorageHandler";
import { PKIUtils } from "./PKIUtils";
import { IsTrustedResult } from "./ICertificateStorageHandler";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";

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
  untrusted = 97,
}

export interface CertificateChainResult {
  result: boolean | null;
  resultCode: CertificateChainStatusCode;
  chain: X509Certificates;
  trustListSource?: string;
  resultMessage: string;
}

export interface CertificateChainBuildParams {
  checkDate?: Date;
  revocations?: Array<CRL | OCSP>;
}

export class CertificateChain implements ICertificateStorage {

  public certificateHandler: ICertificateStorageHandler = new DefaultCertificateStorageHandler();

  protected async buildChainNoCheck(cert: X509Certificate): Promise<X509Certificates> {
    const chain = new X509Certificates;
    let lastCert: X509Certificate | null = cert;
    let isTrusted: IsTrustedResult | null = null;
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

  public async build(cert: X509Certificate, params: CertificateChainBuildParams = {}): Promise<CertificateChainResult> {
    const chain = await this.buildChainNoCheck(cert);
    const trustedChain = await this.certificateHandler.isTrusted(chain[chain.length - 1]);
    if (!trustedChain.result) {
      return {
        chain,
        result: false,
        resultMessage: "Parent certificates are not included in trusted list",
        resultCode: CertificateChainStatusCode.badPath
      };
    }

    const checkDate = params.checkDate || null;
    if (!checkDate) {
      return {
        chain,
        result: true,
        resultCode: CertificateChainStatusCode.success,
        resultMessage: "Certificate chain without expiration date validation",
      };
    }

    const chainEngineParams = {
      checkDate,
      certs: [] as Certificate[],
      trustedCerts: [] as Certificate[],
      crls: [] as CertificateRevocationList[],
      ocsps: [] as BasicOCSPResponse[],
    };

    const revocations = params.revocations || [];
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
    chainEngineParams.trustedCerts.push(PKIUtils.x509ToCert(chain[chain.length - 1]));

    // console.log({
    //   cert: cert.subject,
    //   params: chainEngineParams,
    // });
    const chainEngine = new pkijs.CertificateChainValidationEngine(chainEngineParams);

    const chainEngineResult = await chainEngine.verify();
    chainEngineResult.chain = chain;
    chainEngineResult.trustListSource = trustedChain.source;

    return chainEngineResult;
  }

}
