import * as pdfDoc from "@peculiarventures/pdf-doc";
import { IComponentConstructor, ComponentConverter } from "./index";

/**
 * A factory that creates ComponentConverter instances for IComponent types.
 */
export class ComponentConverterFactory {

  /**
   * A map of ComponentConverter instances, keyed by their associated IComponent type.
   */
  protected items = new Map<IComponentConstructor<pdfDoc.IComponent>, ComponentConverter<pdfDoc.IComponent>>();

  constructor(...converters: ComponentConverter<pdfDoc.IComponent>[]) {
    for (const converter of converters) {
      this.register(converter);
    }
  }

  /**
   * Registers a new ComponentConverter instance for a given IComponent type.
   *
   * @param converter - The ComponentConverter instance to register.
   */
  public register(converter: ComponentConverter<pdfDoc.IComponent>): void {
    this.items.set(converter.type, converter);
  }

  /**
   * Finds a ComponentConverter instance for a given IComponent type.
   *
   * @typeparam T - The IComponent type to find a converter for.
   * @param type - The constructor function for the IComponent type to find a converter for.
   * @returns The ComponentConverter instance for the given IComponent type, or null if not found.
   */
  public find<T extends pdfDoc.IComponent>(type: IComponentConstructor<T>): ComponentConverter<T> | null {
    const converter = this.items.get(type) as ComponentConverter<T>;

    return converter || null;
  }

  /**
   * Gets a ComponentConverter instance for a given IComponent type.
   *
   * @typeparam T - The IComponent type to get a converter for.
   * @param type - The constructor function for the IComponent type to get a converter for.
   * @returns The ComponentConverter instance for the given IComponent type.
   * @throws If no converter is found for the given IComponent type.
   */
  public get<T extends pdfDoc.IComponent>(type: IComponentConstructor<T>): ComponentConverter<T> {
    const converter = this.find(type);
    if (!converter) {
      throw new Error(`Converter not found for type ${type.name}`);
    }

    return converter;
  }
}
