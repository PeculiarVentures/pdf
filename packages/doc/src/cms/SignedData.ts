const pkijs = require("pkijs");
const asn1js = require("asn1js");
import { AsnConvert } from "@peculiar/asn1-schema";
import { X509Certificate, X509Certificates } from "@peculiar/x509";
import { BufferSourceConverter, BufferSource } from "pvtsutils";
import { AlgorithmFactory, HashedAlgorithm } from "./AlgorithmFactory";
import { CmsAttribute } from "./attributes";
import { CMSContentInfo } from "./ContentInfo";
import { ICertificateStorage, ICertificateStorageHandler } from "./ICertificateStorageHandler";
import { Attribute, BasicOCSPResponse, Certificate, CertificateRevocationList } from "./PKITypes";
import { PKIUtils } from "./PKIUtils";
import { id_adbe_revocationInfoArchival, RevocationInfoArchival } from "./AdobeRevocationInfoArchival";

export interface CMSSignedDataVerifyResult {
  date: Date;
  signatureVerified: boolean;
  signers: CMSSignerInfoVerifyResult[];
}

export interface RevocationItem {
  type: "crl" | "ocsp";
  value: CertificateRevocationList | BasicOCSPResponse;
}

export interface CMSSignedDataCreateSignerParameters {
  digestAlgorithm?: AlgorithmIdentifier;
  signatureAlgorithm?: AlgorithmIdentifier;
  signedAttributes?: CmsAttribute[];
  unsignedAttributes?: CmsAttribute[];
}

export class CMSSignedData extends CMSContentInfo implements ICertificateStorage {

