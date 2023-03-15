import { Convert } from "pvtsutils";

import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";

import { PDFString } from "./String";

const exclamationMarkChar = 0x21;
const tildeChar = 0x7e;
const solidusChar = 0x2f;
const deprecatedChars = [0x2f, 0x28, 0x29, 0x5b, 0x5d, 0x3c, 0x3e, 0x7b, 0x7d, 0x25];

export class PDFName extends PDFString {

  public static isNameChar(char: number): boolean {
    return !((char < exclamationMarkChar || tildeChar < char)
      || deprecatedChars.includes(char));
  }

  protected onWritePDF(writer: ViewWriter): void {
    const escapedValue = this.text
      .replace(/[^!-~]|[[\]<>(){}%#/]/gm, (substring) => // Encode irregular chars to '#dd'
        `#${substring.charCodeAt(0).toString(16).padStart(2, "0")}`
      );

    return writer.writeString(`/${escapedValue}`);
  }

  protected onFromPDF(reader: ViewReader): void {
    if (reader.readByte() !== solidusChar) {
      throw new BadCharError(reader.position - 1);
    }

    const textView = reader.read(v => !PDFName.isNameChar(v));
    this.text = Convert.ToUtf8String(textView)
      .replace(/#([0-9A-F]{2})/gim, (substring, group1: string) => // Encode '#dd' to char
        String.fromCharCode(parseInt(group1, 16))
      );
  }

  public override toString(): string {
    return `/${this.text}`;
  }

}
