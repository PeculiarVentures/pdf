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

  /**
   * The number of items in the array.
   */
  public get length(): number {
    return this.items.length;
  }

  /**
   * Retrieves an item from the array at the specified index.
   * @param index - The index of the item to retrieve.
   * @returns The item at the specified index, or `null` if the index is out of bounds.
   */
  public find(index: number): PDFObjectTypes | null;
  /**
   * Retrieves an item from the array at the specified index.
   *
   * @param index - The index of the item to retrieve.
   * @param type - An optional constructor for the expected type of the item.
   * @param replace - An optional flag indicating whether to convert and replace the item
   * if it is not of the expected type.
   * @returns The item at the specified index, or `null` if the index is out of bounds.
   */
  public find<T extends PDFObject>(
    index: number,
    type: abstract new () => T,
    replace?: boolean
  ): T | null;
  public find(
    index: number,
    type?: abstract new () => PDFObject,
    replace = false
  ): PDFObject | null {
    const item = this.items[index];

    if (item) {
      const res = typeOf(item, ObjectTypeEnum.IndirectReference)
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

  /**
   * Retrieves an item from the array at the specified index.
   * @param index - The index of the item to retrieve.
   * @returns The item at the specified index.
   * @throws RangeError - If the index is out of bounds.
   */
  public get(index: number): PDFObjectTypes;
  /**
   * Retrieves an item from the array at the specified index.
   *
   * @param index - The index of the item to retrieve.
   * @param type - An optional constructor for the expected type of the item.
   * @param replace - An optional flag indicating whether to replace the item if it is not found.
   * @returns The item at the specified index.
   * @throws RangeError - If the index is out of bounds.
   */
  public get<T extends PDFObject>(
    index: number,
    type: abstract new () => T,
    replace?: boolean
  ): T;
  public get(
    index: number,
    type?: abstract new () => PDFObject,
    replace = false
  ): PDFObject {
    const item = type ? this.find(index, type, replace) : this.find(index);

    if (!item) {
      throw new RangeError("Array index is out of bounds");
    }

    return item;
  }

  /**
   * Adds one or more items to the end of the array.
   *
   * @param items - The items to be added to the array. Each item must be of type `PDFObjectTypes`.
   *
   * @remarks
   * - If an item is of type `Stream`, it will be made indirect.
   * - If an item is not indirect, its `ownerElement` will be set to this array.
   * - If the array has a `documentUpdate` and the item does not, the item's `documentUpdate`
   * will be set to the array's `documentUpdate`.
   *
   * @returns void
   */
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

  /**
   * Returns the index of the specified item in the array.
   *
   * @param item - The item to locate in the array.
   * @returns The index of the item if found; otherwise, -1.
   */
  public indexOf(item: PDFObjectTypes): number {
    for (let index = 0; index < this.items.length; index++) {
      const element = this.items[index];
      if (
        item.equal(element) ||
        (typeOf(element, ObjectTypeEnum.IndirectReference) &&
          item.ownerElement?.equal(element))
      ) {
        return index;
      }
    }

    return -1;
  }

  /**
   * Checks if the specified item is present in the array.
   *
   * @param item - The item to search for in the array.
   * @returns `true` if the item is found in the array, otherwise `false`.
   */
  public includes(item: PDFObjectTypes): boolean {
    return this.indexOf(item) !== -1;
  }

  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place,
   * returning the deleted elements.
   * This method modifies the array and triggers the `modify` method if any elements are removed.
   *
   * @param start - The zero-based index at which to start changing the array.
   * @param deleteCount - The number of elements to remove from the array. If not specified,
   * all elements from the start index to the end of the array will be removed.
   * @returns An array containing the deleted elements.
   */
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
        const PDFIndirectReferenceConstructor = PDFObjectReader.get(
          ObjectTypeEnum.IndirectReference
        );
        const indirectRef = new PDFIndirectReferenceConstructor(
          indirect.id,
          indirect.generation
        );
        indirectRef.writePDF(writer);
      } else {
        item.writePDF(writer);
      }
      writer.writeString(" ");
    }
    writer.writeString("]");
  }

  protected override onFromPDF(reader: ViewReader): void {
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
    return `[ ${this.items
      .map((o) => {
        if (o.isIndirect()) {
          const ref = o.getIndirect();

          return `${ref.id} ${ref.generation} R`;
        }

        return o.toString();
      })
      .join(", ")} ]`;
  }

  protected onEqual(target: PDFObject): boolean {
    if (
      target instanceof PDFArray &&
      target.items.length === this.items.length
    ) {
      for (let i = 0; i < target.length; i++) {
        const item = target.items[i];

        if (this.items[i].equal(item)) {
          continue;
        }

        return false;
      }

      return true;
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
