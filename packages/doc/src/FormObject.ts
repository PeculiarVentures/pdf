import * as core from "@peculiarventures/pdf-core";
import { type PDFDocument } from "./Document";
import { ResourceManager } from "./ResourceManager";
import { WrapContentObject } from "./WrapContentObject";

export class FormObject extends WrapContentObject<core.FormDictionary> {

  public static create(document: PDFDocument, width: core.TypographySize = 0, height: core.TypographySize = 0): FormObject {
    const formDict = core.FormDictionary.create(document.target.update)
      .makeIndirect();

    formDict.bBox.llX = 0;
    formDict.bBox.llY = 0;
    formDict.bBox.urX = core.TypographyConverter.toPoint(width);
    formDict.bBox.urY = -core.TypographyConverter.toPoint(height);

    return new FormObject(formDict, document);
  }

  protected get content(): core.PDFContent {
    return this.target.content;
  }

  public get resources(): ResourceManager {
    return new ResourceManager(this.target.Resources.get(), this.document);
  }

  public get width(): number {
    const bBox = this.target.bBox;

    return Math.abs(bBox.urX - bBox.llX);
  }

  public set width(v: core.TypographySize) {
    this.target.bBox.urX = core.TypographyConverter.toPoint(v);
  }

  public get height(): number {
    const bBox = this.target.bBox;

    return Math.abs(bBox.urY - bBox.llY);
  }

  public set height(v: core.TypographySize) {
    if (this.height !== v) {
      if (this.target.bBox.urY < 0) {
        this.target.bBox.urY -= core.TypographyConverter.toPoint(v) - this.height;
      } else {
        this.target.bBox.urY += core.TypographyConverter.toPoint(v) - this.height;
      }
    }
  }

  public get left(): number {
    const { llX, urX } = this.target.bBox;
    const minX = Math.min(llX, urX);

    return minX;
  }

  public get bottom(): number {
    const { llY, urY } = this.target.bBox;
    const minY = Math.min(llY, urY);

    return minY;
  }

}
