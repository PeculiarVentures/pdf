import { X509Certificate, X509Certificates } from "@peculiar/x509";
import { BufferSourceConverter, BufferSource } from "pvtsutils";

import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

import { CMSContentInfo } from "./ContentInfo";

const id_ri_ocsp_response = "1.3.6.1.5.5.7.48.1.1";

export interface CMSSignedDataVerifyResult {
  date: Date;
  signatureVerified: boolean;
  signers: CMSSignerInfoVerifyResult[];
}

export type RevocationItem = CRL | OCSP;

export interface CMSSignedDataCreateSignerParameters {
  digestAlgorithm?: AlgorithmIdentifier;
  signatureAlgorithm?: AlgorithmIdentifier;
  signedAttributes?: CmsAttribute[];
  unsignedAttributes?: CmsAttribute[];
}

export class CMSSignedData
  extends CMSContentInfo
  implements ICertificateStorage
{
  public static readonly CONTENT_TYPE = CMSContentInfo.CONTENT_TYPE_SIGNED_DATA;
  public static readonly DIGEST_ALGORITHM = "SHA-1";
  public static readonly SIGNATURE_ALGORITHM: Algorithm = {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: "SHA-1" }
  } as Algorithm;

  protected signedData: pkijs.SignedData;

  public certificateHandler: ICertificateStorageHandler =
    new CmsCertificateStorageHandler(this);

  public signers: CMSSignerInfo[] = [];
  public certificates = new X509Certificates();
  public revocations: RevocationItem[] = [];

  public constructor() {
    super();

    this.signedData = new pkijs.SignedData({
      version: 1,
      encapContentInfo: new pkijs.EncapsulatedContentInfo({
        eContentType: CMSContentInfo.CONTENT_TYPE_DATA
      })
    });

    this.asn.contentType = CMSSignedData.CONTENT_TYPE;
  }

  protected override onFromSchema(schema: pkijs.SchemaType): pkijs.ContentInfo {
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
      for (const item of this.signedData.crls) {
        let revocationItem: RevocationItem | null = null;
        if ("thisUpdate" in item) {
          revocationItem = CRL.fromSchema(item);
          this.certificateHandler.crls.push(revocationItem as CRL);
        } else if (item.otherRevInfoFormat === id_ri_ocsp_response) {
          revocationItem = OCSP.fromOCSPResponse(item.otherRevInfo.toBER());
          this.certificateHandler.ocsps.push(revocationItem as OCSP);
        }
        if (revocationItem) {
          this.revocations.push(revocationItem);
        }
      }
    }

    // Load revocation items form Adobe attribute
    for (const signer of this.signers) {
      for (const attr of signer.signedAttributes) {
        if (attr.type === id_adbe_revocationInfoArchival) {
          const adobeAttr = attr as AdobeRevocationInfoArchival;
          for (const crl of adobeAttr.crl) {
            this.certificateHandler.crls.push(crl);
          }
          for (const ocsp of adobeAttr.ocsp) {
            this.certificateHandler.ocsps.push(ocsp);
          }
          for (const otherRevInfo of adobeAttr.otherRevInfo) {
            this.certificateHandler.ocsps.push(otherRevInfo);
          }
        }
      }
    }

    return result;
  }

  public override toSchema(): pkijs.SchemaType {
    if (this.certificates.length) {
      const pkiCerts: pkijs.Certificate[] = (this.signedData.certificates = []);
      for (const cert of this.certificates) {
        pkiCerts.push(PKIUtils.x509ToCert(cert));
      }
    }
    if (this.revocations.length) {
      const crls: pkijs.SignedDataCRL[] = (this.signedData.crls = []);
      for (const revocation of this.revocations) {
        if (revocation instanceof CRL) {
          crls.push(revocation.asn);
        } else if (revocation instanceof OCSP) {
          const otherRevInfo = new pkijs.OtherRevocationInfoFormat({
            otherRevInfoFormat: id_ri_ocsp_response,
            otherRevInfo: pkijs.OCSPResponse.fromBER(
              revocation.toOCSPResponse()
            ).toSchema()
          });
          crls.push(otherRevInfo);
        }
      }
    }

    for (const signer of this.signers) {
      signer.toBER();
    }

    this.asn.content = this.signedData.toSchema();

    return super.toSchema();
  }

  public async verify(
    data?: BufferSource,
    checkDate = new Date(),
    signer?: CMSSignerInfo
  ): Promise<CMSSignedDataVerifyResult> {
    const signedDataResult: CMSSignedDataVerifyResult = {
      date: checkDate,
      signatureVerified: true,
      signers: []
    };

    if (signer) {
      const signerIndex = this.getSignerIndex(signer);
      const params: pkijs.SignedDataVerifyParams & { extendedMode: true } = {
        data: new ArrayBuffer(0),
        signer: signerIndex,
        checkChain: false,
        checkDate,
        extendedMode: true
      };

      if (data) {
        params.data = BufferSourceConverter.toArrayBuffer(data);
      } else {
        if (this.content) {
          params.data =
            this.signedData.encapContentInfo.eContent!.valueBlock.valueHex; // TODO constructed OCTET STRING
        }
      }

      let pkiResult: null | CMSSignerInfoVerifyResult = null;

      const cachedCerts = this.signedData.certificates;
      try {
        const signingCertificate = await signer.getCertificate();

        this.signedData.certificates = [
          PKIUtils.x509ToCert(signingCertificate)
        ];
      } catch (e) {
        const message = e instanceof Error ? e.message : `${e}`;
        pkiResult = {
          date: checkDate,
          code: CMSSignerInfoVerifyResultCodes.signerCertificateNotFound,
          message: message,
          signatureVerified: false,
          signatureAlgorithm: {
            ...signer.signatureAlgorithm,
            hash: signer.digestAlgorithm
          } as HashedAlgorithm
        };
      }

      if (!pkiResult) {
        try {
          pkiResult = (await this.signedData.verify(
            params
          )) as unknown as CMSSignerInfoVerifyResult;
        } catch (e) {
          if (typeof e === "string") {
            this.signedData.certificates = cachedCerts;
            throw new Error(
              `Failed on PKI SignedData 'verify' method execution. ${e}`
            );
          }
          if (e instanceof Error && !("certificatePath" in e)) {
            this.signedData.certificates = cachedCerts;
            throw e;
          }

          pkiResult = e as CMSSignerInfoVerifyResult;
        }
      }
      this.signedData.certificates = cachedCerts;

      if (!pkiResult) {
        throw new Error(
          "PKI SignedData signature verification result is empty"
        );
      }

      if (pkiResult.signerCertificate) {
        pkiResult.signerCertificate = PKIUtils.certTox509(
          pkiResult.signerCertificate as unknown as pkijs.Certificate
        );
      }

      pkiResult.signatureAlgorithm = {
        ...signer.signatureAlgorithm,
        hash: signer.digestAlgorithm
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

  public async sign(
    key: CryptoKey,
    signer: CMSSignerInfo,
    data?: BufferSource
  ): Promise<void> {
    const signerIndex = this.getSignerIndex(signer);

    await this.signedData.sign(
      key,
      signerIndex,
      signer.digestAlgorithm.name,
      data
    );

    const signerRaw = this.signedData.signerInfos[signerIndex]
      .toSchema()
      .toBER();
    const signerAsn = pkijs.SignerInfo.fromBER(signerRaw);
    this.signedData.signerInfos[signerIndex] = signerAsn;
    signer.fromSchema(signerAsn);
  }

  protected getSignerIndex(signer: CMSSignerInfo): number {
    const signerIndex = this.signers.indexOf(signer);
    if (signerIndex === -1) {
      throw new Error("Signer is not assigned to the current CMSSignedData");
    }

    return signerIndex;
  }

  // TODO Move to CMSSignerInfo static method
  public createSigner(
    source: BufferSource | X509Certificate,
    params: CMSSignedDataCreateSignerParameters = {}
  ): CMSSignerInfo {
    if (BufferSourceConverter.isBufferSource(source)) {
      const cert = new X509Certificate(source);

      return this.createSigner(cert, params);
    }

    const signer = new CMSSignerInfo();

    const pkiCert = PKIUtils.x509ToCert(source);
    signer.asn.sid = new pkijs.IssuerAndSerialNumber({
      issuer: pkiCert.issuer,
      serialNumber: pkiCert.serialNumber
    });

    if (params.signedAttributes) {
      const attrs: pkijs.Attribute[] = [];
      for (const attr of params.signedAttributes) {
        attrs.push(attr.asn);
      }

      signer.asn.signedAttrs = new pkijs.SignedAndUnsignedAttributes({
        type: 0,
        attributes: attrs
      });
    }

    if (params.unsignedAttributes) {
      const attrs: pkijs.Attribute[] = [];
      for (const attr of params.unsignedAttributes) {
        attrs.push(attr.asn);
      }

      signer.asn.unsignedAttrs = new pkijs.SignedAndUnsignedAttributes({
        type: 1,
        attributes: attrs
      });
    }

    const digestAlgIdRaw = AlgorithmFactory.toBER(
      params.digestAlgorithm || CMSSignedData.DIGEST_ALGORITHM
    );
    const digestAlgIdAsn = asn1js.fromBER(digestAlgIdRaw);
    signer.asn.digestAlgorithm = new pkijs.AlgorithmIdentifier({
      schema: digestAlgIdAsn.result
    });

    // Assign signer to the signed data
    signer.parent = this;
    this.signers.push(signer);
    this.signedData.signerInfos.push(signer.asn);

    return signer;
  }
}

import { PKIUtils } from "./PKIUtils";
import {
  CMSSignerInfo,
  CMSSignerInfoVerifyResult,
  CMSSignerInfoVerifyResultCodes
} from "./SignerInfo";
import { CmsCertificateStorageHandler } from "./CertificateStorageHandler";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";
import {
  AdobeRevocationInfoArchival,
  id_adbe_revocationInfoArchival
} from "./AdobeRevocationInfoArchival";
import { AlgorithmFactory, HashedAlgorithm } from "./AlgorithmFactory";

import type { CmsAttribute } from "./attributes";
import type {
  ICertificateStorage,
  ICertificateStorageHandler
} from "./ICertificateStorageHandler";
