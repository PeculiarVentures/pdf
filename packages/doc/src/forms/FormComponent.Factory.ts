import * as core from "@peculiarventures/pdf-core";
import { type PDFDocument } from "../Document";
import { IComponent } from "./IComponent";
import { FormComponentRegistry, FormComponentType } from "./FormComponent.Registry";

function wrapWidget(type: FormComponentType, widget: core.WidgetDictionary, doc: PDFDocument): IComponent {
  const FormComponentClass = FormComponentRegistry.get(type as FormComponentType.form);

  return new FormComponentClass(widget, doc);
}

function wrapField(type: FormComponentType, field: core.PDFField, doc: PDFDocument): IComponent {
  const FormComponentGroupClass = FormComponentRegistry.get(type as FormComponentType.formGroup);

  return new FormComponentGroupClass(field, doc);
}

export class FormComponentFactory {

  /**
   * Returns parent Filed dictionary of the Widget dictionary
   * @param widget
   */
  public static getField(widget: core.WidgetDictionary): core.PDFField {
    if (widget.Parent) {
      return new core.PDFField(widget.Parent);
    }

    return new core.PDFField(widget);
  }

  protected static createFromWidget(widget: core.WidgetDictionary, doc: PDFDocument): IComponent {
    const filed = this.getField(widget);
    if (filed.ft === "Tx") {
      wrapWidget(FormComponentType.textEditor, widget, doc);
    } else if (filed.ft === "Btn") {
      if (filed.ff & core.ButtonFlags.radio) {
        wrapWidget(FormComponentType.radioButton, widget, doc);
      } else if (filed.ff & core.ButtonFlags.pushbutton) {
        if (widget.A.has()) {
          const a = widget.A.get();
          if (a.s === "JavaScript" &&
            a.has("JS") && a.get("JS", core.PDFTextString).text.includes("buttonImportIcon")) {
            wrapWidget(FormComponentType.inputImageBox, widget, doc);
          }
        }
      }

      return wrapWidget(FormComponentType.checkBox, widget, doc);
    } else if (filed.ft === "Sig") {
      return wrapWidget(FormComponentType.signatureBox, widget, doc);
    } else if (filed.ft === "Ch") {
      return wrapWidget(FormComponentType.comboBox, widget, doc);
    }

    return wrapWidget(FormComponentType.form, widget, doc);
  }

  protected static createFromField(field: core.PDFField, doc: PDFDocument): IComponent {
    if (field.has("Subtype")) {
      // Simple widget filed dictionary
      const subtype = field.get("Subtype", core.PDFName);
      if (subtype.text === core.WidgetDictionary.SUBTYPE) {
        return this.createFromWidget(field.to(core.WidgetDictionary), doc);
      }
    } else if (field.Kids.has()) {
      // Filed dictionary has got kids
      if (field.ft === "Btn") {
        if (field.ff & core.ButtonFlags.radio) {
          return wrapField(FormComponentType.radioButtonGroup, field.to(core.ButtonDictionary), doc);
        }
      } else if (field.ft === "Sig") {
        return wrapField(FormComponentType.signatureBoxGroup, field.to(core.SignatureFiled), doc);
      }
    }

    throw new TypeError("Unsupported type of interactive form object");
  }

  public static create(dict: core.PDFDictionary, doc: PDFDocument): IComponent {
    if (dict.has("FT")) {
      return this.createFromField(new core.PDFField(dict), doc);
    } else if (dict.has("Subtype")) {
      return this.createFromWidget(new core.WidgetDictionary(dict), doc);
    }

    throw new TypeError("Cannot create PDF Form Component. Wrong type of PDF Dictionary");
  }
}
