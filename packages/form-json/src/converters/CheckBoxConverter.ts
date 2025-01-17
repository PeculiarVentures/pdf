import * as pdfDoc from "@peculiar/pdf-doc";
import { JsonCheckBoxUpdate } from "../types";
import { WidgetConverter } from "./WidgetConverter";

/**
 * A ComponentConverter for CheckBox form components.
 */
export class CheckBoxConverter extends WidgetConverter<pdfDoc.CheckBox> {
  public typeJSON = pdfDoc.FormComponentType.checkBox as const;

  constructor() {
    super(pdfDoc.CheckBox);
  }

  protected onExport(
    component: pdfDoc.CheckBox,
    json: Record<string, unknown>
  ): void {
    json.checked = component.checked;
    json.value = component.value;
  }

  public override setValue(
    component: pdfDoc.CheckBox,
    data: JsonCheckBoxUpdate
  ): void {
    component.checked = data.checked;
  }
}
