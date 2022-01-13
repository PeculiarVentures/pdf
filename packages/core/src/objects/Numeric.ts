import { Convert } from "pvtsutils";

import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";

import { ParsingError } from "../ParsingError";
import { PDFObject } from "./Object";

const zeroChar = 0x30;
const nineChar = 0x39;
const plusChar = 0x2b;
const minusChar = 0x2d;
const pointChar = 0x2e;

export class PDFNumeric extends PDFObject {

  public static assertPositiveInteger(number: PDFNumeric): asserts number is PDFNumeric {
    if (!(number.value >>> 0 === parseFloat(number.value.toString()))) {
      throw new Error("Number is not a positive integer");
    }
  }

  public static isDigit(char: number): boolean {
    return (zeroChar <= char && char <= nineChar) // [0-9]
      || char === plusChar // '+'
      || char === minusChar // '-'
      || char === pointChar; // '.'
  }

  public value;

  public constructor(value?: number) {
    super();

    this.value = value ?? 0;
  }


  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString(this.toString());
  }

  protected onFromPDF(reader: ViewReader): void {
    const view = reader.read(c => !PDFNumeric.isDigit(c));

    if (!view.length) {
      throw new ParsingError(`Numeric sequence not found at position ${reader.position}`, reader.position);
    }

    const value = new Number(Convert.ToUtf8String(view));
    if (Number.isNaN(value)) {
      throw new ParsingError("Parsed value is not a Number", reader.position);
    }

    this.value = value.valueOf();
  }

  public override toString(): string {
    const value = new Number(this.value);

    const digits = /\.(.+)/.exec(this.value.toString())?.[1].length || 0;

    return value.toFixed(digits > 3 ? 3 : digits);
  }

  protected override onCopy(copy: PDFNumeric): void {
    super.onCopy(copy);

    copy.value = this.value;
  }

  protected onEqual(target: PDFObject): boolean {
    return target instanceof PDFNumeric &&
      target.value === this.value;
  }

}
