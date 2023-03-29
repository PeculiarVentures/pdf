import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonComponent, JsonComponentUpdate } from "../types";


export abstract class ComponentConverter<T extends pdfDoc.IComponent> {

  public type: pdfDoc.IComponentConstructor<T>;
  public abstract typeJSON: string;

  constructor(type: pdfDoc.IComponentConstructor<T>) {
    this.type = type;
  }

  public abstract export(component: T): JsonComponent;

  public abstract setValue(component: T, data: JsonComponentUpdate): void;
}
