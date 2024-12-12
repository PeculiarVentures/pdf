import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import * as pkijs from "pkijs";

import type { clientSideParametersPublicKey } from "../encryption/Constants";
import type { PageObjectDictionary } from "./dictionaries";
import type { ViewReader } from "../ViewReader";
import { EncryptionFactory, EncryptionHandler } from "../encryption";

export interface FindIndexOptions {
  reversed?: boolean;
  offset?: number;
}

export interface DocumentOptions {
  xref?: XrefStructure;
  password?: {
    user?: string;
    owner?: string;
  };
  disableAscii85Encoding?: boolean;
  disableCompressedStreams?: boolean;
  disableCompressedObjects?: boolean;
  crypto?: clientSideParametersPublicKey;
}

const headerChars = new Uint8Array(Convert.FromUtf8String("%PDF-"));

const defaultOptions: DocumentOptions = {
  xref: 1,
  disableAscii85Encoding: false,
  disableCompressedStreams: false,
  disableCompressedObjects: false
};

export class PDFDocument {
  public wrongStructure = false;

  public static fromPDF(reader: ViewReader): Promise<PDFDocument>;
  public static fromPDF(
    data: BufferSource,
    offset?: number
  ): Promise<PDFDocument>;
  public static fromPDF(text: string): Promise<PDFDocument>;
  public static fromPDF(
    data: BufferSource | ViewReader | string,
    offset?: number
  ): Promise<PDFDocument>;
  public static async fromPDF(
    data: BufferSource | ViewReader | string,
    offset = 0
  ): Promise<PDFDocument> {
    const doc = new PDFDocument();

    await doc.fromPDF(data, offset);

    return doc;
  }

  public static create(options: DocumentOptions = {}): PDFDocument {
    const doc = new PDFDocument();
    doc.options = {
      ...defaultOptions,
      ...options
    };
    doc.update.addCatalog();

    return doc;
  }

  public static readonly DEFAULT_VERSION = 1.5;
  public static readonly DEFAULT_VIEW = new Uint8Array();

  public view = PDFDocument.DEFAULT_VIEW;
  public version = PDFDocument.DEFAULT_VERSION;
  public update = new PDFDocumentUpdate(this);

  public options: DocumentOptions = {};

  #encryptHandler?: EncryptionHandler | null;
  public get encryptHandler(): EncryptionHandler | null {
    if (this.#encryptHandler === undefined) {
      const encrypt = this.update.Encrypt;
      if (encrypt) {
        const encryptHandlerConstructor = EncryptionFactory.get(encrypt.Filter);
        this.#encryptHandler = new encryptHandlerConstructor(
          encrypt,
          pkijs.getCrypto(true)
        );
      }
    }

