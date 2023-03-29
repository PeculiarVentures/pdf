import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonComboBoxUpdate } from "../types";
import { WidgetConverter } from "./WidgetConverter";


export class ComboBoxConverter extends WidgetConverter<pdfDoc.ComboBox> {

  public typeJSON = pdfDoc.FormComponentType.comboBox as const;

  constructor() {
    super(pdfDoc.ComboBox);
  }

  protected onExport(component: pdfDoc.ComboBox, json: Record<string, unknown>): void {
    let flags: Record<string, unknown> = {};
    if (json.flags && typeof json.flags === "object") {
      flags = json.flags as Record<string, unknown>;
    }

    json.flags = {
      ...flags,
      combo: component.combo,
      edit: component.edit,
      sort: component.sort,
      multiSelect: component.multiSelect,
      doNotSpellCheck: component.doNotSpellCheck,
      commitOnSelChange: component.commitOnSelChange,
    };

    json.options = component.options;
    json.selected = component.selected;
  }

  public override setValue(component: pdfDoc.ComboBox, data: JsonComboBoxUpdate): void {
    component.selected = data.selected;
  }

}
