import { TimeStampToken } from "../TimeStampToken";
import { CmsAttribute } from "./Attribute";
import { CmsAttributeFactory } from "./AttributeFactory";

export class TimeStampTokenAttribute extends CmsAttribute {

  public static readonly DEFAULT_IDENTIFIER = "1.2.840.113549.1.9.16.2.14";

  #token?: TimeStampToken;
  public get token(): TimeStampToken {
    if (!this.#token) {
      this.#token = TimeStampToken.fromSchema(this.asn.values[0]);
    }

    return this.#token;
  }

  public set token(value: TimeStampToken) {
    this.#token = value;

    const schema = value.asn.toSchema();
    if (this.asn.values.length) {
      this.asn.values[0] = schema;
    } else {
      this.asn.values.push(schema);
    }
  }

  public constructor(token?: TimeStampToken) {
    super();

    this.asn.type = TimeStampTokenAttribute.DEFAULT_IDENTIFIER;
    if (token) {
      this.token = token;
    }
  }

}

CmsAttributeFactory.register(TimeStampTokenAttribute.DEFAULT_IDENTIFIER, TimeStampTokenAttribute);
