import * as pdfDoc from "@peculiarventures/pdf-doc";
import { FormComponentType } from "@peculiarventures/pdf-doc";

/**
 * Type representing a constructor for an IComponent instance.
 */
export type IComponentConstructor<T extends pdfDoc.IComponent> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  doc: pdfDoc.PDFDocument
) => T;

/**
 * Interface representing the JSON object for a form component.
 */
export interface JsonComponent {
  name: string;
}

/**
 * Interface representing the JSON object for a PDF form.
 */
export interface JsonForm {
  form: Record<string, JsonComponent>;
}

/**
 * Interface representing the update data for a form component.
 */
export interface JsonComponentUpdate {
  type: FormComponentType[keyof FormComponentType];
  name: string;
}

/**
 * Interface representing the update data for a check box form component.
 */
export interface JsonCheckBoxUpdate extends JsonComponentUpdate {
  type: "check_box";
  checked: boolean;
}

/**
 * Interface representing the update data for a radio button form component.
 */
export interface JsonRadioButtonUpdate extends JsonComponentUpdate {
  type: "radio_button";
  checked: boolean;
}

/**
 * Interface representing the update data for a radio button group form component.
 */
export interface JsonRadioButtonGroupUpdate extends JsonComponentUpdate {
  type: "radio_button_group";
  selected: string;
}

/**
 * Interface representing the update data for a combo box form component.
 */
export interface JsonComboBoxUpdate extends JsonComponentUpdate {
  type: "combo_box";
  selected: string[];
}

/**
 * Interface representing the update data for a text editor form component.
 */
export interface JsonTextEditorUpdate extends JsonComponentUpdate {
  type: "text_editor";
  text: string;
}

/**
 * Union type for all possible types of form component updates.
 */
export type JsonUpdateMixed =
  | JsonCheckBoxUpdate
  | JsonRadioButtonGroupUpdate
  | JsonRadioButtonUpdate
  | JsonComboBoxUpdate
  | JsonTextEditorUpdate;
