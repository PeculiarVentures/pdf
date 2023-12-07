import * as core from "@peculiarventures/pdf-core";
import { TextEditorDrawParameters } from "./TextEditor.Handler";
import { FormObject } from "../FormObject";
import { Resource, ResourceManager } from "../ResourceManager";
import { FontComponent } from "../Font";
import { fieldFlag } from "./decorators";
import { FormComponent } from "./FormComponent";

export enum TextEditorAlignment {
  left = 0,
  center = 1,
  right = 2,
}


export class TextEditor extends FormComponent {

  public get alignment(): TextEditorAlignment {
    if (this.target.has("Q")) {
      return this.target.get("Q", core.PDFNumeric).value as TextEditorAlignment;
    }

    return TextEditorAlignment.left;
  }

  public set alignment(v: TextEditorAlignment) {
    if (this.alignment !== v) {
      this.target.set("Q", this.document.target.createNumber(v));
      this.paint();
    }
  }

  public get text(): string {
    const field = this.getField();
    if (field.has("V")) {
      return field.get("V", core.PDFTextString).text;
    }

    return "";
  }

  public set text(v: string) {
    if (this.text !== v) {
      const field = this.getField();
      // set field value
      field.V = this.document.target.createString(v);

      // if field has multiple kids, we need update their appearances too
      if (field.has("Kids")) {
        const kids = field.get("Kids", core.PDFArray);
        for (const kid of kids) {
          if (!(kid instanceof core.PDFDictionary)) {
            continue;
          }

          const widget = kid.to(core.WidgetDictionary);
          const editor = new TextEditor(widget, this.document);
          editor.paint();
        }
      } else {
        this.paint();
      }
    }
  }

  public get maxLen(): number {
    const field = this.getField();
    if (field.has("MaxLen")) {
      return field.get("MaxLen", core.PDFNumeric).value;
    }

    return 0;
  }

  public set maxLen(v: number) {
    if (this.maxLen !== v) {
      const field = this.getField();
      field.set("MaxLen", this.document.target.createNumber(v));
      if (this.text.length > v) {
        this.text = this.text.substr(0, v);
      }
    }
  }

