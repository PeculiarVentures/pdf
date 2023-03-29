import * as converters from "./converters";
import { FormConverter } from "./FormConverter";

const registry = new converters.ComponentConverterFactory(
  new converters.CheckBoxConverter(),
  new converters.RadioButtonConverter(),
  new converters.TextEditorConverter(),
  new converters.ComboBoxConverter(),
  new converters.ComboBoxConverter(),
  new converters.RadioButtonGroupConverter()
);
export const globalFormConverter = new FormConverter(registry);
