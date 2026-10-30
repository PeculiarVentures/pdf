import { binary } from "@peculiar/utils";
import { BadCharError } from "../errors";
import { CharSet } from "../CharSet";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { ObjectTypeEnum } from "./internal";
import { PDFString } from "./String";

export class PDFComment extends PDFString {
  public static readonly NAME = ObjectTypeEnum.Comment;

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString(`% ${this.text}`);
  }

  protected onFromPDF(reader: ViewReader): void {
    if (reader.readByte() !== CharSet.percentChar) {
      throw new BadCharError(reader.position - 1);
    }

    // Comments are bytes, written back one byte per character (see ViewWriter.writeString).
    const textView = reader.read((c) => c === 0x0d || c === 0x0a);
    this.text = binary.encode(textView).trim();
  }

  public override toString(): string {
    return `% ${this.text}`;
  }
}
