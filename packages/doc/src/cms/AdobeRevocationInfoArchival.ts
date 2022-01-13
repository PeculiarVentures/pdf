import { OCSPResponse } from "@peculiar/asn1-ocsp";
import { AsnProp, AsnPropTypes, AsnType, AsnTypeTypes } from "@peculiar/asn1-schema";

/**
 * ```
 * adbe-revocationInfoArchival OBJECT IDENTIFIER  ::=
 *   {adbe(1.2.840.113583) acrobat(1) security(1) 8}
 * ```
 */
export const id_adbe_revocationInfoArchival = "1.2.840.113583.1.1.8";

/**
 * ```
 * OtherRevInfo::= SEQUENCE {
 *   Type OBJECT IDENTIFIER
 *   Value OCTET STRING
 * } 
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class OtherRevInfo {
  public static readonly TYPE = "";
  public static readonly VALUE = new ArrayBuffer(0);
  
  @AsnProp({type: AsnPropTypes.ObjectIdentifier})
  public type = OtherRevInfo.TYPE;
  
  @AsnProp({type: AsnPropTypes.OctetString})
  public value = OtherRevInfo.VALUE;
}

/**
 * ```
 * RevocationInfoArchival::= SEQUENCE {
 *   crl [0] EXPLICIT SEQUENCE of CRLs, OPTIONAL
 *   ocsp [1] EXPLICIT SEQUENCE of OCSPResponse, OPTIONAL
 *   otherRevInfo [2] EXPLICIT SEQUENCE of OtherRevInfo, OPTIONAL
 * }
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class RevocationInfoArchival {
  
  @AsnProp({type: AsnPropTypes.Any, implicit: false, repeated: "sequence", context: 0, optional: true})
  public crl?: ArrayBuffer[];
  
  @AsnProp({type: AsnPropTypes.Any, implicit: false, repeated: "sequence", context: 1, optional: true})
  public ocsp?: ArrayBuffer[];

  @AsnProp({type: OCSPResponse, implicit: false, repeated: "sequence", context: 2, optional: true})
  public otherRevInfo?: OtherRevInfo[];

}
