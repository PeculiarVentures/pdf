import { Convert } from "pvtsutils";
import { BadCharError } from "../BadCharError";
import { CharSet } from "../CharSet";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { PDFTextString } from "./TextString";

export class PDFHexString extends PDFTextString {

  public toArrayBuffer(): ArrayBuffer {
    return Convert.FromHex(this.text);
  }

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString(`<${this.text}>`);
  }

  protected onFromPDF(reader: ViewReader): void {
    // Check out <
    if (reader.readByte() !== CharSet.lessThanChar) {
      throw new BadCharError(reader.position - 1);
    }

    // Get all hexadecimal chars till the >
    const hexStrings: number[] = [];
    reader.read((c) => {
      if (c === CharSet.greaterThanChar) { // >
        return true;
      } if (CharSet.hexadecimalChars.includes(c)) { // use hexadecimal chars only
        hexStrings.push(c);
      } else if (!CharSet.whiteSpaceChars.includes(c)) { // skip white spaces
        throw new BadCharError(reader.position);
      }

      return false;
    });

    // Set values
    this.text = Convert.ToBinary(new Uint8Array(hexStrings));

    reader.readByte(); // >
  }

  public get data(): Uint8Array {
    return new Uint8Array(Convert.FromHex(this.text));
  }

  public override toString(): string {
    return `<${this.text}>`;
  }

}
