import * as core from "@peculiar/pdf-core";
import { PDFDocument } from "../Document";

export interface IFormComponentCreateParameters {
  /**
   * Typography size of the component left position
   */
  left?: core.TypographySize;
  /**
   * Typography size of the component top position
   */
  top?: core.TypographySize;
  /**
   * Color of the component fore
   */
  foreColor?: core.Colors;
  /**
   * Color of the component background
   */
  backgroundColor?: core.Colors;
  /**
   * Color of the component border
   */
  borderColor?: core.Colors;
  /**
   * Typography size of the component border
   */
  borderWidth?: core.TypographySize;
  /**
   * Typography size of the component width
   */
  width?: core.TypographySize;
  /**
   * Typography size of the component height
   */
  height?: core.TypographySize;
  /**
   * Unique name of the Form component. Default is UUID.
   */
  name?: string;
}

export interface IFormComponentParameters {
  name: string;
  left: number;
  top: number;
  foreColor: core.Colors;
  backgroundColor: core.Colors;
  borderColor: core.Colors;
  borderWidth: number;
  width: number;
  height: number;
}

export interface IFormComponentHandler {
  document: PDFDocument;
  create(params: IFormComponentCreateParameters): core.WidgetDictionary;
}

export abstract class FormComponentHandler implements IFormComponentHandler {
  public DEFAULT_WIDTH = 18;
  public DEFAULT_HEIGHT = 18;
  public DEFAULT_BORDER_COLOR: core.Colors = 0;
  public DEFAULT_BORDER_WIDTH = 1;
  public DEFAULT_FORE_COLOR: core.Colors = 0;
  public DEFAULT_BACKGROUND_COLOR: core.Colors = 1;

  public constructor(public document: PDFDocument) {}

  public abstract create(
    params: IFormComponentCreateParameters
  ): core.WidgetDictionary;

  public getParameters(
    params: IFormComponentCreateParameters
  ): IFormComponentParameters {
    const left = core.TypographyConverter.toPoint(params.left || 0);
    const width = core.TypographyConverter.toPoint(
      params.width || this.DEFAULT_WIDTH
    );
    const height = core.TypographyConverter.toPoint(
      params.height || this.DEFAULT_HEIGHT
    );
    const top =
      left | width | height
        ? core.TypographyConverter.toPoint(params.top || 0)
        : 0;

    return {
      name: params.name || core.UUID.generate(),
      // position
      left,
      top,
      width,
      height,
      // border
      borderColor: params.borderColor ?? this.DEFAULT_BORDER_COLOR,
      borderWidth: core.TypographyConverter.toPoint(
        params.borderWidth ?? this.DEFAULT_BORDER_WIDTH
      ),
      // colors
      backgroundColor: params.backgroundColor ?? this.DEFAULT_BACKGROUND_COLOR,
      foreColor: params.foreColor ?? this.DEFAULT_FORE_COLOR
    };
  }

  /**
   * Set style annotations
   * @param widget
   * @param params
   */
  protected setStyle(
    widget: core.WidgetDictionary,
    params: IFormComponentParameters
  ): void {
    const mk = widget.MK.get();
    mk.BG = core.ColorConverter.toPDFArray(params.backgroundColor);
    if (params.borderWidth) {
      const bs = widget.BS.get();
      bs.S = core.BorderStyle.solid;
      bs.W = params.borderWidth;
      mk.BC = core.ColorConverter.toPDFArray(params.borderColor);
    }

    this.setFontStyle(widget, params);
  }

  protected setFontStyle(
    widget: core.WidgetDictionary,
    params: IFormComponentParameters
  ): void {
    const content = new core.PDFContent();
    content.setColor(params.foreColor);

    widget.set("DA", this.document.target.createString(content.toString()));
  }

  /**
   * Get AcroForm dictionary from the document.
   * @returns AcroForm dictionary.
   * @throws Error if Catalog is not defined.
   *
   * @remarks
   * If AcroForm is not defined, it will be created.
   */
  protected getAcroForm(): core.InteractiveFormDictionary {
    const catalog = this.document.target.update.catalog;
    if (!catalog) {
      throw new Error("Catalog is not defined");
    }

    return catalog.AcroForm.get();
  }
}