  public static readonly CONTENT_TYPE = CMSContentInfo.CONTENT_TYPE_SIGNED_DATA;
  public static readonly DIGEST_ALGORITHM = "SHA-1";
  public static readonly SIGNATURE_ALGORITHM: Algorithm = { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-1" } } as Algorithm;

  protected signedData: any;

  public certificateHandler: ICertificateStorageHandler = new CmsCertificateStorageHandler(this);

  public signers: CMSSignerInfo[] = [];
  public certificates = new X509Certificates();
  public crls: RevocationItem[] = [];

  public constructor() {
    super();

    this.signedData = new pkijs.SignedData({
      version: 1,
      encapContentInfo: new pkijs.EncapsulatedContentInfo({
        eContentType: CMSContentInfo.CONTENT_TYPE_DATA,
      }),
    });

    this.asn.contentType = CMSSignedData.CONTENT_TYPE;
  }

  protected override onFromSchema(schema: any): any {
    const result = super.onFromSchema(schema);

    if (result.contentType !== CMSSignedData.CONTENT_TYPE) {
      throw new TypeError("Content type doesn't match to Signed data");
    }

    this.signedData = new pkijs.SignedData({ schema: result.content });

    // Load signer infos
    if (this.signedData.signerInfos) {
      for (const signerInfo of this.signedData.signerInfos) {
        const signer = CMSSignerInfo.fromSchema(signerInfo.toSchema());
        signer.parent = this;

        // console.log((signer as any).asn.signature);

        this.signers.push(signer);
      }
    }

    // Load certificates
    if (this.signedData.certificates) {
      const certificates: X509Certificates = new X509Certificates();
      for (const pkiCert of this.signedData.certificates) {
        if (pkiCert instanceof pkijs.Certificate) {
          const cert = PKIUtils.certTox509(pkiCert);
          certificates.push(cert);
        }
      }
      this.certificateHandler.certificates = certificates;
      this.certificates = certificates;
    }

    // Load revocation items
    if (this.signedData.crls) {
      for (const crl of this.signedData.crls) {
        if ("thisUpdate" in crl) {
          this.certificateHandler.crls.push(crl);
          this.crls.push({
            type: "crl",
            value: crl,
          });
        } else { // Assumed "revocation value" has "OtherRevocationInfoFormat"
          if (crl.otherRevInfoFormat === "1.3.6.1.5.5.7.48.1.1") { // Basic OCSP response 
            this.certificateHandler.ocsps.push(OCSP.fromSchema(crl.otherRevInfo));
            this.crls.push({
              type: "ocsp",
              value: crl,
            });
          }
        }
      }
    }

    // Load revocation items form Adobe attribute
    for (const signer of this.signers) {
      for (const attr of signer.signedAttributes) {
        if (attr.type === id_adbe_revocationInfoArchival) {
          const attrValue = attr.values[0];
          if (attrValue) {
            const adobeAttr = AsnConvert.parse(attrValue, RevocationInfoArchival);
            if (adobeAttr.crl) {
              for (const crl of adobeAttr.crl) {
                this.certificateHandler.crls.push(CRL.fromBER(crl));
              }
            }
            if (adobeAttr.ocsp) {
              for (const ocsp of adobeAttr.ocsp) {
                this.certificateHandler.ocsps.push(OCSP.fromOCSPResponse(ocsp));
              }
            }
            // TODO support adobeAttr.otherRevInfo
          }
        }
      }
    }

    return result;
  }

  public override toSchema(): any {
    if (this.certificates.length) {
      const pkiCerts: Certificate[] = this.signedData.certificates = [];
      for (const cert of this.certificates) {
        pkiCerts.push(PKIUtils.x509ToCert(cert));
      }
    }
    if (this.crls.length) {
      const crls: any[] = this.signedData.crls = [];
      for (const crl of this.crls) {
        if (crl.type === "crl") {
          crls.push(crl.value);
        } else if (crl.type === "ocsp") {
          // TODO Convert to OtherRevocationInfoFormat
          crls.push(crl.value);
        }
      }
    }

    for (const signer of this.signers) {
      signer.toBER();
    }

    this.asn.content = this.signedData.toSchema();

    return super.toSchema();
  }

  public async verify(data?: BufferSource, checkDate = new Date(), signer?: CMSSignerInfo): Promise<CMSSignedDataVerifyResult> {
    const signedDataResult: CMSSignedDataVerifyResult = {
      date: checkDate,
      signatureVerified: true,
      signers: [],
    };

    if (signer) {
      const signerIndex = this.getSignerIndex(signer);
      const params: any = {
        signer: signerIndex,
        checkChain: false,
        checkDate,
        extendedMode: true,
      };

      if (data) {
        params.data = BufferSourceConverter.toArrayBuffer(data);
      } else {
        if (this.content) {
          params.data = this.signedData.encapContentInfo.eContent.valueBlock.valueHex; // TODO constructed OCTET STRING
        }
      }

      let pkiResult: null | CMSSignerInfoVerifyResult = null;

      const cachedCerts = this.signedData.certificates;
      try {
        const signingCertificate = await signer.getCertificate();

        this.signedData.certificates = [PKIUtils.x509ToCert(signingCertificate)];
      } catch (e) {
        const message = e instanceof Error
          ? e.message
          : `${e}`;
        pkiResult = {
          date: checkDate,
          code: CMSSignerInfoVerifyResultCodes.signerCertificateNotFound,
          message: message,
          signatureVerified: false,
          signatureAlgorithm: {
            ...signer.signatureAlgorithm,
            hash: signer.digestAlgorithm,
          } as HashedAlgorithm,
        };
      }
      this.signedData.certificates = cachedCerts;

      if (!pkiResult) {
        try {
          pkiResult = await this.signedData.verify(params);
        } catch (e) {
          if (typeof e === "string") {
            throw new Error(`Failed on PKI SignedData 'verify' method execution. ${e}`);
          }
          if (e instanceof Error) {
            throw e;
          }

          pkiResult = e as CMSSignerInfoVerifyResult;
        }
      }

      if (!pkiResult) {
        throw new Error("PKI SignedData signature verification result is empty");
      }

      if (pkiResult.signerCertificate) {
        pkiResult.signerCertificate = PKIUtils.certTox509(pkiResult.signerCertificate as any);
      }

      pkiResult.signatureAlgorithm = {
        ...signer.signatureAlgorithm,
        hash: signer.digestAlgorithm,
      } as HashedAlgorithm;

      signedDataResult.signers.push(pkiResult);
    } else {
      for (const signer of this.signers) {
        const signerResult = await signer.verify(data, checkDate);
        if (!signerResult.signatureVerified) {
          signedDataResult.signatureVerified = false;
        }
        signedDataResult.signers.push(signerResult);
      }
    }

    return signedDataResult;
  }

  public async sign(key: CryptoKey, signer: CMSSignerInfo, data: BufferSource = new ArrayBuffer(0)): Promise<void> {
    const signerIndex = this.getSignerIndex(signer);

    await this.signedData.sign(key, signerIndex, signer.digestAlgorithm.name, BufferSourceConverter.toArrayBuffer(data));

    signer.fromSchema(this.signedData.signerInfos[signerIndex]);
  }

  protected getSignerIndex(signer: CMSSignerInfo): number {
    const signerIndex = this.signers.indexOf(signer);
    if (signerIndex === -1) {
      throw new Error("Signer is not assigned to the current CMSSignedData");
    }

    return signerIndex;
  }

  // TODO Move to CMSSignerInfo static method
  public createSigner(raw: BufferSource, params?: CMSSignedDataCreateSignerParameters): CMSSignerInfo;
  public createSigner(cert: X509Certificate, params?: CMSSignedDataCreateSignerParameters): CMSSignerInfo;
  public createSigner(source: BufferSource | X509Certificate, params: CMSSignedDataCreateSignerParameters = {}): CMSSignerInfo {
    if (BufferSourceConverter.isBufferSource(source)) {
      const cert = new X509Certificate(source);

      return this.createSigner(cert, params);
    }

    const signer = new CMSSignerInfo();

    const pkiCert = PKIUtils.x509ToCert(source);
    signer.asn.sid = new pkijs.IssuerAndSerialNumber({
      issuer: pkiCert.issuer,
      serialNumber: pkiCert.serialNumber,
    });

    if (params.signedAttributes) {
      const attrs: Attribute[] = [];
      for (const attr of params.signedAttributes) {
        attrs.push(attr.asn);
      }

      signer.asn.signedAttrs = new pkijs.SignedAndUnsignedAttributes({
        type: 0,
        attributes: attrs,
      });
    }

    if (params.unsignedAttributes) {
      const attrs: Attribute[] = [];
      for (const attr of params.unsignedAttributes) {
        attrs.push(attr.asn);
      }

      signer.asn.unsignedAttrs = new pkijs.SignedAndUnsignedAttributes({
        type: 1,
        attributes: attrs,
      });
    }

    const digestAlgIdRaw = AlgorithmFactory.toBER(params.digestAlgorithm || CMSSignedData.DIGEST_ALGORITHM);
    const digestAlgIdAsn = asn1js.fromBER(digestAlgIdRaw);
    signer.asn.digestAlgorithm = new pkijs.AlgorithmIdentifier({ schema: digestAlgIdAsn.result });

    // Assign signer to the signed data
    signer.parent = this;
    this.signers.push(signer);
    this.signedData.signerInfos.push(signer.asn);

    return signer;
  }

}

import { CMSSignerInfo, CMSSignerInfoVerifyResult, CMSSignerInfoVerifyResultCodes } from "./SignerInfo";
import { CmsCertificateStorageHandler } from "./CertificateStorageHandler";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";
