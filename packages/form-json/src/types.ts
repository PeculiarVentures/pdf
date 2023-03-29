import * as pdfDoc from "@peculiarventures/pdf-doc";
import { FormComponentType } from "@peculiarventures/pdf-doc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IComponentConstructor<T extends pdfDoc.IComponent> = new (target: any, doc: pdfDoc.PDFDocument) => T;

export interface JsonComponent {
  name: string;
}

export interface JsonForm {
  form: Record<string, JsonComponent>;
}

export interface JsonComponentUpdate {
  type: FormComponentType[keyof FormComponentType];
  name: string;
}

export interface JsonCheckBoxUpdate extends JsonComponentUpdate {
  type: "check_box";
  checked: boolean;
}

export interface JsonRadioButtonUpdate extends JsonComponentUpdate {
  type: "radio_button";
  checked: boolean;
}

export interface JsonRadioButtonGroupUpdate extends JsonComponentUpdate {
  type: "radio_button_group";
  selected: string;
}

export interface JsonComboBoxUpdate extends JsonComponentUpdate {
  type: "combo_box";
  selected: string[];
}

export interface JsonTextEditorUpdate extends JsonComponentUpdate {
  type: "text_editor";
  text: string;
}

export type JsonUpdateMixed = JsonCheckBoxUpdate | JsonRadioButtonGroupUpdate | JsonRadioButtonUpdate | JsonComboBoxUpdate | JsonTextEditorUpdate;
