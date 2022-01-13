import type { PDFDictionary } from "./Dictionary";

export class Maybe<T extends PDFObject> {

  constructor(
    public parent: PDFDictionary, 
    public name: string, 
    public indirect: boolean,
    private _type: PDFObjectConstructor<T>) { }

  public get(required = false): T {
    if (!this.parent.has(this.name)) {
      if (required) {
        throw new Error(`Cannot get required field '${this.name}'. Field is empty.`);
      }
      if (!this.parent.documentUpdate) {
        throw new Error("Parent object doesn't assigned to PDF document update.");
      }

      const value = this._type.create(this.parent.documentUpdate);
      if (this.indirect) {
        value.makeIndirect();
      }

      this.parent
        .modify()
        .set(this.name, value as any)
        .view = PDFObject.DEFAULT_VIEW;

      return value;
    }

    return this.parent.get(this.name, this._type);
  }

  public has(): boolean {
    return this.parent.has(this.name);
  }

  public set(value: T): void {
    const parent = this.parent.modify();
    parent.view = PDFObject.DEFAULT_VIEW;
    if (value === undefined || value === null) {
      parent.delete(this.name);
    } else {
      if (this.indirect) {
        value.makeIndirect();
      }
      parent.set(this.name, value as any);
    }
  }

}

import { PDFObject, PDFObjectConstructor } from "./Object";
