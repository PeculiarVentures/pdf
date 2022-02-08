import * as core from "@peculiarventures/pdf-core";
import { PDFDocument } from "./Document";
import { FontComponent, TextBlockParams } from "./Font";
import { FormObject } from "./FormObject";
import { PDFPage } from "./Page";

export interface BorderParameters {
  color?: core.Colors;
  width: core.TypographySize
  length: number;
  height: number;
}
export interface TextEditorCreateParameters {
  left?: core.TypographySize;
  top?: core.TypographySize;
  /**
   * default 0 (black)
   */
  color?: core.Colors;
  text: string;
  font?: FontComponent;
  /**
   * default 12
   */
  fontSize?: number;
  width: core.TypographySize;
  height: core.TypographySize;
  /**
   * Max count symbols
   */
  maxLen?: number;
  multiline?: boolean;
}
export interface TextEditorDrawParameters {
  /**
   * default 0 (black)
   */
  color?: core.Colors;
  text: string;
  font: FontComponent;
  /**
   * default 12
   */
  fontSize: number;
  width: core.TypographySize;
  height: core.TypographySize;
  multiline?: boolean;
  maxLen?: number;
}

export interface ITextEditorHandler {
  document: PDFDocument
  create(params: TextEditorCreateParameters, page: PDFPage): core.WidgetDictionary
}

export class TextEditorHandler implements ITextEditorHandler {

  public static readonly PADDING = 1;
  public static readonly COLOR = 0;
  public static readonly MAX_LEN = 0;

  public constructor(public document: PDFDocument) { }

  private getSingleLineText(text: string): string {
    return text.replace(/\n/g, " ");
  }

  public drawText(form: FormObject, params: TextEditorDrawParameters): void {
    params.fontSize ??= FontComponent.DEFAULT_SIZE;
    const fontInfo = params.font.fontInfo;
    const scale = params.fontSize / fontInfo.unitsPerEm;
    const ascent = fontInfo.ascent * scale;
    const descent = fontInfo.descent * scale;

    const padding = TextEditorHandler.PADDING;
    const x = padding;
    const y = params.multiline ?
      padding :
      (form.height - ascent + descent) / 2 + padding;

    // draw content
    const textContent = form
      .text(true)
      .graphics()
      // Clip rec
      .rect(padding, padding, form.width - padding * 2, form.height - padding * 2)
      .clip()
      .pathEnd()
      .text();

    if (params.multiline) {
      textContent
        .graphics()
        .drawText({
          width: params.width,
          // align: TextAlignment.right,
          blocks: [
            {
              text: params.text,
              font: params.font,
              style: {
                color: params.color,
                size: params.fontSize,
              }
            }
          ]
        }, x, y);
    } else {
      textContent
        .color(params.color || TextEditorHandler.COLOR)
        .font(params.font, params.fontSize)
        .move(x, y);

      const text = this.getSingleLineText(params.text);
      textContent.show(text);
    }
  }

  public create(params: TextEditorCreateParameters): core.WidgetDictionary {

    let text = params.text;
    if (params.maxLen && params.maxLen > 0) {
      text = text.substr(0, params.maxLen);
    }

    const update = this.document.target.update;

    const width = core.TypographyConverter.toPoint(params.width);
    const height = core.TypographyConverter.toPoint(params.height);

    // count position
    const positionX = core.TypographyConverter.toPoint(params.left ?? 0);
    const positionY = core.TypographyConverter.toPoint(params.top ?? height) - height;

    // create widget
    if (!params.font) {
      params.font = FontComponent.addFont(this.document);
    }
    params.font.addText(text);
    params.fontSize ??= FontComponent.DEFAULT_SIZE;

    if (!params.color) {
      params.color = 0;
    }

    const widget = core.SingleWidgetDictionary.create(update);
    widget.ft = "Tx";

    if (params.multiline) {
      widget.ff = core.TextFieldFlags.multiline;
    }

    widget.set("MaxLen", new core.PDFNumeric(params.maxLen || TextEditorHandler.MAX_LEN));
    widget.t = this.document.target.createString(core.UUID.generate());
    widget.V = this.document.target.createString(text);
    widget.rect.llX = positionX;
    widget.rect.llY = positionY;
    widget.rect.urX = positionX + width;
    widget.rect.urY = positionY + height;

    // Create Yes XObject
    const yes = FormObject.create(this.document, width, -height); // Use negative value here, because Adobe doesn't draw text if BBox is in negative coordinates
    const fontRes = yes.resources.set(params.font.target);
    const da = new core.PDFContent().setFontAndSize({ font: fontRes.name, size: params.fontSize });
    da.setColor(params.color);
    widget.set("DA", this.document.target.createString(da.toString(true)));

    // Draw
    this.drawText(yes, {
      font: params.font,
      fontSize: params.fontSize,
      text,
      height: params.height,
      width: params.width,
      color: params.color,
      multiline: params.multiline,
      maxLen: params.maxLen,
    });

    widget.AP.get().N = yes.target.makeIndirect();

    const acroForm = update.catalog!.AcroForm.get();
    acroForm.addField(widget);

    return widget;
  }

}
