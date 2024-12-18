import { CertificateList } from "@peculiar/asn1-x509";
import { OCSPResponse } from "@peculiar/asn1-ocsp";
import {
  AsnConvert,
  AsnProp,
  AsnPropTypes,
  AsnType,
  AsnTypeTypes
} from "@peculiar/asn1-schema";
import * as asn1js from "asn1js";
import { CmsAttribute, CmsAttributeFactory } from "./attributes";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";

const id_ri_ocsp_response = "1.3.6.1.5.5.7.48.1.1";

/**
 * ```asn1
 * adbe-revocationInfoArchival OBJECT IDENTIFIER ::=
 *   {adbe(1.2.840.113583) acrobat(1) security(1) 8}
 * ```
 */
export const id_adbe_revocationInfoArchival = "1.2.840.113583.1.1.8";

/**
 * ```asn1
 * OtherRevInfo ::= SEQUENCE {
 *   Type OBJECT IDENTIFIER
 *   Value OCTET STRING
 * }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class OtherRevInfo {
  public static readonly TYPE = "";
  public static readonly VALUE = new ArrayBuffer(0);

  @AsnProp({ type: AsnPropTypes.ObjectIdentifier })
  public type = OtherRevInfo.TYPE;

  @AsnProp({ type: AsnPropTypes.OctetString })
  public value = OtherRevInfo.VALUE;
}

/**
 * ```asn1
 * RevocationInfoArchival ::= SEQUENCE {
 *   crl [0] EXPLICIT SEQUENCE of CRLs, OPTIONAL
 *   ocsp [1] EXPLICIT SEQUENCE of OCSPResponse, OPTIONAL
 *   otherRevInfo [2] EXPLICIT SEQUENCE of OtherRevInfo, OPTIONAL
 * }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class RevocationInfoArchival {
  @AsnProp({
    type: CertificateList,
    implicit: false,
    repeated: "sequence",
    context: 0,
    optional: true
  })
  public crl?: CertificateList[];

  @AsnProp({
    type: OCSPResponse,
    implicit: false,
    repeated: "sequence",
    context: 1,
    optional: true
  })
  public ocsp?: OCSPResponse[];

  @AsnProp({
    type: OtherRevInfo,
    implicit: false,
    repeated: "sequence",
    context: 2,
    optional: true
  })
  public otherRevInfo?: OtherRevInfo[];

  constructor(params: Partial<RevocationInfoArchival> = {}) {
    if (params.crl && params.crl.length) {
      this.crl = params.crl;
    }
    if (params.ocsp && params.ocsp.length) {
      this.ocsp = params.ocsp;
    }
    if (params.otherRevInfo && params.otherRevInfo.length) {
      this.otherRevInfo = params.otherRevInfo;
    }
  }
}

export interface OtherRevInfoItem {
  type: "ocsp";
  value: OCSP;
}
export type RevocationData = CRL | OCSP | OtherRevInfoItem;

export class AdobeRevocationInfoArchival extends CmsAttribute {
  public static readonly DEFAULT_IDENTIFIER = id_adbe_revocationInfoArchival;

  private _value?: RevocationInfoArchival;
  private _crl?: CRL[];
  private _ocsp?: OCSP[];
  private _otherRevInfo?: OCSP[];

  private get value(): RevocationInfoArchival {
    if (!this._value) {
      const raw = this.asn.values[0].toBER(false);
      this._value = AsnConvert.parse(raw, RevocationInfoArchival);
    }
    return this._value;
  }

  public get crl(): CRL[] {
    if (!this._crl) {
      this._crl = [];
      for (const item of this.value.crl || []) {
        const raw = AsnConvert.serialize(item);
        this._crl.push(CRL.fromBER(raw));
      }
    }
    return this._crl;
  }

  public get ocsp(): OCSP[] {
    if (!this._ocsp) {
      this._ocsp = [];
      for (const item of this.value.ocsp || []) {
        const raw = AsnConvert.serialize(item);
        this._ocsp.push(OCSP.fromOCSPResponse(raw));
      }
    }
    return this._ocsp;
  }

  public get otherRevInfo(): OCSP[] {
    if (!this._otherRevInfo) {
      this._otherRevInfo = [];
      for (const item of this.value.otherRevInfo || []) {
        if (item.type === id_ri_ocsp_response) {
          this._otherRevInfo.push(OCSP.fromOCSPResponse(item.value));
        }
      }
    }
    return this._otherRevInfo;
  }

  public constructor(revocations: RevocationData[] = []) {
    super();

    this.asn.type = AdobeRevocationInfoArchival.DEFAULT_IDENTIFIER;

    // create attribute value
    const crl: CertificateList[] = [];
    const ocsp: OCSPResponse[] = [];
    const otherRevInfos: OtherRevInfo[] = [];
    for (const revocation of revocations) {
      if (revocation instanceof CRL) {
        crl.push(AsnConvert.parse(revocation.toBER(), CertificateList));
      } else if (revocation instanceof OCSP) {
        const raw = revocation.toOCSPResponse();
        const asnValue = AsnConvert.parse(raw, OCSPResponse);
        ocsp.push(asnValue);
      } else if (revocation.type === "ocsp") {
        const otherRevInfo = new OtherRevInfo();
        otherRevInfo.type = id_ri_ocsp_response;
        otherRevInfo.value = revocation.value.toOCSPResponse();
        otherRevInfos.push(otherRevInfo);
      }
    }

    const revInfo = new RevocationInfoArchival({
      crl,
      ocsp,
      otherRevInfo: otherRevInfos
    });
    const revInfoRaw = AsnConvert.serialize(revInfo);
    const asnValue = asn1js.fromBER(revInfoRaw);
    this.asn.values.push(asnValue.result);
  }
}

CmsAttributeFactory.register(
  AdobeRevocationInfoArchival.DEFAULT_IDENTIFIER,
  AdobeRevocationInfoArchival
);
