import * as asn from "@peculiar/asn1-schema";

@asn.AsnType({ type: asn.AsnTypeTypes.Sequence })
export class FontName {
  @asn.AsnProp({ type: asn.AsnPropTypes.Utf8String })
  public fontFamily = "";

  @asn.AsnProp({ type: asn.AsnPropTypes.Utf8String })
  public fontSubfamily = "";

  @asn.AsnProp({ type: asn.AsnPropTypes.Utf8String })
  public fullName = "";

  @asn.AsnProp({ type: asn.AsnPropTypes.Utf8String })
  public postScriptName = "";
}