  public get font(): FontComponent {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const operator of content.operators) {
        if (operator instanceof core.PDFOperator) {
          if (operator.name === "Tf") {
            const fontName = (operator.parameters[0] as core.PDFName).text;

            const font = this.findFont(fontName);
            if (font) {
              return font;
            }

            break;
          }
        }
      }
    }

    // Otherwise, return the default font
    let resName = "";
    const defaultFont = this.document.addFont();
    const ap = this.target.AP.get().N;
    if (ap instanceof core.PDFDictionary) {
      const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
      resName = formAP.resources.set(defaultFont.target).name;
    }

    return new FontComponent({ document: this.document, fontDictionary: defaultFont.target, name: resName });
  }

  public set font(v: FontComponent) {
    // TODO: check if font is already in resources

    let resName = "";
    const ap = this.target.AP.get().N;
    if (ap instanceof core.PDFDictionary) {
      const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
      resName = formAP.resources.set(v.target).name;
    }
    const resFontComponent = new FontComponent({ document: this.document, fontDictionary: v.target, name: resName });

    this.setDA(resFontComponent, this.fontSize, this.textColor);
  }

  public get fontSize(): number {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const operator of content.operators) {
        if (operator instanceof core.PDFOperator) {
          if (operator.name === "Tf") {
            const size = operator.parameters[1] as core.PDFNumeric;

            return size.value;
          }
        }
      }
    }

    return FontComponent.DEFAULT_SIZE;
  }

  public set fontSize(v: core.TypographySize) {
    if (!(this.target.has("DA") && this.fontSize === v)) {
      this.setDA(this.font, v, this.textColor);
    }
  }

  public get textColor(): core.Colors {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const operator of content.operators) {
        if (operator instanceof core.PDFOperator && FormComponent.COLOR_OPERATORS.includes(operator.name)) {
          const color = core.ColorConverter.fromPDFNumberArray(operator.parameters as core.PDFNumeric[]);

          return color;
        }
      }
    }

    return 0;
  }

  public set textColor(v: core.Colors) {
    if (!(this.target.has("DA") && this.textColor === v)) {
      this.setDA(this.font, this.fontSize, v);
    }
  }

  private setDA(font: FontComponent, size: core.TypographySize, color: core.Colors, noPaint?: boolean) {
    const newContent = new core.PDFContent();
    newContent.setColor(color);
    newContent.setFontAndSize({ font: font.name, size: core.TypographyConverter.toPoint(size) });

    this.target.set("DA", this.document.target.createString(newContent.toString(true)));

    if (!noPaint) {
      this.paint();
    }
  }

  @fieldFlag(core.TextFieldFlags.multiline, true)
  public multiline!: boolean;

  @fieldFlag(core.TextFieldFlags.doNotScroll)
  public doNotScroll!: boolean;

  @fieldFlag(core.TextFieldFlags.doNotSpellCheck)
  public doNotSpellCheck!: boolean;

  protected override onWidthChanged(): void {
    this.paint();
  }

  protected override onHeightChanged(): void {
    this.paint();
  }

  /**
   * Computes the font size of the text field.
   * @returns The font size of the text field.
   */
  protected computeFontSize(): number {
    // Compute the font size based on the height of the form.
    const fontInfo = this.font.fontInfo;
    const heightEm = this.height * fontInfo.unitsPerEm;
    const fontSize = ((heightEm - 2) / (fontInfo.ascent - fontInfo.descent)) * 0.7;

    return fontSize;
  }

  public override paint(): void {
    const ap = this.target.AP.get();
    if (!ap.has("N") || ap.N instanceof core.PDFNull) {
      // If AP created by get() function it doesn't have a required filed N
      ap.N = core.FormDictionary.create(this.target.documentUpdate!);
    }

    if (ap.N instanceof core.PDFStream) {
      const formDict = ap.N.to(core.FormDictionary, true);
      const form = new FormObject(formDict, this.document);
      const font = this.font;
      let fontSize = this.fontSize;
      if (fontSize <= 0) {
        fontSize = this.computeFontSize();

        // set font size
        this.setDA(font, fontSize, this.textColor, true);
      }

      // change BBox
      form.width = this.width;
      form.height = this.height;

      // draw content
      const params: TextEditorDrawParameters = {
        font,
        fontSize,

        color: this.textColor,
        multiline: this.multiline,

        text: this.text,
        maxLen: this.maxLen,

        width: this.width,
        height: this.height,
      };

      const handler = this.document.textEditorHandler;
      form.clear();
      handler.drawText(form, params, this.target);
    }
  }

  /**
   * Looks for a font in the document resources.
   * @param fontName Font name to find
   * @param value Text value to check if font is suitable
   * @returns FontComponent if font is found, null otherwise
   */
  protected findFont(fontName: string, value?: string): FontComponent | null {
    let resource: Resource | null = null;

    // Find in Appearance.Resources
    if (this.target.AP.has()) {
      const ap = this.target.AP.get();
      if (ap.N instanceof core.PDFStream) {
        const formAP = new FormObject(ap.N.to(core.FormDictionary), this.document);
        resource = formAP.resources.find(fontName);
      }
    }

    // Find in AcroForm.Resources
    if (!resource) {
      const catalog = this.document.target.update.catalog;
      if (catalog && catalog.AcroForm.has()) {
        const acroForm = catalog.AcroForm.get();
        if (acroForm.DR.has()) {
          const res = new ResourceManager(acroForm.DR.get(), this.document);
          resource = res.find(fontName);
        }
      }
    }

    // Find in Page.Resources
    if (!resource) {
      const page = this.target.p;
      if (page && page.Resources) {
        const res = new ResourceManager(page.Resources, this.document);
        resource = res.find(fontName);
      }
    }

    // Find in Document.fonts
    if (!resource) {
      const font = this.document.fonts.find(o => o.name === fontName);

      return font || null;
    }

    if (resource && resource.target instanceof core.PDFDictionary) {
      const fontDictionary = FontComponent.toFontDictionary(resource.target);

      return new FontComponent({ document: this.document, fontDictionary, name: fontName });
    }

    return null;
  }
}
