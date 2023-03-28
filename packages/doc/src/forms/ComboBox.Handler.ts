import * as core from "@peculiarventures/pdf-core";
import { IFormComponentCreateParameters } from "../FormComponentHandler";
import { PDFDocument } from "../Document";
import { FontComponent } from "../Font";
import { FormObject } from "../FormObject";
import { ComboBox } from "./ComboBox";
export interface ComboBoxCreateParameters extends IFormComponentCreateParameters {
  options?: Record<string, string> | string[];
  selected?: string | string[];

}

interface BorderParameters {
  color?: core.Colors;
  width: core.TypographySize;
  length: number;
  height: number;
}

export interface ComboBoxCreateParameters {
  left?: core.TypographySize;
  top?: core.TypographySize;
  /**
   * default 0 (black)
   */
  color?: core.Colors;
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
export interface ComboBoxDrawParameters {
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

export interface IComboBoxHandler {
  document: PDFDocument;
  create(params: ComboBoxCreateParameters): core.WidgetDictionary;
  draw(form: FormObject, component: ComboBox): void;
}

export class ComboBoxHandler implements IComboBoxHandler {

  public static readonly PADDING = 1;
  public static readonly COLOR = 0;
  public static readonly MAX_LEN = 0;

  public constructor(public document: PDFDocument) { }

  public create(params: ComboBoxCreateParameters): core.WidgetDictionary {
    const doc = this.document.target;
    const update = doc.update;

    const dict = core.SingleWidgetDictionary.create(update);

    dict.ft = "Ch";

    const widget = dict.to(core.WidgetDictionary);

    const field = dict.to(core.ChoiceDictionary);
    field.t = doc.createString(params.name || core.UUID.generate());

    update.catalog!.AcroForm.get().addField(dict);

    return dict;
  }

  draw(form: FormObject, component: ComboBox): void {
    const fontInfo = component.font.fontInfo;
    const scale = component.fontSize / fontInfo.unitsPerEm;
    const ascent = fontInfo.ascent * scale;
    const descent = fontInfo.descent * scale;

    const padding = ComboBoxHandler.PADDING;
    const x = padding;
    const y = (form.height - ascent + descent) / 2 + padding;

    // draw content
    const textContent = form
      .text(true)
      .graphics()
      // Clip rec
      .rect(padding, padding, form.width - padding * 2, form.height - padding * 2)
      .clip()
      .pathEnd()
      .text()
      // text
      .color(component.textColor)
      .font(component.font, component.fontSize)
      .move(x, y);

    let text = "";
    if (component.target.has("V") && component.target.has("V")) {
      const v = component.target.get("V");
      if (v instanceof core.PDFArray) {
        text = component.options[v.get(0, core.PDFTextString).text];
      } else if (v instanceof core.PDFTextString) {
        text = component.options[component.target.get("V", core.PDFTextString).text];
      } else {
        throw new Error("Cannot get text value from the CheckBox. Unsupported type of V.");
      }
    }

    const textShow = this.getSingleLineText(text);
    textContent.show(textShow);
  }

  private getSingleLineText(text: string): string {
    return text.replace(/\n/g, " ");
  }
}

