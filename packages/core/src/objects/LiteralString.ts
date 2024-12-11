import { Convert } from "pvtsutils";
import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { ObjectTypeEnum } from "./internal";
import { PDFTextString } from "./TextString";
import { TextEncoder } from "./TextEncoder";

const leftParenthesisChar = 0x28;
const rightParenthesisChar = 0x29;

export class PDFLiteralString extends PDFTextString {
  public static readonly NAME = ObjectTypeEnum.LiteralString;

  // Cache regex patterns
  // eslint-disable-next-line no-control-regex
  private static readonly ESCAPE_PATTERN = /[\n\r\t\f\x08\\()]/gm;
  private static readonly OCTAL_PATTERN = /[0-7]{1,3}/;
  private static readonly PARSE_PATTERN = /\\([0-7]{1,3}|\r\n|\n|\r|.)/gm;

  // Static escape maps for better performance
  private static readonly WRITE_ESCAPE_MAP = new Map([
    ["\n", "\\n"],
    ["\r", "\\r"],
    ["\t", "\\t"],
    ["\b", "\\b"],
    ["\f", "\\f"],
    ["(", "\\("],
    [")", "\\)"],
    ["\\", "\\\\"]
  ]);

  private static readonly READ_ESCAPE_MAP = new Map([
    ["\\n", "\n"],
    ["\\r", "\r"],
    ["\\t", "\t"],
    ["\\b", "\b"],
    ["\\f", "\f"],
    ["\\(", "("],
    ["\\)", ")"],
    ["\\\\", "\\"],
    ["\\\r\n", ""],
    ["\\\n", ""],
    ["\\\r", ""]
  ]);

  protected onWritePDF(writer: ViewWriter): void {
    const text = TextEncoder.to(this.text);
    const escapedValue = text.replace(
      PDFLiteralString.ESCAPE_PATTERN,
      (char) => PDFLiteralString.WRITE_ESCAPE_MAP.get(char) || char
    );
    return writer.writeString(`(${escapedValue})`);
  }

  /**
   * Returns the highest Unicode code point value found in the given string.
   *
   * @param text - The string to search for the highest Unicode code point.
   * @returns The highest Unicode code point value found in the string.
   */
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

    const { data, depth } = this.readStringData(reader);

    if (depth !== 0) {
      throw new Error("Missing closing parenthesis in literal string");
    }

    const text = Convert.ToBinary(data).replace(
      PDFLiteralString.PARSE_PATTERN,
      (substring, group1: string) => {
        const escaped = PDFLiteralString.READ_ESCAPE_MAP.get(substring);
        if (escaped !== undefined) {
          return escaped;
        }

        if (PDFLiteralString.OCTAL_PATTERN.test(group1)) {
          return String.fromCharCode(parseInt(group1, 8));
        }

        return group1;
      }
    );

    this.text = TextEncoder.from(text);
    reader.readByte(); // )
  }

  /**
   * Reads string data from the provided `ViewReader` instance.
   *
   * This method processes the input data to handle nested parentheses and escape sequences.
   * It reads until it finds a matching closing parenthesis for the initial opening parenthesis.
   *
   * @param reader - The `ViewReader` instance to read data from.
   * @returns An object containing the read data as a `Uint8Array` and the final depth of nested parentheses.
   *
   * @remarks
   * - The method keeps track of the depth of nested parentheses.
   * - It handles escape sequences denoted by the backslash (`\`) character.
   * - The method stops reading when the depth of nested parentheses reaches zero.
   */
  private readStringData(reader: ViewReader): {
    data: Uint8Array;
    depth: number;
  } {
    let depth = 1;
    let reverseSolidus = 0;
    const data = reader.read((c) => {
      if (c === 0x5c) {
        // \
        reverseSolidus ^= 1;
        return false;
      }

      if (
        reverseSolidus &&
        (c === leftParenthesisChar || c === rightParenthesisChar)
      ) {
        reverseSolidus = 0;
        return false;
      }

      if (c === leftParenthesisChar) {
        depth++;
      } else if (c === rightParenthesisChar) {
        depth--;
        if (depth === 0) {
          return true;
        }
      }

      reverseSolidus = 0;
      return false;
    });

    return { data, depth };
  }

  public override toString(): string {
    return `(${this.text})`;
  }
}
