import * as asn1js from "asn1js";

import { CmsAttribute } from "./Attribute";
import { CmsAttributeFactory } from "./AttributeFactory";

export class SigningTimeAttribute extends CmsAttribute {

  public static readonly DEFAULT_IDENTIFIER = "1.2.840.113549.1.9.5";

  public constructor(date: Date = new Date()) {
    super();

    this.asn.type = SigningTimeAttribute.DEFAULT_IDENTIFIER;
    this.asn.values.push(new asn1js.UTCTime({ valueDate: date }));
  }

}

CmsAttributeFactory.register(SigningTimeAttribute.DEFAULT_IDENTIFIER, SigningTimeAttribute);
