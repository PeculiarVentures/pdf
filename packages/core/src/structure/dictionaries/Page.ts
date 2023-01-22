import * as objects from "../../objects";
import { TypographyConverter, TypographySize } from "../../TypographyConverter";
import { UUID } from "../../UUID";
import { PDFRectangle } from "../common";
import { ResourceDictionary } from "./ResourceDictionary";

interface PageInheritable {
  Resources: ResourceDictionary;
  MediaBox: PDFRectangle;
  CropBox: PDFRectangle | null;
  Rotate: number;
}

export abstract class PageDictionary extends objects.PDFDictionary implements PageInheritable {

  public createMediaBox(width: TypographySize, heigh: TypographySize): PDFRectangle {
    const w = TypographyConverter.toPoint(width);
    const h = TypographyConverter.toPoint(heigh);

    return this.getDocument().createRectangle(0, 0, w, h);
  }

  public abstract Parent: PageDictionary | null;

  protected getInherited<T extends keyof PageInheritable, R extends objects.PDFObject>(name: T, type: new () => R, optional?: false): R;
  protected getInherited<T extends keyof PageInheritable, R extends objects.PDFObject>(name: T, type: new () => R, optional: true): R | null;
  protected getInherited<T extends keyof PageInheritable, R extends objects.PDFObject>(name: T, type: new () => R, optional = false): R | null {
    if (!this.has(name)) {
      if (!this.Parent) {
        if (optional) {
          return null;
        }

        throw new Error(`Cannot get required inheritable filed ${name}.`);
      }

      return this.Parent[name] as unknown as R;
    }

    return this.get(name, type, true);
  }

  /**
   * A dictionary containing any resources required by the page contents.
   * If the page requires no resources, the value of this entry shall be 
   * an empty dictionary
   */
  public get Resources(): ResourceDictionary {
    return this.getInherited("Resources", ResourceDictionary);
  }

  public set Resources(v: ResourceDictionary) {
    this.set("Resources", v);
  }

  /**
   * A rectangle, expressed in default user space units, that shall define the boundaries 
   * of the physical medium on which the page shall be displayed or printed
  */
  public get MediaBox(): PDFRectangle {
    return this.getInherited("MediaBox", PDFRectangle);
  }
  public set MediaBox(v: PDFRectangle) {
    this.set("MediaBox", v);
  }

  /**
   * A rectangle, expressed in default user space units, that shall define 
   * the visible region of default user space. When the page is displayed 
   * or printed, its contents shall be clipped (cropped) to this rectangle
   */
  public get CropBox(): PDFRectangle | null {
    return this.getInherited("CropBox", PDFRectangle, true);
  }
  public set CropBox(v: PDFRectangle | null) {
    if (v) {
      this.set("CropBox", v);
    }
  }

  /**
   * The number of degrees by which the page shall be rotated clockwise 
   * when displayed or printed. The value shall be a multiple of 90
   */
  public get Rotate(): number {
    const num = this.getInherited("Rotate", objects.PDFNumeric, true);
    if (num) {
      return num.value;
    }

    return 0;
  }
  public set Rotate(v: number) {
    if (v === 0) {
      this.items.delete("Rotate");
    } else {
      this.set("Rotate", this.getDocument().createNumber(v));
    }
  }

  public addResource(resource: objects.PDFObject, preferredName: string): string {
    if (resource instanceof objects.PDFDictionary) {
      if (resource.has("Type")) {
        const type = resource.get("Type", objects.PDFName).text;
        if (type === "XObject") {
          if (!this.Resources.XObject) {
            this.Resources.XObject = this.getDocument().createDictionary();
          }
          this.Resources.XObject.set(preferredName ?? UUID.generate(), resource.makeIndirect());
        }
      }
    }

    throw new TypeError("Cannot add the resource to the page. Unsupported type of the resource.");
  }

}
