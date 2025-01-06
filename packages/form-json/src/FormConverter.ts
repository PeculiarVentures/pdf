import * as pdfDoc from "@peculiar/pdf-doc";
import {
  IComponentConstructor,
  JsonComponent,
  JsonForm,
  JsonUpdateMixed
} from "./types";
import { ComponentConverterFactory } from "./converters";

/**
 * A utility class for exporting and updating PDF form components.
 */
export class FormConverter {
  /**
   * The ComponentConverterFactory instance to use for converting PDF form components to JSON.
   */
  public registry: ComponentConverterFactory;

  /**
   * Creates a FormConverter instance.
   * @param registry - The ComponentConverterFactory instance to use for converting PDF form components to JSON.
   */
  constructor(registry: ComponentConverterFactory) {
    this.registry = registry;
  }

  /**
   * Exports all PDF form components in a document to JSON format.
   * @param doc - The PDF document to export the form components from.
   * @returns An object containing JSON representations of all form components in the document.
   */
  public export(doc: pdfDoc.PDFDocument): JsonForm {
    const res: JsonForm = {
      form: {}
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

  /**
   * Exports a single PDF form component to JSON format.
   * @param component - The PDF form component to export.
   * @returns The JSON representation of the specified form component,
   * or null if the component is not supported by the current converter registry.
   */
  protected exportComponent(
    component: pdfDoc.IComponent
  ): JsonComponent | null {
    const converter = this.registry.find(
      component.constructor as IComponentConstructor<pdfDoc.IComponent>
    );
    if (converter) {
      return converter.export(component);
    }

    return null;
  }

  /**
   * Sets the value of one or more PDF form components based on provided JSON updates.
   * @param doc - The PDF document containing the form components to update.
   * @param data - An array of JSON updates to apply to the PDF form components.
   */
  public setValue(doc: pdfDoc.PDFDocument, data: JsonUpdateMixed[]): void {
    for (const item of data) {
      const component = doc.getComponentByName(item.name);

      if (!component) {
        continue;
      }

      const converter = this.registry.find(
        component.constructor as IComponentConstructor<pdfDoc.IComponent>
      );
      if (!converter || converter.typeJSON !== item.type) {
        continue;
      }

      converter.setValue(component, item);
    }
  }
}
