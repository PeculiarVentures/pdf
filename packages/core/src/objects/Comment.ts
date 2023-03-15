import { Convert } from "pvtsutils";
import { BadCharError } from "../errors";
import { CharSet } from "../CharSet";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { PDFString } from "./String";

export class PDFComment extends PDFString {

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString(`% ${this.text}`);
  }

  protected onFromPDF(reader: ViewReader): void {
    if (reader.readByte() !== CharSet.percentChar) {
      throw new BadCharError(reader.position - 1);
    }

    const textView = reader.read((c) => c === 0x0d || c === 0x0A);
    this.text = Convert.ToUtf8String(textView)
      .trim();
  }

  public override toString(): string {
    return `% ${this.text}`;
  }

}
