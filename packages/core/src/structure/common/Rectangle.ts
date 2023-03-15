import type { PDFDocumentUpdate } from "../DocumentUpdate";
import { PDFNumeric } from "../../objects/Numeric";
import { PDFArray } from "../../objects/Array";

export class PDFRectangle extends PDFArray {

  public static createWithData(update: PDFDocumentUpdate, llX: number, llY: number, urX: number, urY: number): PDFRectangle {
    const rect = this.create(update);

    rect.get(0, PDFNumeric).value = llX;
    rect.get(1, PDFNumeric).value = llY;
    rect.get(2, PDFNumeric).value = urX;
    rect.get(3, PDFNumeric).value = urY;

    return rect;
  }

  public get llX(): number {
    return this.get(0, PDFNumeric).value;
  }

  public set llX(v: number) {
    this.modify();

    this.get(0, PDFNumeric).value = v;
  }

  public get llY(): number {
    return this.get(1, PDFNumeric).value;
  }

  public set llY(v: number) {
    this.modify();

    this.get(1, PDFNumeric).value = v;
  }

  public get urX(): number {
    return this.get(2, PDFNumeric).value;
  }

  public set urX(v: number) {
    this.modify();

    this.get(2, PDFNumeric).value = v;
  }

  public get urY(): number {
    return this.get(3, PDFNumeric).value;
  }

  public set urY(v: number) {
    this.modify();

    this.get(3, PDFNumeric).value = v;
  }

  protected override onCreate(): void {
    this.items = [new PDFNumeric(0), new PDFNumeric(0), new PDFNumeric(0), new PDFNumeric(0)];
  }

  public getCoordinates(): Array<number> {

    if (this.items.length !== 4) {
      throw new Error("The rectangle must have 4 coordinates");
    }

    const result = this.items.map(o => {
      if (!(o instanceof PDFNumeric)) {
        throw new Error("All rectangle coordinates must be numbers");
      }

      return o.value;
    });

    return result;

  }
}
