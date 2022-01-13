import { BadCharError } from "../BadCharError";
import type { ViewReader } from "../ViewReader";
import { IPDFIndirect, PDFObject } from "./Object";

export abstract class PDFIndirect extends PDFObject implements IPDFIndirect {

  public constructor();
  public constructor(id: number, generation?: number);
  public constructor(
    public id = 0,
    public generation = 0,
  ) {
    super();
  }

  protected onFromPDF(reader: ViewReader): void {
    const objectNumber = PDFNumeric.fromPDF(reader);
    PDFNumeric.assertPositiveInteger(objectNumber);

    if (reader.readByte() !== 0x20) { // white space
      throw new BadCharError(reader.position - 1);
    }

    const generationNumber = PDFNumeric.fromPDF(reader);
    PDFNumeric.assertPositiveInteger(objectNumber);

    if (reader.readByte() !== 0x20) { // white space
      throw new BadCharError(reader.position - 1);
    }

    this.id = objectNumber.value;
    this.generation = generationNumber.value;
  }

  protected override onCopy(copy: PDFIndirect): void {
    super.onCopy(copy);

    copy.id = this.id;
    copy.generation = this.generation;
  }

  protected onEqual(target: PDFObject): boolean {
    return target instanceof PDFIndirect &&
      target.id === this.id &&
      target.generation === this.generation;
  }

}

import { PDFNumeric } from "./Numeric";
