import { BadCharError } from "../BadCharError";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { PDFObject } from "./Object";

const leftSquareBracketChar = 0x5b;
const rightSquareBracketChar = 0x5d;

export class PDFArray extends PDFObject implements Iterable<PDFObject> {

  [Symbol.iterator](): Iterator<PDFObject, any, undefined> {
    let pointer = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    return {
      next(): IteratorResult<PDFObject> {
        if (pointer < _this.items.length) {
          return {
            done: false,
            value: _this.get(pointer++)
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }

  public items: PDFObjectTypes[];

  public constructor(array: PDFArray);
  public constructor(...items: PDFObjectTypes[]);
  public constructor(...items: PDFObjectTypes[]) {
    super();

    if (items.length === 1 && items[0] instanceof PDFArray) {
      // Copy data from PDFArray
      this.items = items[0].items;
      this.ownerElement = items[0].ownerElement;
      this.documentUpdate = items[0].documentUpdate;
      this.view = items[0].view;
    } else {
      this.items = new Array(...items);
    }
  }

  public get length(): number {
    return this.items.length;
  }

  public get(index: number): PDFObjectTypes;
  public get<T extends PDFObject>(index: number, type: abstract new () => T, replace?: boolean): T;
  public get(index: number, type?: any, replace = false): any {
    const item = this.items[index];

    if (item) {
      const res = (item instanceof PDFIndirectReference)
        ? item.getValue()
        : item;

      const resType = PDFTypeConverter.convert(res, type, replace);
      if (replace && !resType.isIndirect) {
        this.items[index] = resType as PDFObjectTypes;
      }

      return resType;
    }

    throw new RangeError("Array index is out of bounds");
  }

  public push(...items: PDFObjectTypes[]): void {
    this.modify();

    for (const item of items) {
      if (item instanceof PDFStream) {
        item.makeIndirect();
      }

      this.items.push(item);
    }
  }

  public indexOf(item: PDFObjectTypes): number {
    for (let index = 0; index < this.items.length; index++) {
      const element = this.items[index];
      if (item.equal(element)
        || (element instanceof PDFIndirectReference && item.ownerElement?.equal(element))) {
        return index;
      }
    }

    return -1;
  }

  public splice(start: number, deleteCount?: number): PDFObjectTypes[] {
    this.modify();

    return this.items.splice(start, deleteCount);
  }

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString("[ ");
    for (const item of this.items) {
      if (item.isIndirect()) {
        const indirect = item.getIndirect();
        const indirectRef = new PDFIndirectReference(indirect.id, indirect.generation);
        indirectRef.writePDF(writer);
      } else {
        item.writePDF(writer);
      }
      writer.writeString(" ");
    }
    writer.writeString("]");
  }

  protected onFromPDF(reader: ViewReader): void {
    // clear items
    if (this.items.length) {
      this.items = [];
    }

    if (reader.readByte() !== leftSquareBracketChar) {
      throw new BadCharError(reader.position - 1);
    }

    while (true) {
      PDFObjectReader.skip(reader);
      if (reader.view[reader.position] === rightSquareBracketChar) {
        reader.readByte();
        break;
      }

      const value = PDFObjectReader.read(reader, this.documentUpdate, this);
      this.adoptChild(value);
      this.items.push(value);
    }
  }

  protected override onCopy(copy: PDFArray): void {
    super.onCopy(copy);

    const items = [];
    for (const item of this.items) {
      items.push(item.copy());
    }
    copy.items = items;
  }

  public override toString(): string {
    return `[ ${this.items.map(o => {
      if (o.isIndirect()) {
        const ref = o.getIndirect();

        return `${ref.id} ${ref.generation} R`;
      }

      return o.toString();
    }).join(", ")} ]`;
  }

  protected onEqual(target: PDFObject): boolean {
    if (target instanceof PDFArray &&
      target.items.length === this.items.length) {

      for (let i = 0; i < target.length; i++) {
        const item = target.items[i];

        if (this.items[i].equal(item)) {
          continue;
        }

        return false;
      }
    }

    return false;
  }

}

import { PDFIndirectReference } from "./IndirectReference";
import { PDFStream } from "./Stream";
import { PDFTypeConverter } from "./TypeConverter";
import { PDFObjectReader, PDFObjectTypes } from "./ObjectReader";

