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

/**
 * A global instance of FormConverter that uses the ComponentConverter registry.
 */
export const globalFormConverter = new FormConverter(registry);
