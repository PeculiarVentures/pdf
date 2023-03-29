import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonComponent } from "../types";
import { ComponentConverter } from "./ComponentConverter";


export abstract class FieldConverter<T extends pdfDoc.FormComponentGroup> extends ComponentConverter<T> {


  public export(component: T): JsonComponent {
    const json = {
      type: this.typeJSON,
      id: component.id,
      name: component.name,
    };

    this.onExport(component, json);

    return json;
  }

  protected abstract onExport(component: T, json: Record<string, unknown>): void;
}
