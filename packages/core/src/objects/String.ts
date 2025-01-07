import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import { PDFObject } from "./Object";

export abstract class PDFString extends PDFObject {
  public static DEFAULT_TEXT = "";

  public text = PDFString.DEFAULT_TEXT;

  constructor();
  constructor(view: BufferSource);
  constructor(string: PDFString);
  constructor(text: string);
  constructor(param?: PDFString | string | BufferSource);
  constructor(param?: PDFString | string | BufferSource) {
    super();

    if (param instanceof PDFString) {
      // PDF string
      this.view = param.view;
      this.text = param.text;
    } else if (typeof param === "string") {
      // string
      this.text = param;
    } else if (BufferSourceConverter.isBufferSource(param)) {
      this.text = Convert.ToBinary(param);
    }
  }

  protected override onCopy(copy: PDFString): void {
    super.onCopy(copy);

    copy.text = this.text;
  }

  protected onEqual(target: PDFObject): boolean {
    return target instanceof PDFString && target.text === this.text;
  }
}
