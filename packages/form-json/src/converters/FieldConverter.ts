import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonComponent } from "../types";
import { ComponentConverter } from "./ComponentConverter";

/**
 * Abstract class representing a ComponentConverter for a FormComponentGroup type.
 * @typeparam T - The FormComponentGroup type to convert.
 */
export abstract class FieldConverter<
  T extends pdfDoc.FormComponentGroup
> extends ComponentConverter<T> {
  public export(component: T): JsonComponent {
    const json = {
      type: this.typeJSON,
      id: component.id,
      name: component.name
    };

    this.onExport(component, json);

    return json;
  }

  /**
   *
   * @param component Called to add additional data to the JSON object representing the form component.
   * @param component - The form component to export.
   * @param json - The JSON object representing the form component.
   */
  protected abstract onExport(
    component: T,
    json: Record<string, unknown>
  ): void;
}
