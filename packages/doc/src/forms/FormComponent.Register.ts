import { CheckBox } from "./CheckBox";
import { ComboBox } from "./ComboBox";
import { FormComponent } from "./FormComponent";
import { FormComponentGroup } from "./FormComponent.Group";
import {
  FormComponentRegistry,
  FormComponentType
} from "./FormComponent.Registry";
import { InputImageBox } from "./InputImageBox";
import { RadioButton } from "./RadioButton";
import { RadioButtonGroup } from "./RadioButton.Group";
import { SignatureBox } from "./SignatureBox";
import { SignatureBoxGroup } from "./SignatureBox.Group";
import { TextEditor } from "./TextEditor";

FormComponentRegistry.register(FormComponentType.form, FormComponent);
FormComponentRegistry.register(FormComponentType.formGroup, FormComponentGroup);
FormComponentRegistry.register(FormComponentType.checkBox, CheckBox);
FormComponentRegistry.register(FormComponentType.comboBox, ComboBox);
FormComponentRegistry.register(FormComponentType.inputImageBox, InputImageBox);
FormComponentRegistry.register(FormComponentType.radioButton, RadioButton);
FormComponentRegistry.register(
  FormComponentType.radioButtonGroup,
  RadioButtonGroup as typeof FormComponentGroup
);
FormComponentRegistry.register(FormComponentType.signatureBox, SignatureBox);
FormComponentRegistry.register(
  FormComponentType.signatureBoxGroup,
  SignatureBoxGroup as typeof FormComponentGroup
);
FormComponentRegistry.register(FormComponentType.textEditor, TextEditor);
