import * as pdfDoc from "@peculiarventures/pdf-doc";
import { IComponentConstructor, JsonComponent, JsonForm, JsonUpdateMixed } from "./types";
import { ComponentConverterFactory } from "./converters";

export class FormConverter {
  public registry: ComponentConverterFactory;

  constructor(registry: ComponentConverterFactory) {
    this.registry = registry;
  }

  public export(doc: pdfDoc.PDFDocument): JsonForm {
    const res: JsonForm = {
      form: {},
    };

    const components = doc.getComponents();
    for (const component of components) {
      const obj = this.exportComponent(component);
      if (obj) {
        res.form[obj.name] = obj;
      }
    }

    return res;
  }

  protected exportComponent(component: pdfDoc.IComponent): JsonComponent | null {
    const converter = this.registry.find(component.constructor as IComponentConstructor<pdfDoc.IComponent>);
    if (converter) {
      return converter.export(component);
    }

    return null;
  }

  public setValue(doc: pdfDoc.PDFDocument, data: JsonUpdateMixed[]): void {
    for (const item of data) {
      const component = doc.getComponentByName(item.name);

      if (!component) {
        continue;
      }

      const converter = this.registry.find(component.constructor as IComponentConstructor<pdfDoc.IComponent>);
      if (!converter || converter.typeJSON !== item.type) {
        continue;
      }

      converter.setValue(component, item);
    }

  }

}
