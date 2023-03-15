import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";

import { BadCharError } from "../errors";
import { PDFObject } from "./Object";

const nullChars = new Uint8Array([0x6e, 0x75, 0x6c, 0x6c]); // null

export class PDFNull extends PDFObject {

  protected onWritePDF(writer: ViewWriter): void {
    writer.write(nullChars);
  }

  protected onFromPDF(reader: ViewReader): void {
    if (!nullChars.every(c => c === reader.readByte())) {
      throw new BadCharError(reader.position - 1);
    }
  }

  public override toString(): string {
    return "null";
  }

  protected onEqual(target: PDFObject): boolean {
    return target instanceof PDFNull;
  }

}
