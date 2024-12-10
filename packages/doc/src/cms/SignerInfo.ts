import { X509Certificate } from "@peculiar/x509";
import { BufferSource } from "pvtsutils";
import * as pkijs from "pkijs";

import { AsnEncoded } from "./AsnEncoded";

export enum CMSSignerInfoVerifyResultCodes {
  /**
   * Unable to get signer index from input parameters
   */
  signerNotFound = 1,
  /**
   * No certificates attached to this signed data
   */
  emptyCertificates = 2,
  /**
   * Unable to find signer certificate
   */
  signerCertificateNotFound = 3,
  /**
   * Missed detached data input array
   */
  dataNotFound = 4,
  /**
   * Validation of signer's certificate failed
   */
  signerCertificateInvalid = 5,
  // Not used 6,
  /**
   * Unsupported signature algorithm
   */
  unsupportedAlgorithm = 7,
  /**
   * Missed detached data input array
   */
  detachedDataRequired = 8,
  /**
   * Attribute "content-type" is a mandatory attribute for "signed attributes"
   */
  badContentType = 9,
  /**
   * Attribute \"message-digest\" is a mandatory attribute for \"signed attributes\"
   */
  badMessageDigest = 10,
  // Not used 11,
  // Not used 12,
  // Not used 13,
  /**
   * Signature is valid
   */
  success = 14,
  /**
   * Error during verification
   */
  unknown = 15,
}

export interface CMSSignerInfoVerifyResult {
  date: Date;
  code: CMSSignerInfoVerifyResultCodes;
  message?: string;
  signatureAlgorithm: Algorithm;
  signatureVerified: boolean | null;
  signerCertificate?: X509Certificate;
}

export enum CMSContentType {
  data = "1.2.840.113549.1.7.1",
  signedData = "1.2.840.113549.1.7.2",
  envelopedData = "1.2.840.113549.1.7.3",
  signedAndEnvelopedData = "1.2.840.113549.1.7.4",
}

export enum CMSAttributeTypes {
  contentType = "1.2.840.113549.1.9.3",
  signingTime = "1.2.840.113549.1.9.4",
  messageDigest = "1.2.840.113549.1.9.5",
}
export class CMSSignerInfo extends AsnEncoded {

  public parent: CMSSignedData | null = null;

  public signedAttributes: ReadonlyArray<attributes.CmsAttribute> = [];
  public unsignedAttributes: attributes.CmsAttribute[] = [];

  constructor() {
    super();

    this.asn = new pkijs.SignerInfo({
      version: 1,
    });
  }

  protected onFromSchema(schema: pkijs.SchemaType): pkijs.SignerInfo {
    const result = schema instanceof pkijs.SignerInfo ? schema : new pkijs.SignerInfo({ schema });

    // Load attributes
    if (result.signedAttrs) {
      this.signedAttributes = this.readAttributes(result.signedAttrs.attributes);
    }
    if (result.unsignedAttrs) {
      this.unsignedAttributes = this.readAttributes(result.unsignedAttrs.attributes);
    }

    return result;
  }

  protected readAttributes(attrs?: pkijs.Attribute[]): attributes.CmsAttribute[] {
    const res: attributes.CmsAttribute[] = [];
    if (attrs) {
      for (const attr of attrs) {
        const attrConst = attributes.CmsAttributeFactory.get(attr.type);
        const cmsAttr = new attrConst();
        cmsAttr.fromBER(attr.toSchema().toBER());

        res.push(cmsAttr);
      }
    }

    return res;
  }

  public get digestAlgorithm(): Algorithm {
    const raw = this.asn.digestAlgorithm.toSchema().toBER();

    return AlgorithmFactory.fromBER(raw);
  }

  public get signatureAlgorithm(): Algorithm {
    const raw = this.asn.signatureAlgorithm.toSchema().toBER();

    return AlgorithmFactory.fromBER(raw);
  }

  public get signatureValue(): ArrayBuffer {
    return this.asn.signature.valueBlock.valueHex;
  }

  public async verify(data?: BufferSource, checkDate = new Date()): Promise<CMSSignerInfoVerifyResult> {
    const signedData = this.getParent();

    const result = await signedData.verify(data, checkDate, this);

    return result.signers[0];
  }

  protected getParent(): CMSSignedData {
    if (!this.parent) {
      throw new Error("CMSSignerInfo is not assigned to CMSSignedData");
    }

    return this.parent;
  }

  public async getCertificate(): Promise<X509Certificate> {
    const parent = this.getParent();
    let cert: X509Certificate | null = null;

    if (this.asn.sid instanceof pkijs.IssuerAndSerialNumber) {
      // IssuerAndSerialNumber
      cert = await parent.certificateHandler.findCertificate(
        this.asn.sid.serialNumber.valueBlock.valueHex,
        this.asn.sid.issuer.toSchema().toBER(),
      );
    } else {
      // OctetString
      cert = await parent.certificateHandler.findCertificate(this.asn.sid.valueBlock.valueHex);
    }

    if (!cert) {
      throw new Error("Unable to find signer certificate");
    }

    return cert;
  }

  public override toSchema(): pkijs.SchemaType {
    if (this.unsignedAttributes.length) {
      const attrs: pkijs.Attribute[] = [];
      for (const attr of this.unsignedAttributes) {
        attrs.push(attr.asn);
      }

      this.asn.unsignedAttrs = new pkijs.SignedAndUnsignedAttributes({
        type: 1,
        attributes: attrs,
      });
    }

    return super.toSchema();
  }

}

import * as attributes from "./attributes";
import { AlgorithmFactory } from "./AlgorithmFactory";

import type { CMSSignedData } from "./SignedData";
