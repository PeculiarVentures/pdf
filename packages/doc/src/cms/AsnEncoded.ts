/* eslint-disable @typescript-eslint/no-explicit-any */

import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";

export type AsnEncodedStringFormat = "hex" | "base64" | "base64url";

export abstract class AsnEncoded<TAsn extends pkijs.PkiObject = any> {

  /**
   * Creates new object from the ASN.1 encoded buffer source
   * @param raw Buffer source
   * @returns New object
   */
  public static fromBER<T extends AsnEncoded>(this: new () => T, raw: BufferSource): T {
    const item = new this();
    item.fromBER(raw);

    return item;
  }

  public static fromSchema<T extends AsnEncoded>(this: new () => T, schema: any): T {
    const item = new this();
    item.fromSchema(schema);

    return item;
  }

  /**
   * @internal
   */
  public asn!: TAsn;

  /**
   * Loads data from the ASN.1 schema
   * @param raw Buffer source
   */
  public fromBER(raw: BufferSource): void {
    const arrayBuffer = BufferSourceConverter.toArrayBuffer(raw);
    const asn = asn1js.fromBER(arrayBuffer);

    if (asn.offset === -1) {
      throw new Error(`Invalid ASN.1 data. ${asn.result.error}`);
    }

    this.fromSchema(asn.result);
  }

  /**
   * Loads data from the ASN.1 schema
   * @param schema ASN.1 schema
   * @returns PKI class
   */
  protected abstract onFromSchema(schema: any): any;

  public fromSchema(schema: any): void {
    this.asn = this.onFromSchema(schema);
  }

  public toSchema(): pkijs.SchemaType {
    return this.asn.toSchema();
  }

  public toBER(): ArrayBuffer {
    return this.toSchema().toBER();
  }

  public toString(encoding: AsnEncodedStringFormat = "hex") {
    return Convert.ToString(this.toBER(), encoding);
  }
}
