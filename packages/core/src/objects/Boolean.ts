import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { ObjectTypeEnum } from "./internal";
import { PDFObject } from "./Object";

const falseChars = new Uint8Array([0x66, 0x61, 0x6c, 0x73, 0x65]);
const trueChars = new Uint8Array([0x74, 0x72, 0x75, 0x65]);

export class PDFBoolean extends PDFObject {
  public static readonly NAME = ObjectTypeEnum.Boolean;

  constructor();
  constructor(value: boolean);
  constructor(public value = false) {
    super();
  }

  protected onWritePDF(writer: ViewWriter): void {
    if (this.value) {
      writer.write(trueChars);
    } else {
      writer.write(falseChars);
    }
  }

  protected onFromPDF(reader: ViewReader): void {
    const firstChar = reader.view[reader.position];

    switch (firstChar) {
      case 0x74: { // t
        if (!trueChars.every((c) => c === reader.readByte())) {
          throw new BadCharError(reader.position - 1);
        }
        this.value = true;
        break;
      }
      case 0x66: { // f
        if (!falseChars.every((c) => c === reader.readByte())) {
          throw new BadCharError(reader.position - 1);
        }
        this.value = false;
        break;
      }
      default:
        throw new BadCharError(reader.position);
    }
  }

  protected override onCopy(copy: PDFBoolean): void {
    super.onCopy(copy);

    copy.value = this.value;
  }

  public override toString(): string {
    return this.value ? "true" : "false";
  }

  protected onEqual(target: PDFObject): boolean {
    return target instanceof PDFBoolean && target.value === this.value;
  }
}
