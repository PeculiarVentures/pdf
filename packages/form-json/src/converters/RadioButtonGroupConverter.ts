import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonRadioButtonGroupUpdate } from "../types";
import { FieldConverter } from "./FieldConverter";

/**
 * A ComponentConverter for RadioButtonGroup form components.
 */
export class RadioButtonGroupConverter extends FieldConverter<pdfDoc.RadioButtonGroup> {

  public typeJSON = pdfDoc.FormComponentType.radioButtonGroup as const;

  constructor() {
    super(pdfDoc.RadioButtonGroup);
  }

  protected override onExport(component: pdfDoc.RadioButtonGroup, json: Record<string, unknown>): void {
    json.selected = component.selected;
  }

  public override setValue(component: pdfDoc.RadioButtonGroup, data: JsonRadioButtonGroupUpdate): void {
    const button = component.get(data.selected);
    button.checked = true;
  }

}
