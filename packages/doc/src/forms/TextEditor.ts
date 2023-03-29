import * as core from "@peculiarventures/pdf-core";
import { TextEditorDrawParameters } from "./TextEditor.Handler";
import { FormObject } from "../FormObject";
import { ResourceManager } from "../ResourceManager";
import { FontComponent } from "../Font";
import { fieldFlag } from "./decorators";
import { FormComponent } from "./FormComponent";


export class TextEditor extends FormComponent {

  public get text(): string {
    if (this.target.has("V")) {
      return this.target.get("V", core.PDFTextString).text;
    }

    return "";
  }

  public set text(v: string) {
    if (this.text !== v) {
      this.target.set("V", this.document.target.createString(v));
      this.paint();
    }
  }

  public get maxLen(): number {
    if (this.target.has("MaxLen")) {
      return this.target.get("MaxLen", core.PDFNumeric).value;
    }

    return 0;
  }

  public set maxLen(v: number) {
    if (this.maxLen !== v) {
      this.target.set("MaxLen", this.document.target.createNumber(v));
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

            const ap = this.target.AP.get().N;
            if (ap instanceof core.PDFDictionary) {
              const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
              // Try to get Font from Appearance.Resources
              let font = formAP.resources.find(fontName);

              if (!font) {
                // Try to get Font from AcroForm.Resources
                const catalog = this.document.target.update.catalog;
                if (catalog && catalog.AcroForm.has()) {
                  const acroForm = catalog.AcroForm.get();
                  if (acroForm.DR.has()) {
                    const res = new ResourceManager(acroForm.DR.get(), this.document);
                    font = res.find(fontName);
                  }
                }
              }

              if (!(font && font.target instanceof core.PDFDictionary)) {
                throw new TypeError("Cannot get Font from Resources. Incorrect type.");
              }
              const fontDictionary = FontComponent.toFontDictionary(font.target);

              return new FontComponent({ document: this.document, fontDictionary, name: fontName });
            }

            break;
          }
        }
      }
    }

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
    if (!(this.target.has("DA") && this.font.name === v.name)) {

      let resName = "";
      const ap = this.target.AP.get().N;
      if (ap instanceof core.PDFDictionary) {
        const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
        resName = formAP.resources.set(v.target).name;
      }
      const resFontComponent = new FontComponent({ document: this.document, fontDictionary: v.target, name: resName });

      this.setDA(resFontComponent, this.fontSize, this.textColor);
    }
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

  private setDA(font: FontComponent, size: core.TypographySize, color: core.Colors) {
    const newContent = new core.PDFContent();
    newContent.setColor(color);
    newContent.setFontAndSize({ font: font.name, size: core.TypographyConverter.toPoint(size) });

    this.target.set("DA", this.document.target.createString(newContent.toString(true)));
    this.paint();
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

  public override paint(): void {
    const ap = this.target.AP.get();
    if (!ap.has("N")) {
      // If AP created by get() function it doesn't have a required filed N
      ap.N = core.FormDictionary.create(this.target.documentUpdate!);
    }

    if (ap.N instanceof core.PDFStream) {
      const formDict = ap.N.to(core.FormDictionary, true);
      const form = new FormObject(formDict, this.document);

      // change BBox
      form.width = this.width;
      form.height = this.height;

      // draw content
      const params: TextEditorDrawParameters = {
        font: this.font,
        fontSize: this.fontSize,

        color: this.textColor,
        multiline: this.multiline,

        text: this.text,
        maxLen: this.maxLen,

        width: this.width,
        height: this.height,
      };

      const handler = this.document.textEditorHandler;
      form.clear();
      handler.drawText(form, params);
    }
  }
}
