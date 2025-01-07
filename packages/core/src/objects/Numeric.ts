import { Convert } from "pvtsutils";

import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";

import { ParsingError } from "../errors";
import { isDigit, ObjectTypeEnum } from "./internal";
import { PDFObject } from "./Object";

/**
 * Represents a numeric object in a PDF document.
 * Numeric objects are used to represent integers or real numbers.
 */
export class PDFNumeric extends PDFObject {
  public static readonly NAME = ObjectTypeEnum.Numeric;

  public static assertPositiveInteger(
    number: PDFNumeric
  ): asserts number is PDFNumeric {
    if (!(number.value >>> 0 === parseFloat(number.value.toString()))) {
      throw new Error("Number is not a positive integer");
    }
  }

  /** The value of the numeric object */
  public value;

  public constructor(value?: number) {
    super();

    this.value = value ?? 0;
  }

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString(this.toString());
  }

  protected onFromPDF(reader: ViewReader): void {
    const view = reader.read((c) => !isDigit(c));

    if (!view.length) {
      throw new ParsingError(
        `Numeric sequence not found at position ${reader.position}`,
        reader.position
      );
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
    return target instanceof PDFNumeric && target.value === this.value;
  }
}