    return this.#encryptHandler || null;
  }
  public set encryptHandler(v: EncryptionHandler | null) {
    if (v !== this.#encryptHandler) {
      this.#encryptHandler = v;
    }
  }

  public async writePDF(writer: ViewWriter): Promise<void> {
    const startOffset = writer.length;

    if (this.view.length) {
      writer.write(this.view);
    } else {
      // Write header
      writer.write(headerChars); // %PDF-
      writer.writeString(`${this.version.toFixed(1)}\n`); // <version>
      writer.writeStringLine("%\xff\xff\xff\xff"); // Binary comment
    }

    const updates: PDFDocumentUpdate[] = [];
    let update: PDFDocumentUpdate | null = this.update;
    while (update) {
      updates.push(update);
      update = update.previous;
    }
    updates.reverse();
    for (const update of updates) {
      if (!update.view.length) {
        await update.writePDF(writer);
      }
    }

    const length = writer.length;
    writer.write(new Uint8Array(), (subarray) => {
      this.view = new Uint8Array(subarray.buffer).subarray(startOffset, length);
    });
  }

  /**
   * Converts the PDF document to a PDF file.
   * @returns The PDF file as a buffer.
   *
   * @note This method serializes the PDF document on each call. If you need to start a new
   * update section, then you should use the {@link createUpdate} method after calling this method.
   */
  public async toPDF(): Promise<ArrayBuffer> {
    const writer = new ViewWriter();

    await this.writePDF(writer);

    return writer.toArrayBuffer();
  }

  public fromPDF(reader: ViewReader): Promise<number>;
  public fromPDF(data: BufferSource, offset?: number): Promise<number>;
  public fromPDF(text: string): Promise<number>;
  public fromPDF(
    data: BufferSource | ViewReader | string,
    offset?: number
  ): Promise<number>;
  public async fromPDF(
    data: BufferSource | ViewReader | string,
    offset = 0
  ): Promise<number> {
    let reader = objects.PDFObject.getReader(data, offset);

    // Find out header %PDF-<version>
    reader.findIndex((c) => !CharSet.whiteSpaceChars.includes(c));
    if (reader.position) {
      reader = objects.PDFObject.getReader(data, reader.position);
    }
    if (!headerChars.every((c) => c === reader.readByte())) {
      throw new ParsingError("PDF header is not found", reader.position - 1);
    }

    // Read version
    const version = objects.PDFNumeric.fromPDF(reader);
    this.version = version.value;

    // Find '%%EOF' keyword from the end of the file
    reader.end();
    reader.backward = true;
    reader.position = reader.findIndex("%%EOF");
    if (reader.position === -1) {
      throw new ParsingError("Cannot get %%EOF keyword");
    }
    reader.read(5);

    // Find 'startxref' keyword
    reader.position = reader.findIndex("startxref");
    if (reader.position === -1) {
      throw new Error("Cannot find 'startxref' keyword");
    }

    reader.backward = false;
    reader.readByte();

    objects.PDFObjectReader.skip(reader);
    const xrefPosition = objects.PDFNumeric.fromPDF(reader);
    reader.position = xrefPosition.value;

    this.update = new PDFDocumentUpdate(this);
    await this.update.fromPDF(reader);

    this.view = reader.view; // view must be set before decompress

    // await this.update.decompress();
    reader.end();

    this.options.xref =
      this.update.xref instanceof CrossReferenceTable
        ? XrefStructure.Table
        : XrefStructure.Stream;

    return reader.position;
  }

  public getObject(ref: objects.IPDFIndirect): PDFDocumentObject;
  public getObject(id: number, generationNumber?: number): PDFDocumentObject;
  public getObject(
    id: number | objects.IPDFIndirect,
    generationNumber?: number
  ): PDFDocumentObject {
    if (typeof id === "object") {
      return this.getObject(id.id, id.generation);
    } else {
      return this.update.getObject(id, generationNumber);
    }
  }

  public delete(element: number | PDFDocumentObject): void {
    this.update.delete(element);
  }

  public append(
    element: objects.PDFObject | PDFDocumentObject,
    compressed?: boolean
  ): PDFDocumentObject {
    return this.update.append(element, compressed);
  }

  //#region Pages

  public async addPage(
    page?: PageObjectDictionary | PDFDocumentObject
  ): Promise<PageObjectDictionary> {
    const catalog = !this.update.catalog
      ? this.update.addCatalog()
      : this.update.catalog;

    const result = await catalog.Pages.addPageOld(page);

    // TODO Implement getValue for PDFDocumentObject
    return result.value as PageObjectDictionary;
  }
  //#endregion

  public async createUpdate(): Promise<PDFDocumentUpdate> {
    // If the update section is not saved yet, then we need to save it
    if (!this.update.view.length) {
      await this.toPDF();
    }

    if (!this.update.view.length) {
      return this.update;
    }

    // Create a new update section
    const update = new PDFDocumentUpdate(this);
    update.previous = this.update;
    this.update = update;
    this.update.addCatalog();

    return update;
  }

  protected findIndex(
    cb: (c: number, i: number, array: Uint8Array) => boolean,
    options: FindIndexOptions = {}
  ): number {
    const offset = options.offset || 0;
    const step = options.reversed ? -1 : 1;

    // eslint-disable-next-line no-constant-condition
    for (let i = offset; true; i = i + step) {
      const value = this.view[i];
      if (value === undefined) {
        break;
      }
      if (cb(value, i, this.view)) {
        return i;
      }
    }

    return -1;
  }

  public async toString(): Promise<string> {
    const res: string[] = [];

    res.push(`%PDF-${this.version.toFixed(1)}`);

    const updates = [];
    let update: PDFDocumentUpdate | null = this.update;
    while (update) {
      updates.push(update);

      update = update.previous;
    }
    updates.reverse();

    for (const update of updates) {
      const updateString = await update.toString();
      res.push(updateString);
    }

    return res.join("\n");
  }

  public createNull(): objects.PDFNull {
    const obj = objects.PDFNull.create(this.update);

    return obj;
  }

  public createBoolean(value: boolean): objects.PDFBoolean {
    const obj = objects.PDFBoolean.create(this.update);

    obj.value = value;

    return obj;
  }

  public createNumber(number: number, padding?: number): objects.PDFNumeric {
    const obj = objects.PDFNumeric.create(this.update);

    obj.value = number;

    if (padding) {
      obj.padding = padding;
    }

    return obj;
  }

  public createName(text: string): objects.PDFName {
    const obj = objects.PDFName.create(this.update);

    obj.text = text;

    return obj;
  }

  /**
   * Creates a PDFLiteralString object from the given text or binary data.
   *
   * @param text - The text to create the PDFLiteralString from.
   * @returns A PDFLiteralString object.
   */
  public createString(text: string | BufferSource): objects.PDFLiteralString {
    const obj = objects.PDFLiteralString.create(this.update);

    if (BufferSourceConverter.isBufferSource(text)) {
      obj.text = Convert.ToBinary(text);
    } else {
      obj.text = text;
    }

    return obj;
  }

  public createHexString(data?: BufferSource): objects.PDFHexString {
    const obj = objects.PDFHexString.create(this.update);

    if (data) {
      obj.text = Convert.ToBinary(data);
    }

    return obj;
  }

  public createArray(...items: objects.PDFObjectTypes[]): objects.PDFArray {
    const obj = objects.PDFArray.create(this.update);

    obj.items.push(...items);

    return obj;
  }

  public createDictionary(
    ...items: [string, objects.PDFObjectTypes][]
  ): objects.PDFDictionary {
    const obj = objects.PDFDictionary.create(this.update);

    for (const item of items) {
      obj.set(item[0], item[1]);
    }

    return obj;
  }

  public createStream(view?: BufferSource): objects.PDFStream {
    const obj = objects.PDFStream.create(this.update);

    if (view) {
      obj.stream = BufferSourceConverter.toUint8Array(view);
    }

    return obj.makeIndirect();
  }

  public createRectangle(
    llX: number,
    llY: number,
    urX: number,
    urY: number
  ): PDFRectangle {
    return PDFRectangle.createWithData(this.update, llX, llY, urX, urY);
  }

  public async decrypt(): Promise<void> {
    let update: PDFDocumentUpdate | null = this.update;

    if (this.encryptHandler) {
      await this.encryptHandler.authenticate();

      const promises: Promise<void>[] = [];
      while (update) {
        promises.push(update.decrypt());

        update = update.previous;
      }

      await Promise.all(promises);
    }
  }

  public async encrypt(): Promise<void> {
    const promises: Promise<void>[] = [];
    if (this.update) {
      promises.push(this.update.encrypt());
    }

    await Promise.all(promises);
  }
}

import * as objects from "../objects";
import { ParsingError } from "../errors";
import { ViewWriter } from "../ViewWriter";
import { PDFDocumentUpdate } from "./DocumentUpdate";
import { PDFRectangle } from "./common";
import { CrossReferenceTable } from "./CrossReferenceTable";
import { CharSet } from "../CharSet";
import { PDFDocumentObject } from "./DocumentObject";
import { XrefStructure } from "./XrefStructure";
