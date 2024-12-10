import type { PDFDictionary } from "../Dictionary";
import type { PDFObject, PDFObjectConstructor } from "../Object";
import { PDFNull } from "../Null";
import { PDFObjectTypes } from "../ObjectTypes";

export class Maybe<T extends PDFObject> {

  public static readonly DEFAULT_VIEW = new Uint8Array(0);

  constructor(
    public parent: PDFDictionary,
    public name: string,
    public indirect: boolean,
    private _type: PDFObjectConstructor<T>) { }

  /**
   * Gets or creates the internal value. Value creation depends on the `required` filed value.
   * @param required If this parameter is `true` and the value is null, it throws an error.
   * If this parameter is `false` and the value is empty, it creates a new value.
   * @param compressed If `true`, object will be added to compressed stream, otherwise no. Default is `true`
   * @returns returns internal value
   */
  public get(required = false, compressed?: boolean): T {
    if (!this.parent.has(this.name) || this.parent.get(this.name) instanceof PDFNull) {
      if (required) {
        throw new Error(`Cannot get required field '${this.name}'. Field is empty.`);
      }
      if (!this.parent.documentUpdate) {
        throw new Error("Parent object doesn't assigned to PDF document update.");
      }

      const value = this._type.create(this.parent.documentUpdate);
      if (this.indirect) {
        value.makeIndirect(compressed);
      }

      this.parent
        .modify()
        .set(this.name, value as unknown as PDFObjectTypes)
        .view = Maybe.DEFAULT_VIEW;

      return value;
    }

    return this.parent.get(this.name, this._type);
  }

  public has(): boolean {
    return this.parent.has(this.name);
  }

  public set(value: T): void {
    const parent = this.parent.modify();
    parent.view = Maybe.DEFAULT_VIEW;
    if (value === undefined || value === null) {
      parent.delete(this.name);
    } else {
      if (this.indirect) {
        value.makeIndirect();
      }
      parent.set(this.name, value as unknown as PDFObjectTypes);
    }
  }

}
