import * as pdfCore from "@peculiarventures/pdf-core";
import * as pdfDoc from "@peculiarventures/pdf-doc";

export type IComponentConstructor<T extends pdfDoc.IComponent> = new (target: pdfCore.WidgetDictionary, doc: pdfDoc.PDFDocument) => T;
export type IComponentGroupConstructor<T extends pdfDoc.IComponent> = new (target: pdfCore.PDFField, doc: pdfDoc.PDFDocument) => T;

export type IComponentMixedConstructor<T extends pdfDoc.IComponent> = IComponentConstructor<T> | IComponentGroupConstructor<T>;

export abstract class ComponentConverter<T extends pdfDoc.IComponent> {

  public type: IComponentConstructor<T>;

  constructor(type: IComponentConstructor<T>) {
    this.type = type;
  }

  public abstract export(component: T): JsonComponent;
}

export abstract class FormComponentConverter<T extends pdfDoc.FormComponent> extends ComponentConverter<T> {

  public abstract typeJSON: string;

  public export(component: T): JsonComponent {
    const json = {
      type: this.typeJSON,
      id: component.id,
      name: component.name,
      position: {
        left: component.left,
        top: component.top,
        height: component.height,
        width: component.width,
      },
      flags: {
        hidden: component.hidden,
        invisible: component.invisible,
        locked: component.locked,
        lockedContents: component.lockedContents,
        noExport: component.noExport,
        noRotate: component.noRotate,
        noView: component.noView,
        noZoom: component.noZoom,
        print: component.print,
        readOnly: component.readOnly,
        readOnlyAnnot: component.readOnlyAnnot,
        required: component.required,
        toggleNoView: component.toggleNoView,
      },
    };

    this.onExport(component, json);

    return json;
  }

  protected abstract onExport(component: T, json: Record<string, unknown>): void;

}

export class CheckBoxConverter extends FormComponentConverter<pdfDoc.CheckBox> {
  public typeJSON = "checkBox";

  constructor() {
    super(pdfDoc.CheckBox);
  }

  protected onExport(component: pdfDoc.CheckBox, json: Record<string, unknown>): void {
    json.checked = component.checked;
    json.value = component.value;
  }
}

export class RadioButtonConverter extends FormComponentConverter<pdfDoc.RadioButton> {

  public typeJSON = "radioButton";

  constructor() {
    super(pdfDoc.RadioButton);
  }

  protected onExport(component: pdfDoc.CheckBox, json: Record<string, unknown>): void {
    json.checked = component.checked;
    json.value = component.value;
  }
}

export class TextEditorConverter extends FormComponentConverter<pdfDoc.TextEditor> {
  public typeJSON = "textEditor";

  constructor() {
    super(pdfDoc.TextEditor);
  }

  protected onExport(component: pdfDoc.TextEditor, json: Record<string, unknown>): void {
    json.maxLen = component.maxLen;
    json.multiline = component.multiline;
    json.text = component.text;
  }
}

export class SignatureBoxConverter extends ComponentConverter<pdfDoc.SignatureBox> {
  constructor() {
    super(pdfDoc.SignatureBox);
  }

  public export(component: pdfDoc.SignatureBox): JsonComponent {
    throw new Error("Method not implemented.");
  }
}

export class InputImageBoxConverter extends FormComponentConverter<pdfDoc.InputImageBox> {

  public typeJSON = "imageInput";

  constructor() {
    super(pdfDoc.InputImageBox);
  }

  protected onExport(component: pdfDoc.InputImageBox, json: Record<string, unknown>): void {
    // nothing
  }
}

// export class RadioButtonGroupConverter extends ComponentGroupConverter<pdfDoc.RadioButtonGroup> {
//   constructor() {
//     super(pdfDoc.RadioButtonGroup);
//   }

//   public export(component: pdfDoc.RadioButtonGroup): object {
//     throw new Error("Method not implemented.");
//   }
// }

// export class SignatureBoxGroupConverter extends ComponentGroupConverter<pdfDoc.SignatureBoxGroup> {
//   constructor() {
//     super(pdfDoc.SignatureBoxGroup);
//   }

//   public export(component: pdfDoc.SignatureBoxGroup): object {
//     throw new Error("Method not implemented.");
//   }
// }


export interface JsonComponent {
  name: string;
}
