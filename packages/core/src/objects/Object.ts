import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";

import { ParsingError } from "../ParsingError";
import { ViewReader } from "../ViewReader";
import { ViewWriter } from "../ViewWriter";

function isPdfIndirect(data: unknown): data is IPDFIndirect {
  return typeof data === "object" && !!data &&
    "id" in data && typeof data.id === "number" &&
    "generation" in data && typeof data.generation === "number";
}

export interface PDFObjectConstructor<T extends PDFObject> {
  fromPDF(this: new () => T, reader: ViewReader): T;
  fromPDF(this: new () => T, data: Uint8Array, offset?: number): T;
  fromPDF(this: new () => T, text: string): T;
  fromPDF(this: new () => T, data: Uint8Array | ViewReader | string, offset?: number): T;
  create(this: new () => T, update: PDFDocumentUpdate): T;

  new(): T;
}

export interface IPDFIndirect {
  id: number;
  generation: number;
}

export abstract class PDFObject {

  public static readonly DEFAULT_VIEW = new Uint8Array();

  /**
   * Creates new instance of the class and assigns it to the document
   * @param target PDF document or update
   * @returns 
   */
  public static create<T extends PDFObject>(this: new () => T, target: PDFDocument | PDFDocumentUpdate): T {
    const obj = new this();

    obj.documentUpdate = ("update" in target) ? target.update : target;
    obj.onCreate();

    return obj;
  }

  protected onCreate(): void {
    // nothing
  }

  public static getReader(reader: ViewReader): ViewReader;
  public static getReader(text: string): ViewReader;
  public static getReader(data: BufferSource, offset?: number): ViewReader;
  public static getReader(data: BufferSource | ViewReader | string, offset?: number): ViewReader;
  public static getReader(data: BufferSource | ViewReader | string, offset = 0): ViewReader {
    return (data instanceof ViewReader)
      ? data
      : (typeof data === "string")
        ? new ViewReader(new Uint8Array(Convert.FromBinary(data)))
        : new ViewReader(BufferSourceConverter.toUint8Array(data).subarray(offset));
  }

  public static fromPDF<T extends PDFObject>(this: new () => T, reader: ViewReader): T;
  public static fromPDF<T extends PDFObject>(this: new () => T, data: Uint8Array, offset?: number): T;
  public static fromPDF<T extends PDFObject>(this: new () => T, text: string): T;
  public static fromPDF<T extends PDFObject>(this: new () => T, data: Uint8Array | ViewReader | string, offset?: number): T;
  public static fromPDF<T extends PDFObject>(this: new () => T, data: Uint8Array | ViewReader | string, offset = 0): T {
    const obj = new this();
    obj.fromPDF(data, offset);

    return obj;
  }

  public ownerElement: PDFObject | null = null;

  public isIndirect(): boolean {
    return isPdfIndirect(this.ownerElement);
  }

  public findIndirect(deep = false): IPDFIndirect | null {
    if (this.ownerElement) {
      if (isPdfIndirect(this.ownerElement)) {
        return this.ownerElement;
      } else if (deep) {
        return this.ownerElement.findIndirect(deep);
      }
    }

    return null;
  }

  /**
   * Returns indirect object of the object.
   * 
   * If deep is false and the object is not directly in Indirect object it throws an error.
   * @param deep If `true`, then looks for the Indirect object through its parent.
   * @returns
   */
  public getIndirect(deep = false): IPDFIndirect {
    const indirect = this.findIndirect(deep);
    if (!indirect) {
      throw new Error("Not found indirect");
    }

    return indirect;
  }

  public makeIndirect(compressed?: boolean): this {
    if (this.documentUpdate && !this.isIndirect()) {
      this.getDocument().append(this, compressed);
    }

    return this;
  }

  public view = PDFObject.DEFAULT_VIEW;
  public documentUpdate: PDFDocumentUpdate | null = null;
  public padding = 0;

  protected getDocument(): PDFDocument {
    return this.getDocumentUpdate().document;
  }

