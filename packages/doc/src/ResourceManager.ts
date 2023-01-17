import * as core from "@peculiarventures/pdf-core";
import { WrapObject } from "./WrapObject";

export enum ResourceType {
  xObject = "XObject",
  font = "Font",
  colorSpace = "ColorSpace",
  extGState = "ExtGState",
}

export interface Resource {
  type: ResourceType;
  target: core.PDFObject;
  name: string;
}

export class ResourceManager extends WrapObject<core.ResourceDictionary> {

  protected items: Resource[] = [];

  protected setResource(resource: Resource): Resource {
    for (const item of this.items) {
      if (item.target.equal(resource.target)) {
        return item;
      }

      if (item.name === resource.name) {
        resource.name = core.UUID.generate();
      }
    }

    let dict: core.PDFDictionary;
    if (!this.target.has(resource.type)) {
      // Create resource map dictionary
      dict = this.document.target.createDictionary();
      this.target.set(resource.type, dict);
    } else {
      dict = this.target.get(resource.type, core.PDFDictionary);
    }
    // Add resource to map dictionary
    dict.set(resource.name, resource.target.makeIndirect() as core.PDFObjectTypes);

    this.items.push(resource);

    return resource;
  }

  public get(name: string): Resource {
    const res = this.find(name);
    if (!res) {
      throw new Error(`Resource '${name}' not found`);
    }

    return res;
  }

  public createNamePrefix(prefix: string): string {
    return `${prefix}${this.getMaxNameIndex(prefix) + 1}`;
  }

  /**
   * Returns the latest the highest index value for specified prefix
   * @param prefix Prefix
   * @returns The number value. If name withe specified prefix is not found returns -1
   */
  public getMaxNameIndex(prefix: string): number {
    let index = -1;
    for (const [, map] of this.target.items) {
      if (map instanceof core.PDFDictionary) {
        for (const [name] of map.items) {
          const reg = new RegExp(`${prefix}([0-9]+)`);
          const matches = reg.exec(name);
          if (matches) {
            const nameIndex = parseInt(matches[1]);
            if (nameIndex > index) {
              index = nameIndex;
            }
          }
        }
      }
    }

    return index;
  }

  public find(name: string): Resource | null {
    this.loadItems();
    for (const item of this.items) {
      if (item.name === name) {
        return item;
      }
    }

    return null;
  }

  public set(resource: core.PDFObject, preferredName = core.UUID.generate()): Resource {
    this.loadItems();

    let result: Resource | null = null;

    // Detect resource type
    if (resource instanceof core.PDFDictionary) {
      if (resource.has("Type")) {
        const type = resource.get("Type", core.PDFName).text;
        if (type === "XObject") {
          result = {
            name: preferredName,
            target: resource,
            type: ResourceType.xObject,
          };
        } else if (type === "Font") {
          result = {
            name: preferredName,
            target: resource,
            type: ResourceType.font,
          };
        } else if (type === "ExtGState") {
          result = {
            name: preferredName,
            target: resource,
            type: ResourceType.extGState,
          };

        }
      }
    }

    if (!result) {
      throw new TypeError("Cannot add the resource to the page. Unsupported type of the resource.");
    }

    return this.setResource(result);
  }

  protected loadItemsFromMap(map: core.PDFDictionary, type: ResourceType): void {
    for (const [key] of map.items) {
      const item = map.get(key);
      if (!item) {
        throw new Error("Empty filed in PDF dictionary.");
      }
      this.items.push({
        type,
        name: key,
        target: item,
      });
    }
  }

  protected loadItems(): void {
    if (!this.items.length) {
      const xObjects = this.target.XObject;
      const fonts = this.target.font;
      const colorSpaces = this.target.colorSpace;

      if (xObjects) {
        this.loadItemsFromMap(xObjects, ResourceType.xObject);
      }
      if (fonts) {
        this.loadItemsFromMap(fonts, ResourceType.font);
      }
      if (colorSpaces) {
        this.loadItemsFromMap(colorSpaces, ResourceType.colorSpace);
      }
    }
  }

}