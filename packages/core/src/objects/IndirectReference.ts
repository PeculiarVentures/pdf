import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import type { PDFObject } from "./Object";
import { PDFObjectTypes } from "./ObjectTypes";

import { ObjectTypeEnum } from "./internal";
import { PDFIndirect } from "./Indirect";

export class PDFIndirectReference extends PDFIndirect {

  public static readonly NAME = ObjectTypeEnum.IndirectReference;

  protected onWritePDF(writer: ViewWriter): void {
    const objectNumber = new PDFNumeric(this.id).toString();
    const generationNumber = new PDFNumeric(this.generation).toString();

    return writer.writeString(`${objectNumber} ${generationNumber} R`);
  }

  protected override onFromPDF(reader: ViewReader): void {
    super.onFromPDF(reader);

    if (reader.readByte() !== 0x52) { // R
      throw new BadCharError(reader.position - 1);
    }
  }

  public getValue(): PDFObjectTypes;
  public getValue<T extends PDFObject>(type: abstract new () => T): T;
  public getValue(type?: abstract new () => PDFObject): PDFObjectTypes {
    if (this.documentUpdate) {
      const value = this.documentUpdate.document.getObject(this).value;

      return PDFTypeConverter.convert(value, type as new () => PDFObject) as PDFObjectTypes;
    }

    throw new Error("IndirectReference is not assigned to DocumentUpdate");
  }

  public override toString(): string {
    return `${this.id} ${this.generation} R`;
  }

}

import { PDFNumeric } from "./Numeric";
import { PDFTypeConverter } from "./TypeConverter";
