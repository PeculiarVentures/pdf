import * as asn from "@peculiar/asn1-schema";

// fontDescriptor.capHeight = os2.sCapHeight * scale;
// fontDescriptor.xHeight = os2.sxHeight * scale;
// fontDescriptor.fontWeight = os2.usWeightClass; // Optional
// fontDescriptor.stemV = (50 + Math.pow(os2.usWeightClass / 65, 2)); // ??? Very unclear how to calculate this value
@asn.AsnType({ type: asn.AsnTypeTypes.Sequence })
export class FontOS2 {

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public sCapHeight = 0;

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public sxHeight = 0;

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public usWeightClass = 0;

}
