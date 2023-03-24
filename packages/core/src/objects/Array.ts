import { BadCharError } from "../errors";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { ObjectTypeEnum, typeOf } from "./internal";
import { PDFObject } from "./Object";

const leftSquareBracketChar = 0x5b;
const rightSquareBracketChar = 0x5d;

export class PDFArray extends PDFObject implements Iterable<PDFObject> {

  public static readonly NAME = ObjectTypeEnum.Array;

  [Symbol.iterator](): Iterator<PDFObject, unknown, undefined> {
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

  public find(index: number): PDFObjectTypes;
  public find<T extends PDFObject>(index: number, type: abstract new () => T, replace?: boolean): T;
  public find(index: number, type?: abstract new () => PDFObject, replace = false): PDFObject | null {
    const item = this.items[index];

    if (item) {
      const res = (typeOf(item, ObjectTypeEnum.IndirectReference))
        ? item.getValue()
        : item;

      const resType = type
        ? PDFTypeConverter.convert(res, type, replace)
        : PDFTypeConverter.convert(res);
      if (replace && !resType.isIndirect) {
        this.items[index] = resType as PDFObjectTypes;
      }

      return resType;
    }

    return null;
  }

  public get(index: number): PDFObjectTypes;
  public get<T extends PDFObject>(index: number, type: abstract new () => T, replace?: boolean): T;
  public get(index: number, type?: abstract new () => PDFObject, replace = false): PDFObject {
    const item = type
      ? this.find(index, type, replace)
      : this.find(index);

    if (!item) {
      throw new RangeError("Array index is out of bounds");
    }

    return item;
  }

  public push(...items: PDFObjectTypes[]): void {
    this.modify();

    for (const item of items) {
      if (typeOf(item, ObjectTypeEnum.Stream)) {
        item.makeIndirect();
      }
      if (!item.isIndirect()) {
        item.ownerElement = this;
      }

      if (this.documentUpdate && !item.documentUpdate) {
        item.documentUpdate = this.documentUpdate;
      }

      this.items.push(item);
    }
  }

  public indexOf(item: PDFObjectTypes): number {
    for (let index = 0; index < this.items.length; index++) {
      const element = this.items[index];
      if (item.equal(element)
        || (typeOf(element, ObjectTypeEnum.IndirectReference) && item.ownerElement?.equal(element))) {
        return index;
      }
    }

    return -1;
  }

  public splice(start: number, deleteCount?: number): PDFObjectTypes[] {

    const res = this.items.splice(start, deleteCount);
    if (res.length) {
      this.modify();
    }

    return res;
  }

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeString("[ ");
    for (const item of this.items) {
      if (item.isIndirect()) {
        const indirect = item.getIndirect();
        const PDFIndirectReferenceConstructor = PDFObjectReader.get(ObjectTypeEnum.IndirectReference);
        const indirectRef = new PDFIndirectReferenceConstructor(indirect.id, indirect.generation);
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

  public clear(): this {
    this.items = [];

    return this.modify();
  }

}

import { PDFTypeConverter } from "./TypeConverter";
import { PDFObjectReader } from "./ObjectReader";
import { PDFObjectTypes } from "./ObjectTypes";
