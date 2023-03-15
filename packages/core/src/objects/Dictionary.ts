import { BadCharError, ParsingError } from "../errors";
import { CharSet } from "../CharSet";
import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import { PDFObject } from "./Object";

const dictionaryLeftChars = new Uint8Array([CharSet.lessThanChar, CharSet.lessThanChar]);
const dictionaryRightChars = new Uint8Array([CharSet.greaterThanChar, CharSet.greaterThanChar]);

export type PDFDictionaryKey = PDFName | string;

export class PDFDictionary extends PDFObject {

  public static readonly FORMAT_SPACE = "  ";

  public static getName(name: string | PDFName): string {
    return typeof name === "string" ? name : name.text;
  }

  public items: Map<string, PDFObjectTypes> = new Map();

  public constructor();
  public constructor(dictionary: PDFDictionary);
  public constructor(items: [PDFDictionaryKey, PDFObjectTypes][]);
  public constructor(params?: [PDFDictionaryKey, PDFObjectTypes][] | PDFDictionary) {
    super();

    if (params) {
      if (params instanceof PDFDictionary) {
        // PDFDictionary
        this.items = params.items;
        this.ownerElement = params.ownerElement;
        this.view = params.view;
        this.documentUpdate = params.documentUpdate;
      } else {
        // [PDFDictionaryKey, PDFObjectTypes][]
        for (const [key, value] of params) {
          this.items.set(PDFDictionary.getName(key), value);
        }
      }
    }
  }

  protected onWritePDF(writer: ViewWriter): void {
    writer.writeStringLine("<<");

    for (const [key, item] of this.items) {
      new PDFName(key).writePDF(writer);
      writer.writeByte(CharSet.whiteSpaceChar);
      if (item.isIndirect()) {
        const indirect = item.getIndirect();
        const indirectRef = new PDFIndirectReference(indirect.id, indirect.generation);
        indirectRef.writePDF(writer);
      } else {
        item.writePDF(writer);
      }

      writer.writeLine();
    }

    writer.writeString(">>");
  }

  protected onFromPDF(reader: ViewReader): void {
    // <<
    if (!dictionaryLeftChars.every(c => c === reader.readByte())) {
      throw new BadCharError(reader.position - 1);
    }

    this.items.clear();

    while (true) {
      PDFObjectReader.skip(reader);
      if (dictionaryRightChars.every((c, i) => c === reader.view[reader.position + i])) {
        reader.read(2);
        break;
      }

      const key = PDFObjectReader.read(reader, this.documentUpdate, this);
      this.adoptChild(key);
      if (key instanceof PDFNull) {
        PDFObjectReader.skip(reader);
        if (!dictionaryRightChars.every((c, i) => c === reader.view[reader.position + i])) {
          throw new ParsingError("Must be '>>' after the 'null' value", reader.position);
        }
        reader.read(2);
        break;
      }
      if (!(key instanceof PDFName)) {
        throw new ParsingError(`Dictionary key at position ${reader.view.byteOffset} must be type of Name`, reader.view.byteOffset);
      }
      const value = PDFObjectReader.read(reader, this.documentUpdate, this);
      this.adoptChild(value);

      this.items.set(PDFDictionary.getName(key), value);
    }
  }

  public get size(): number {
    return this.items.size;
  }

  /**
   * Get dictionary value by name
   * @param name Name to search for
   */
  public get(name: PDFDictionaryKey): PDFObjectTypes;
  /**
   * Get dictionary value by name
   * @param name Name to search for
   * @param type Expected type of returning value
   * @param replace Replace the original item
   */
  public get<T extends PDFObject>(name: PDFDictionaryKey, type: abstract new () => T, replace?: boolean): T;
  public get(name: PDFDictionaryKey, type?: any, replace = false): any {
    const pdfName = PDFDictionary.getName(name);
    let res = this.items.get(PDFDictionary.getName(pdfName));
    if (!res) {
      throw new Error(`Cannot get PDF Dictionary value by name '${pdfName.toString()}'`);
    }

    if (res instanceof PDFIndirectReference) {
      // If result is instance of Indirect reference that replace it by the referenced object
      res = res.getValue();
    } else if (!res.ownerElement) {
      res.ownerElement = this;
    }


    if (type && res instanceof PDFNull) {
      const newRes = type.create(this.documentUpdate) as PDFObjectTypes;
      if (newRes.isIndirect()) {
        newRes.makeIndirect();
      }
      res = newRes;

      this.set(name, res);
    }

    const resType = PDFTypeConverter.convert(res, type, replace);
    if (replace && !resType.isIndirect) {
      this.set(name, resType as PDFObjectTypes);
    }

    return resType;
  }

  public has(name: PDFDictionaryKey): boolean {
    return this.items.has(PDFDictionary.getName(name));
  }

  /**
   * Set dictionary value by name
   * @param name Name to search for
   * @param value Value to set
   */
  public set(name: PDFDictionaryKey, value: PDFObjectTypes): this {
    this.modify();

    if (value instanceof PDFStream) {
      value.makeIndirect();
    }

    if (!value.isIndirect()) {
      value.ownerElement = this;
    }

    if (this.documentUpdate && !value.documentUpdate) {
      value.documentUpdate = this.documentUpdate;
    }

    this.items.set(PDFDictionary.getName(name), value);

    return this;
  }

  /**
   * Remove dictionary value by name
   * @param name Name to search for
   */
  public delete(name: PDFDictionaryKey): boolean {
    this.modify();

    return this.items.delete(PDFDictionary.getName(name));
  }

  public clear(): void {
    this.items.clear();

    // Reinitialize fields
    this.onCreate();
  }

  protected override onCopy(copy: PDFDictionary): void {
    super.onCopy(copy);

    const items = new Map<string, PDFObjectTypes>();
    for (const [key, value] of this.items) {
      items.set(key, value.copy());
    }
    copy.items = items;
  }

  public override toString(depth = 0): string {
    const records = [];

    const space = PDFDictionary.FORMAT_SPACE.repeat(depth);

    for (const [key, value] of this.items) {
      const padding = space + PDFDictionary.FORMAT_SPACE;
      const keyString = key.toString();
      let valueString = "";
      if (value.isIndirect()) {
        const ref = value.getIndirect();
        valueString = `${ref.id} ${ref.generation} R`;
      } else {
        valueString = (value instanceof PDFDictionary)
          ? value.toString(depth + 1)
          : value.toString();
      }

      records.push(`${padding}/${keyString} ${valueString}`);
    }

    return `<<\n${records.join("\n")}\n${space}>>`;
  }

  protected onEqual(target: PDFObject): boolean {
    if (target instanceof PDFDictionary &&
      target.items.size === this.items.size) {

      for (const [key, item] of target.items) {
        if (this.items.has(key) && this.items.get(key)?.equal(item)) {
          continue;
        }

        return false;
      }
    }

    return false;
  }

  public to<T extends PDFDictionary>(type: new () => T, replace = false): T {
    return PDFTypeConverter.convert(this, type, replace);
  }

}

import { PDFName } from "./Name";
import { PDFNull } from "./Null";
import { PDFStream } from "./Stream";
import { PDFIndirectReference } from "./IndirectReference";
import { PDFTypeConverter } from "./TypeConverter";
import { PDFObjectReader, PDFObjectTypes } from "./ObjectReader";