  protected getDocumentUpdate(): PDFDocumentUpdate {
    if (!this.documentUpdate) {
      throw new Error("PDF object is not assigned to the PTF document");
    }

    return this.documentUpdate;
  }

  public toPDF(fromEarlySaved = false): Uint8Array {
    if (fromEarlySaved && this.view.length) {
      return this.view;
    }

    const writer = new ViewWriter();
    this.writePDF(writer);

    return writer.toUint8Array();
  }

  public writePDF(writer: ViewWriter, fromEarlySaved = false): void {
    if (fromEarlySaved && this.view.length) {
      writer.write(this.view);

      return;
    }

    const offset = writer.length;
    this.onWritePDF(writer);

    let length = writer.length - offset;
    if (length < this.padding) {
      // Add empty space padding
      writer.writeString("".padEnd(this.padding - length, " "));
      length = this.padding;
    }

    writer.write(new Uint8Array(), (subarray) => {
      this.view = new Uint8Array(subarray.buffer).subarray(offset, offset + length);
    });
  }

  public fromPDF(reader: ViewReader): number;
  public fromPDF(text: string): number;
  public fromPDF(data: Uint8Array, offset?: number): number;
  public fromPDF(data: Uint8Array | ViewReader | string, offset?: number): number;
  public fromPDF(data: Uint8Array | ViewReader | string, offset = 0): number {
    const reader = PDFObject.getReader(data, offset);

    const startPosition = reader.position;
    try {

      this.onFromPDF(reader);

      this.view = reader.view.subarray(startPosition, reader.position);

      return reader.position;
    } catch (e) {
      if (e instanceof ParsingError) {
        if (e.position === -1) {
          e.position = startPosition;
        }
        throw e;
      }

      let message = `Cannot create ${this.constructor.name} from PDF stream at position ${reader.position}.`;
      if (e instanceof Error) {
        message += ` ${e.message}`;
      }

      throw new ParsingError(message, reader.position);
    }

  }

  public adoptChild(obj: PDFObject): void {
    if (this.documentUpdate) {
      obj.documentUpdate = this.documentUpdate;
    }
    if (this.ownerElement) {
      obj.ownerElement = this;
    }
  }

  protected abstract onFromPDF(reader: ViewReader): void;

  protected abstract onWritePDF(writer: ViewWriter): void;

  /**
   * Returns copy of the object
   * @returns The copy of the current object
   */
  public copy<T extends PDFObject>(this: T): T {
    const copy = new (this.constructor as PDFObjectConstructor<T>)();

    this.onCopy(copy);

    return copy;
  }

  /**
   * Copies required fields from the original object to it's copy
   * @remarks Each child class must call super's method
   * @param copy The copy of the current object
   */
  protected onCopy(copy: PDFObject): void {
    copy.documentUpdate = this.documentUpdate;
    copy.ownerElement = this.ownerElement;
  }

  public modify(): this {
    if (this.documentUpdate) {
      const lastUpdate = this.documentUpdate.document.update;

      if (this.documentUpdate === lastUpdate) {
        return this;
      } else {
        const indirect = this.findIndirect(true);
        if (indirect) {
          const obj = this.documentUpdate.getObject(indirect.id, indirect.generation);
          if (obj.value.documentUpdate === lastUpdate) {
            this.documentUpdate = lastUpdate;

            return this;
          }
          this.documentUpdate.document.append(obj);

          this.documentUpdate = lastUpdate;

          return obj.value as this;
        }
      }
    }

    return this;
  }

  public equal(target: PDFObject): boolean {
    if (this === target) {
      return true;
    } else if (this.isIndirect() && target.isIndirect()) {
      const thisRef = this.getIndirect();
      const targetRef = target.getIndirect();

      return thisRef.id === targetRef.id &&
        thisRef.generation === targetRef.generation;
    }

    return this.onEqual(target);
  }

  protected abstract onEqual(target: PDFObject): boolean;

}

import type { PDFDocument } from "../structure/Document";
import type { PDFDocumentUpdate } from "../structure/DocumentUpdate";
