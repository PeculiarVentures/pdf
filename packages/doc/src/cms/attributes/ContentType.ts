import * as asn1js from "asn1js";

import { CmsAttribute } from "./Attribute";
import { CmsAttributeFactory } from "./AttributeFactory";

export class ContentTypeAttribute extends CmsAttribute {
  public static readonly DEFAULT_IDENTIFIER = "1.2.840.113549.1.9.3";

  public constructor(value = "") {
    super();

    this.asn.type = ContentTypeAttribute.DEFAULT_IDENTIFIER;
    this.asn.values.push(new asn1js.ObjectIdentifier({ value }));
  }
}

CmsAttributeFactory.register(
  ContentTypeAttribute.DEFAULT_IDENTIFIER,
  ContentTypeAttribute
);
