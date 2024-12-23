import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonRadioButtonUpdate } from "../types";
import { WidgetConverter } from "./WidgetConverter";

/**
 * A ComponentConverter for RadioButton form components.
 */
export class RadioButtonConverter extends WidgetConverter<pdfDoc.RadioButton> {
  public typeJSON = pdfDoc.FormComponentType.radioButton as const;

  constructor() {
    super(pdfDoc.RadioButton);
  }

  protected onExport(
    component: pdfDoc.RadioButton,
    json: Record<string, unknown>
  ): void {
    json.checked = component.checked;
    json.value = component.value;
  }

  public override setValue(
    component: pdfDoc.RadioButton,
    data: JsonRadioButtonUpdate
  ): void {
    component.checked = data.checked;
  }
}
