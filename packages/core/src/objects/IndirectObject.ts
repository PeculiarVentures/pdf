import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { PDFIndirect } from "./Indirect";

const objChars = new Uint8Array([0x6f, 0x62, 0x6a]); // obj
const endobjChars = new Uint8Array([0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a]); // endobj

export class PDFIndirectObject extends PDFIndirect {
  public value: PDFObject;

  public constructor();
  public constructor(id?: number, generation?: number, value?: PDFObject);
  public constructor(
    id?: number,
    generation = 0,
    value: PDFObject = new PDFNull()
  ) {
    if (id === undefined) {
      super();
    } else {
      super(id, generation);
    }

    this.value = value || new PDFNull();
    this.value.ownerElement = this;
  }

  protected onWritePDF(writer: ViewWriter): void {
    const objectNumber = new PDFNumeric(this.id).toString();
    const generationNumber = new PDFNumeric(this.generation).toString();

    writer.writeString(`${objectNumber} ${generationNumber} obj\n`);
    this.value.writePDF(writer);
    writer.writeString("\nendobj\n");
  }

  protected override onFromPDF(reader: ViewReader): void {
    super.onFromPDF(reader);

    // obj
    if (!objChars.every((c) => c === reader.readByte())) {
      throw new BadCharError(reader.position - 1);
    }

    PDFObjectReader.skip(reader);
    this.value = PDFObjectReader.read(reader, this.documentUpdate, this);
    this.adoptChild(this.value);
    PDFObjectReader.skip(reader);

    // endobj
    if (!endobjChars.every((c) => c === reader.readByte())) {
      throw new BadCharError(reader.position - 1);
    }
  }
  public override adoptChild(obj: PDFObject): void {
    super.adoptChild(obj);

    obj.ownerElement = this;
  }

  protected override onCopy(copy: PDFIndirectObject): void {
    super.onCopy(copy);

    copy.value = this.value.copy();
  }

  public override toString(): string {
    return `${this.id} ${this.generation} obj\n${this.value.toString()}\nendobj`;
  }
}

import type { PDFObject } from "./Object";
import { PDFNumeric } from "./Numeric";
import { PDFNull } from "./Null";
import { PDFObjectReader } from "./ObjectReader";
