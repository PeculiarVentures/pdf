import * as core from "@peculiarventures/pdf-core";
import { FormObject } from "../FormObject";
import { ResourceManager } from "../ResourceManager";
import { FontComponent } from "../Font";
import { FormComponent } from "./FormComponent";
import { fieldFlag } from "./decorators";

/**
 * Represents a ComboBox form component which allows users to select
 * a single option from a drop-down list of choices.
 */
export class ComboBox extends FormComponent {
  /**
   * Indicates whether the ComboBox allows users to enter a custom value
   * in addition to selecting from the drop-down list.
   */
  @fieldFlag(core.ChoiceFlags.combo)
  public combo!: boolean;

  /**
   * Indicates whether the ComboBox allows users to edit the selected value.
   */
  @fieldFlag(core.ChoiceFlags.edit)
  public edit!: boolean;

  /**
   * Indicates whether the choices in the ComboBox should be sorted alphabetically.
   */
  @fieldFlag(core.ChoiceFlags.sort)
  public sort!: boolean;

  /**
   * Indicates whether the ComboBox allows users to select multiple values.
   */
  @fieldFlag(core.ChoiceFlags.multiSelect)
  public multiSelect!: boolean;

  /**
   * Indicates whether the selected value in the ComboBox should not be spell checked.
   */
  @fieldFlag(core.ChoiceFlags.doNotSpellCheck)
  public doNotSpellCheck!: boolean;

  /**
   * Indicates whether the ComboBox should commit the selected value when the user
   * selects a different value from the drop-down list.
  */
  @fieldFlag(core.ChoiceFlags.commitOnSelChange)
  public commitOnSelChange!: boolean;

  public get options(): Readonly<Record<string, string>> {
    const res: Record<string, string> = {};

    const choiceDict = this.getField(core.ChoiceDictionary);
    if (choiceDict.Opt) {
      for (const item of choiceDict.Opt) {
        if (item instanceof core.PDFTextString) {
          // text list
          const text = item.text;
          res[text] = text;
        } else if (item instanceof core.PDFArray) {
          // array list
          const key = item.get(0, core.PDFTextString).text;
          const value = item.get(1, core.PDFTextString).text;
          res[key] = value;
        }
      }
    }

    return res;
  }

  public set options(value: Record<string, string> | string[]) {
    const doc = this.document.target;
    const field = this.getField(core.ChoiceDictionary);
    const opt = field.Opt || doc.createArray().makeIndirect();
    opt.clear();

    if (Array.isArray(value)) {
      for (const item of value) {
        opt.push(doc.createString(item));
      }
    } else {
      for (const key in value) {
        const map = doc.createArray(
          doc.createString(key),
          doc.createString(value[key]),
        );
        opt.push(map);
      }
    }

    field.Opt = opt;
  }

  public get selected(): string[] {
    const res: string[] = [];

    const field = this.getField(core.ChoiceDictionary);
    const v = field.V;
    if (v instanceof core.PDFArray) {
      for (const item of v) {
        if (item instanceof core.PDFTextString) {
          res.push(item.text);
        }
      }
    } else if (v instanceof core.PDFTextString) {
      res.push(v.text);
    }

    return res;
  }

  public set selected(value: string[]) {
    if (value && value.length > 1) {
      // Enable multiSelect option if amount of setting values are greater that 1
      this.multiSelect = true;
    }

    const doc = this.document.target;
    const field = this.getField(core.ChoiceDictionary);
    if (!value.length) {
      field.V = doc.createNull();
    } else if (this.multiSelect) {
      const selected = doc.createArray();
      for (const item of value) {
        selected.push(doc.createString(item));
      }
      field.V = selected;
    } else {
      field.V = doc.createString(value[0]);
    }

    this.paint();
  }

  public get font(): FontComponent {
    const operator = this.findDaOperator("Tf");
    if (operator) {
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
    const operator = this.findDaOperator("Tf");

    if (operator) {
      const size = operator.parameters[1] as core.PDFNumeric;

      return size.value;
    }

    return FontComponent.DEFAULT_SIZE;
  }

  public set fontSize(v: core.TypographySize) {
    if (!(this.target.has("DA") && this.fontSize === v)) {
      this.setDA(this.font, v, this.textColor);
    }
  }

  public get textColor(): core.Colors {
    const operator = this.findDaOperator(...FormComponent.COLOR_OPERATORS);

    if (operator) {
      const color = core.ColorConverter.fromPDFNumberArray(operator.parameters as core.PDFNumeric[]);

      return color;
    }

    return 0;
  }

  public set textColor(v: core.Colors) {
    if (!(this.target.has("DA") && this.textColor === v)) {
      this.setDA(this.font, this.fontSize, v);
    }
  }

  protected findDaOperator(...operators: string[]): core.PDFOperator | null {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const item of content.operators) {
        if (item instanceof core.PDFOperator &&
          operators.includes(item.name)) {
          return item;
        }
      }
    }

    return null;
  }

  protected setDA(font: FontComponent, size: core.TypographySize, color: core.Colors) {
    const newContent = new core.PDFContent();
    newContent.setColor(color);
    newContent.setFontAndSize({ font: font.name, size: core.TypographyConverter.toPoint(size) });

    this.target.set("DA", this.document.target.createString(newContent.toString(true)));
    this.paint();
  }

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
      form.clear();
      this.document.comboBoxHandler.draw(form, this);
    }
  }
}
