import { Convert } from "pvtsutils";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { BadCharError } from "../BadCharError";
import { ParsingError } from "../ParsingError";
import { PDFTextString } from "./TextString";
import { TextEncoder } from "./TextEncoder";

const leftParenthesisChar = 0x28;
const rightParenthesisChar = 0x29;

export class PDFLiteralString extends PDFTextString {

  protected onWritePDF(writer: ViewWriter): void {

    const text = TextEncoder.to(this.text);

    // eslint-disable-next-line no-control-regex
    const escapedValue = text.replace(/[\n\r\t\f\x08\\()]/gm, (substring) => {
      switch (true) {
        case (substring === "\n"):
          return "\\n";
        case (substring === "\r"):
          return "\\r";
        case (substring === "\t"):
          return "\\t";
        case (substring === "\b"):
          return "\\b";
        case (substring === "\f"):
          return "\\f";
        case (substring === "("):
          return "\\(";
        case (substring === ")"):
          return "\\)";
        case (substring === "\\"):
          return "\\\\";
        default:
          return substring;
      }
    });

    return writer.writeString(`(${escapedValue})`);
  }

  public static getMaxUnicode(text: string): number {
    let maxUnicode = 0;
    for (const char of text) {
      const unicode = char.charCodeAt(0);
      if (unicode > maxUnicode) {
        maxUnicode = unicode;
      }
    }

    return maxUnicode;
  }

  protected onFromPDF(reader: ViewReader): void {
    if (reader.readByte() !== leftParenthesisChar) {
      throw new BadCharError(reader.position - 1);
    }

    //#region Get begin/end indexes of the string block
    let depth = 1;
    let reverseSolidus = 0;
    const data = reader.read((c) => {
      if (c === 0x5C) { // \
        reverseSolidus ^= 1;

        return false;
      }

      if (reverseSolidus && (c === leftParenthesisChar || c === rightParenthesisChar)) {
        reverseSolidus = 0;

        return false;
      }

      if (c === leftParenthesisChar) { // (
        depth++;
      } else if (c === rightParenthesisChar) { // )
        if (!--depth) {
          return true;
        }
      }

      reverseSolidus = 0;

      return false;
    });
    //#endregion

    if (depth) {
      throw new ParsingError("Cannot find out RIGHT PARENTHESIS for literal string");
    }

    // Prepare text
    const text = Convert.ToBinary(data)
      .replace(/\\([0-7]{1,3}|\r\n|\n|\r|.)/gm, (substring, group1: string) => {
        switch (true) {
          case (substring === "\\n"):
            return "\n";
          case (substring === "\\r"):
            return "\r";
          case (substring === "\\t"):
            return "\t";
          case (substring === "\\b"):
            return "\b";
          case (substring === "\\f"):
            return "\f";
          case (substring === "\\("):
            return "(";
          case (substring === "\\)"):
            return ")";
          case (substring === "\\\\"):
            return "\\";
          case (substring === "\\\r\n"):
          case (substring === "\\\n"):
          case (substring === "\\\r"):
            return "";
          case (/[0-7]{1,3}/.test(group1)): {
            return globalThis.String.fromCharCode(parseInt(group1, 8));
          }
          default:
            return group1;
        }
      });

    this.text = TextEncoder.from(text);

    reader.readByte(); // )
  }

  public override toString(): string {
    return `(${this.text})`;
  }

}
