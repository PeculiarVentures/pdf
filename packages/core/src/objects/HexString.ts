import { Convert } from "pvtsutils";
import { BadCharError } from "../BadCharError";
import { CharSet } from "../CharSet";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { TextEncoder } from "./TextEncoder";
import { PDFTextString } from "./TextString";

export class PDFHexString extends PDFTextString {

  protected onWritePDF(writer: ViewWriter): void {
    const encText = TextEncoder.to(this.text);
    writer.writeString(`<${Convert.ToHex(Convert.FromBinary(encText))}>`);
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
    const hexString = Convert.ToBinary(new Uint8Array(hexStrings));
    const hexView = Convert.FromHex(hexString);
    this.text = TextEncoder.from(Convert.ToBinary(hexView));

    reader.readByte(); // >
  }

  public get data(): Uint8Array {
    return new Uint8Array(Convert.FromHex(this.text));
  }

  public override toString(): string {
    return `<${Convert.ToHex(this.toUint8Array())}>`;
  }

}
