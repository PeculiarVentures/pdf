import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import type { PDFObject } from "./Object";
import type { PDFObjectTypes } from "./ObjectReader";

import { PDFIndirect } from "./Indirect";

export class PDFIndirectReference extends PDFIndirect {

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
  public getValue(type?: any): any {
    if (this.documentUpdate) {
      const value = this.documentUpdate.document.getObject(this).value;

      return PDFTypeConverter.convert(value, type);
    }

    throw new Error("IndirectReference is not assigned to DocumentUpdate");
  }

  public override toString(): string {
    return `${this.id} ${this.generation} R`;
  }

}

import { PDFNumeric } from "./Numeric";
import { PDFTypeConverter } from "./TypeConverter";
