import * as core from "@peculiarventures/pdf-core";
import { PDFDocument } from "../Document";
import { FontComponent } from "../Font";
import { FormObject } from "../FormObject";
import { PDFPage } from "../Page";
import { FormComponentFactory } from "./FormComponent.Factory";
import { TextEditorAlignment } from "./TextEditor";

export interface BorderParameters {
  color?: core.Colors;
  width: core.TypographySize;
  length: number;
  height: number;
}
export interface TextEditorCreateParameters {
  /**
   * Name of the field
   */
  name?: string;
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
  document: PDFDocument;
  create(params: TextEditorCreateParameters, page: PDFPage): core.WidgetDictionary;
}

export class TextEditorHandler implements ITextEditorHandler {

  public static readonly PADDING = 1;
  public static readonly COLOR = 0;
  public static readonly MAX_LEN = 0;

  public constructor(public document: PDFDocument) { }

  private getSingleLineText(text: string): string {
    return text.replace(/\n/g, " ");
  }

  public drawText(form: FormObject, params: TextEditorDrawParameters, target: core.WidgetDictionary): void {
    if (params.text.length === 0) {
      return;
    }

    const padding = TextEditorHandler.PADDING;
    const field = FormComponentFactory.getField(target);
    const comb = field.ff & core.TextFieldFlags.comb;
    const fontSize = params.fontSize ?? FontComponent.DEFAULT_SIZE;
    const alignment = target.has("Q")
      ? target.get("Q", core.PDFNumeric).value as unknown as TextEditorAlignment
      : TextEditorAlignment.left;

    const fontInfo = params.font.fontInfo;
    const scale = fontSize / fontInfo.unitsPerEm;
    const ascent = fontInfo.ascent * scale;
    const descent = fontInfo.descent * scale;

    // Calculate the x and y coordinates.
    let x = padding;
    const y = params.multiline ?
      padding :
      (form.height - (ascent + descent)) / 2;

    // draw content
    let textContent = form
      .text(true)
      .graphics()
      // Clip rec
      .rect(padding, padding, form.width - padding * 2, form.height - padding * 2)
      .clip()

      // draw background
      // .rect(0, 0, form.width, form.height)
      // .fillColor([0.5, 0.5, 0.5])
      // .fill()

      // draw clip rectangle
      // .rect(padding, padding, form.width - padding * 2, form.height - padding * 2)
      // .fillColor([0.8, 0.8, 0.8])
      // .fill()

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
                size: fontSize,
              }
            }
          ]
        }, x, y);
    } else if (comb) {
      const text = this.getSingleLineText(params.text);
      const len = text.length;
      const width = core.TypographyConverter.toPoint(params.width) / len;

      textContent = textContent
        .color(params.color || TextEditorHandler.COLOR)
        .move(-(width / 2), y, true)
        .font(params.font, fontSize);

      let prevCharWidth = 0;
      for (let i = 0; i < len; i++) {
        const char = text[i];
        const charWidth = params.font.measureTextWidth(char, fontSize);
        textContent
          .move(width + (prevCharWidth / 2) - (charWidth / 2), 0, true)
          .show(char);

        prevCharWidth = charWidth;
      }
    } else {
      // recount x position for alignment
      const textWidth = params.font.measureTextWidth(params.text, fontSize);
      x = 0;

      if (alignment === TextEditorAlignment.center) {
        x += (form.width - textWidth) / 2;
      } else if (alignment === TextEditorAlignment.right) {
        x += form.width - textWidth - padding;
      } else {
        x += padding;
      }

      textContent
        .color(params.color || TextEditorHandler.COLOR)
        .font(params.font, fontSize)
        .move(x, y, true);

      const text = this.getSingleLineText(params.text);
      textContent.show(text);
    }

    // console.log(form.target.content.toString());
  }

  public create(params: TextEditorCreateParameters): core.WidgetDictionary {
    const doc = this.document.target;

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
    const fontSize = params.fontSize ?? FontComponent.DEFAULT_SIZE;

    if (!params.color) {
      params.color = 0;
    }

    const widget = core.SingleWidgetDictionary.create(update);
    widget.ft = "Tx";

    if (params.multiline) {
      widget.ff = core.TextFieldFlags.multiline;
    }

    widget.set("MaxLen", new core.PDFNumeric(params.maxLen || TextEditorHandler.MAX_LEN));
    widget.t = params.name ? doc.createString(params.name) : doc.createString(core.UUID.generate());
    widget.V = doc.createString(text);
    widget.rect.llX = positionX;
    widget.rect.llY = positionY;
    widget.rect.urX = positionX + width;
    widget.rect.urY = positionY + height;

    // Create Yes XObject
    const yes = FormObject.create(this.document, width, -height); // Use negative value here, because Adobe doesn't draw text if BBox is in negative coordinates
    const fontRes = yes.resources.set(params.font.target);
    const da = new core.PDFContent().setFontAndSize({ font: fontRes.name, size: fontSize });
    da.setColor(params.color);
    widget.set("DA", doc.createString(da.toString(true)));

    // Draw
    this.drawText(yes, {
      font: params.font,
      fontSize: fontSize,
      text,
      height: params.height,
      width: params.width,
      color: params.color,
      multiline: params.multiline,
      maxLen: params.maxLen,
    }, widget);

    widget.AP.get().N = yes.target.makeIndirect();

    const acroForm = update.catalog!.AcroForm.get();
    acroForm.addField(widget);

    return widget;
  }

}
