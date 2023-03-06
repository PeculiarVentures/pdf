import * as pdfDoc from "@peculiarventures/pdf-doc";
import { ComponentConverterFactory } from "./ComponentConverterFactory";
import { JsonComponent, IComponentConstructor } from "./index";

export interface JsonForm {
  form: Record<string, JsonComponent>;
}

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

}
