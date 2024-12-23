import * as asn from "@peculiar/asn1-schema";

@asn.AsnType({ type: asn.AsnTypeTypes.Sequence })
export class FontHead {
  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public xMin = 0;

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public xMax = 0;

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public yMin = 0;

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public yMax = 0;
}
