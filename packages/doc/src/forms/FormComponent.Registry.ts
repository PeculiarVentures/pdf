import { type CheckBox } from "./CheckBox";
import { type ComboBox } from "./ComboBox";
import { type FormComponent } from "./FormComponent";
import { type FormComponentGroup } from "./FormComponent.Group";
import { type InputImageBox } from "./InputImageBox";
import { type RadioButton } from "./RadioButton";
import { type RadioButtonGroup } from "./RadioButton.Group";
import { type SignatureBox } from "./SignatureBox";
import { type SignatureBoxGroup } from "./SignatureBox.Group";
import { type TextEditor } from "./TextEditor";

export enum FormComponentType {
  form = "form",
  formGroup = "form_group",
  checkBox = "check_box",
  comboBox = "combo_box",
  signatureBox = "signature_box",
  inputImageBox = "input_image_box",
  radioButton = "radio_button",
  textEditor = "text_editor",
  signatureBoxGroup = "signature_box_group",
  radioButtonGroup = "radio_button_group"
}

export type FormComponentRegistryItem = typeof FormComponent | typeof FormComponentGroup;

export abstract class FormComponentRegistry {

  public static items: Record<string, FormComponentRegistryItem> = {};

  public static register(key: string, value: FormComponentRegistryItem): void {
    this.items[key] = value;
  }

  public static find(key: string): FormComponentRegistryItem | null {
    const item = this.items[key];
    if (item) {
      return item;
    }

    return null;
  }

  public static get(key: FormComponentType.form): typeof FormComponent;
  public static get(key: FormComponentType.formGroup): typeof FormComponentGroup;
  public static get(key: FormComponentType.checkBox): typeof CheckBox;
  public static get(key: FormComponentType.comboBox): typeof ComboBox;
  public static get(key: FormComponentType.inputImageBox): typeof InputImageBox;
  public static get(key: FormComponentType.radioButton): typeof RadioButton;
  public static get(key: FormComponentType.radioButtonGroup): typeof RadioButtonGroup;
  public static get(key: FormComponentType.signatureBox): typeof SignatureBox;
  public static get(key: FormComponentType.signatureBoxGroup): typeof SignatureBoxGroup;
  public static get(key: FormComponentType.textEditor): typeof TextEditor;
  public static get(key: string): FormComponentRegistryItem;
  public static get(key: string): any {
    const item = this.items[key];
    if (item) {
      return item;
    }

    throw new Error(`Form component with key '${key}' not found`);
  }

}
