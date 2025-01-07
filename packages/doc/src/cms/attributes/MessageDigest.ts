import { AsnConvert, OctetString } from "@peculiar/asn1-schema";
import * as asn1js from "asn1js";
import { BufferSourceConverter, BufferSource } from "pvtsutils";

import { CmsAttribute } from "./Attribute";
import { CmsAttributeFactory } from "./AttributeFactory";

export class MessageDigestAttribute extends CmsAttribute {
  public static readonly DEFAULT_IDENTIFIER = "1.2.840.113549.1.9.4";

  public get digest(): ArrayBuffer {
    const value = this.asn.values[0];
    if (value) {
      const octetString = AsnConvert.parse(value, OctetString);

      return octetString.buffer;
    }

    return new ArrayBuffer(0);
  }

  public constructor(digest: BufferSource = new ArrayBuffer(0)) {
    super();

    this.asn.type = MessageDigestAttribute.DEFAULT_IDENTIFIER;
    this.asn.values.push(
      new asn1js.OctetString({
        valueHex: BufferSourceConverter.toArrayBuffer(digest)
      })
    );
  }
}

CmsAttributeFactory.register(
  MessageDigestAttribute.DEFAULT_IDENTIFIER,
  MessageDigestAttribute
);
