import * as asn from "@peculiar/asn1-schema";

@asn.AsnType({ type: asn.AsnTypeTypes.Sequence })
export class FontGlyph {

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public index = 0;

  // @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  // public xMin = 0;

  // @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  // public xMax = 0;

  // @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  // public yMin = 0;

  // @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  // public yMax = 0;
  
  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public advanceWidth = 0;
  
  @asn.AsnProp({ type: asn.AsnPropTypes.Integer, repeated: "set" })
  public unicode: number[] = [];

  public constructor(params: Partial<FontGlyph> = {}) {
    Object.assign(this, params);
  }
}
