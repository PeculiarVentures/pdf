import * as asn1js from "asn1js";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import { AsnEncoded } from "../AsnEncoded";
import { Attribute } from "../PKITypes";
const pkijs = require("pkijs");

export interface CmsAttributeConstructor {
  new(): CmsAttribute;
}

export class CmsAttribute extends AsnEncoded<Attribute> {

  public get type(): string {
    return this.asn.type;
  }

  public get values(): ReadonlyArray<ArrayBuffer> {
    return this.asn.values.map((o: any) => o.toBER ? o.toBER() : o.toSchema().toBER());
  }

  public constructor();
  public constructor(type: string, values: BufferSource[]);
  public constructor(type?: string, values?: BufferSource[]) {
    super();

    this.asn = new pkijs.Attribute();
    if (type && values) {
      this.asn.type = type;
      this.asn.values = values.map(o => {
        const raw = BufferSourceConverter.toArrayBuffer(o);
        const asn = asn1js.fromBER(raw);
        if (asn.offset === -1) {
          throw new Error("Wrong ASN.1 encoded Attribute value");
        }

        this.asn.values.push(asn.result);
      });
    }
  }

  protected onFromSchema(schema: any): any {
    return new pkijs.Attribute({ schema });
  }

}
