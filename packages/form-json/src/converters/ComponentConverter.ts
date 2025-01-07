import * as pdfDoc from "@peculiar/pdf-doc";
import { JsonComponent, JsonComponentUpdate } from "../types";

/**
 * Abstract class representing a ComponentConverter for an IComponent type.
 */
export abstract class ComponentConverter<T extends pdfDoc.IComponent> {
  /**
   * The constructor function for the associated IComponent type.
   */
  public type: pdfDoc.IComponentConstructor<T>;
  /**
   * The string value of the FormComponentType for the associated IComponent type.
   */
  public abstract typeJSON: string;

  constructor(type: pdfDoc.IComponentConstructor<T>) {
    this.type = type;
  }

  /**
   * Exports a component to a JSON object.
   * @param component - The component to export.
   * @returns The JSON object representing the component.
   */
  public abstract export(component: T): JsonComponent;

  /**
   * Sets the value of a component based on update data.
   * @param component - The component to update.
   * @param data - The update data for the component.
   */
  public abstract setValue(component: T, data: JsonComponentUpdate): void;
}
