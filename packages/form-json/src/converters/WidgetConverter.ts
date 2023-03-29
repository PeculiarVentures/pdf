import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonComponent } from "../types";
import { ComponentConverter } from "./ComponentConverter";


export abstract class WidgetConverter<T extends pdfDoc.FormComponent> extends ComponentConverter<T> {

  public export(component: T): JsonComponent {
    const json = {
      type: this.typeJSON,
      id: component.id,
      name: component.name,
      position: {
        left: component.left,
        top: component.top,
        height: component.height,
        width: component.width,
      },
      flags: {
        hidden: component.hidden,
        invisible: component.invisible,
        locked: component.locked,
        lockedContents: component.lockedContents,
        noExport: component.noExport,
        noRotate: component.noRotate,
        noView: component.noView,
        noZoom: component.noZoom,
        print: component.print,
        readOnly: component.readOnly,
        readOnlyAnnot: component.readOnlyAnnot,
        required: component.required,
        toggleNoView: component.toggleNoView,
      },
    };

    this.onExport(component, json);

    return json;
  }

  protected abstract onExport(component: T, json: Record<string, unknown>): void;

}
