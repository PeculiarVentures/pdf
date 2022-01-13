import * as asn from "@peculiar/asn1-schema";

@asn.AsnType({ type: asn.AsnTypeTypes.Sequence })
export class FontPost {

  @asn.AsnProp({type: asn.AsnPropTypes.Integer})
  public italicAngle = 0;

}
