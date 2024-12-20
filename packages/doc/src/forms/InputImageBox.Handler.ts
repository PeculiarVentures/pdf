import * as core from "@peculiarventures/pdf-core";
import { PDFDocument } from "../Document";
import { Image } from "../Image";

export interface InputImageBoxCreateParameters {
  left?: core.TypographySize;
  top?: core.TypographySize;
  width?: core.TypographySize;
  height?: core.TypographySize;
  image?: Image;
  alt?: string;
  name?: string;
}

export interface IInputImageHandler {
  document: PDFDocument;
  create(params: InputImageBoxCreateParameters): core.WidgetDictionary;
}

export class InputImageBoxHandler implements IInputImageHandler {
  public constructor(public document: PDFDocument) {}

  public create(params: InputImageBoxCreateParameters): core.WidgetDictionary {
    const update = this.document.target.update;

    const width = core.TypographyConverter.toPoint(params.width || 0);
    const height = core.TypographyConverter.toPoint(params.height || 0);
    const x = core.TypographyConverter.toPoint(params.left ?? 0);
    const y = core.TypographyConverter.toPoint(params.top ?? height) - height;

    const widget = core.SingleWidgetDictionary.create(update);
    widget.ft = "Btn";
    widget.ff = core.ButtonFlags.pushbutton;
    widget.t = this.document.target.createString(
      params.name || core.UUID.generate()
    );
    widget.rect.llX = x;
    widget.rect.llY = y;
    widget.rect.urX = x + width;
    widget.rect.urY = y + height;
    // widget.bs = core.BorderStyleDictionary.create(update);
    // widget.bs.s = core.BorderStyle.solid;
    // widget.bs.w = 2;

    const mk = widget.MK.get();
    mk.tp = core.CaptionPosition.noCaption;
    // mk.bc = this.document.target.createArray(
    //   this.document.target.createNumber(0.5),
    //   this.document.target.createNumber(0.5),
    //   this.document.target.createNumber(0.5),
    // );
    // mk.bg = this.document.target.createArray(
    //   this.document.target.createNumber(0.5),
    //   this.document.target.createNumber(0.5),
    //   this.document.target.createNumber(0.5),
    // );
    if (params.alt) {
      mk.ca = this.document.target.createString(params.alt);
    }
    const a = widget.A.get();
    a.s = "JavaScript";
    a.set(
      "JS",
      this.document.target.createString("event.target.buttonImportIcon();")
    );

    const acroForm = update.catalog!.AcroForm.get();

    acroForm.addField(widget);

    return widget;
  }
}
