import { BufferSource, Convert, BufferSourceConverter } from "pvtsutils";

import type { ViewReader } from "../ViewReader";
import type { ViewWriter } from "../ViewWriter";
import type { EncryptionObject } from "./EncryptionObject";

import { BadCharError, ParsingError } from "../errors";
import { ObjectTypeEnum, typeOf } from "./internal";
import { PDFDictionary } from "./Dictionary";
import { PDFDictionaryField } from "./decorators/field";
import { PDFName } from "./Name";
import { PDFNumeric } from "./Numeric";
import type { PDFArray } from "./Array";

const streamChars = new Uint8Array([0x73, 0x74, 0x72, 0x65, 0x61, 0x6d]);
const endStreamChars = new Uint8Array([0x65, 0x6e, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d]);

//#region Filed handlers

function getDecodeParamsHandler(this: PDFStream, obj: PDFObjectTypes): Array<PDFDictionary | null> {
  if (typeOf(obj, ObjectTypeEnum.Dictionary)) {
    return [obj];
  } else if (typeOf(obj, ObjectTypeEnum.Array)) {
    const res: Array<PDFDictionary | null> = [];

    for (const item of obj.items) {
      if (typeOf(item, ObjectTypeEnum.Dictionary)) {
        res.push(item);
      } else if (typeOf(item, ObjectTypeEnum.Null)) {
        res.push(null);
      } else {
        throw new TypeError("Unsupported type of DecodeParms subitem in the PDF Stream");
      }
    }

    return res;
  }

  throw new TypeError("Unsupported type of DecodeParms in the PDF Stream");
}

//#endregion

export class PDFStream extends PDFDictionary implements EncryptionObject {

  public static override readonly NAME = ObjectTypeEnum.Stream;

  protected static skipEndOfLine(reader: ViewReader): void {
    const view = reader.view.subarray(reader.position);
    if (view[0] === 0x0D && view[1] === 0x0A) {
      reader.read(2);
    } else if (view[0] === 0x0A || view[0] === 0x0D) {
      reader.read(1);
    } else {
      throw new ParsingError("Wrong end of line (must be \\r\\n or \\n)");
    }
  }

  @PDFDictionaryField({
    name: "Length",
    type: PDFNumeric,
  })
  public length!: PDFNumeric;

  @PDFDictionaryField({
    name: "Filter",
    optional: true,
    cache: true,
  })
  public filter!: PDFArray | PDFName | null;

  @PDFDictionaryField({
    name: "DecodeParms",
    get: getDecodeParamsHandler,
    optional: true,
    cache: true,
  })
  public decodeParams!: Array<PDFDictionary | null> | null;

  public static readonly DEFAULT_STREAM = new Uint8Array();

  public static async createAsync(data: BufferSource, filters: Filter[] = [], parameters?: { [key: string]: PDFObjectTypes; }): Promise<PDFStream> {
    // Apply filters
    let filteredStream = BufferSourceConverter.toUint8Array(data);
    for (const filter of filters) {
      const buffer = await filter.encode(filteredStream);
      filteredStream = new Uint8Array(buffer);
    }

    const stream = new PDFStream(filteredStream);

    // Set Filters
    if (filters.length) {
      if (filters.length === 1) {
        stream.filter = new PDFName(filters[0].name);
      } else {
        const ArrayConstructor = PDFObjectReader.get(ObjectTypeEnum.Array);
        stream.filter = new ArrayConstructor(...filters.map(o => new PDFName(o.name)));
      }
    }

    // Copy dictionary values from parameters
    for (const key in parameters) {
      stream.set(key, parameters[key]);
    }

    return stream;
  }

  private _stream = {
    view: PDFStream.DEFAULT_STREAM
  };

  public get stream(): Uint8Array {
    return this._stream.view;
  }

  public set stream(value: Uint8Array) {
    this.encrypted = false;
    this._stream.view = value;
  }

  public encrypted?: boolean;

  constructor(stream?: BufferSource | PDFStream) {
    super();

    if (stream) {
      if (stream instanceof PDFStream) {
        this.ownerElement = stream.ownerElement;
        this.view = stream.view;
        this.items = stream.items;
        this.documentUpdate = stream.documentUpdate;
        this.stream = stream.stream.slice();
        this.encrypted = stream.encrypted;
      } else {
        this.stream = BufferSourceConverter.toUint8Array(stream);
        this.set("Length", new PDFNumeric(this.stream.length));
      }
    }
  }

  protected override onWritePDF(writer: ViewWriter): void {
    if (this.length.value !== this.stream.length) {
      this.length.value = this.stream.length;
    }

    super.onWritePDF(writer);

    writer.writeString("\nstream\n");
    writer.write(this.stream);
    writer.writeString("\nendstream");
  }

  protected override onFromPDF(reader: ViewReader): void {
    super.onFromPDF(reader);

    PDFObjectReader.skip(reader);

    if (!streamChars.every(c => c === reader.readByte())) {
      throw new BadCharError(reader.position - 1);
    }

    const length = this.length;
    if (!length) {
      throw new Error("Required filed 'Length' is missing");
    }

    PDFStream.skipEndOfLine(reader);
    const startPosition = reader.position;

    let endStreamPosition = reader.findIndex("endstream");
    if (endStreamPosition === -1) {
      throw new ParsingError("Cannot find 'endstream' keyword");
    }
    if (reader.view[endStreamPosition - 1] === 0x0D && reader.view[endStreamPosition - 2] === 0x0A) {
      endStreamPosition -= 2;
    } else if (reader.view[endStreamPosition - 1] === 0x0A || reader.view[endStreamPosition - 1] === 0x0D) {
      endStreamPosition -= 1;
    } else {
      throw new ParsingError("Wrong end of line (must be \\r\\n or \\n)");
    }
    this.stream = reader.view.subarray(startPosition, endStreamPosition);
    reader.position = endStreamPosition;

    if (this.has("Filter") || !(this.has("Type") && this.get("Type", PDFName).text === "XRef") && this.documentUpdate?.document.encryptHandler) {
      this.encrypted = true;
    }

    PDFObjectReader.skip(reader);
    if (!endStreamChars.every(c => c === reader.readByte())) {
      const position = reader.view.byteOffset + reader.position - 1;
      throw new BadCharError("Wrong end of stream", position);
    }
  }

  protected getFilters(): Filter[] {
    const filters: Filter[] = [];

    if (this.filter) {
      let filterNames: string[] = [];
      if (typeOf(this.filter, ObjectTypeEnum.Name)) {
        filterNames.push(this.filter.text);
      } else if (typeOf(this.filter, ObjectTypeEnum.Array)) {
        filterNames = this.filter.items.map(o => {
          if (typeOf(o, ObjectTypeEnum.Name)) {
            return o.text;
          }
          throw new TypeError("Unsupported type of Filter in the PDF Stream");
        });
      } else {
        throw new TypeError("Unsupported type of Filter in the PDF Stream");
      }

      for (let i = 0; i < filterNames.length; i++) {
        const name = filterNames[i];
        const filter = FilterFactory.get(name);

        // TODO decode params can be in stream dictionary or in decodeParms dictionary or in dictionaries array
        if (this.decodeParams) {
          const decodeParams = this.decodeParams[i];
          filters.push(new filter(decodeParams));
        } else {
          filters.push(new filter(null));
        }
      }
    }

    return filters;
  }

  public encodeSync(): ArrayBuffer {
    if (this.encrypted) {
      return this.stream.slice().buffer;
    }

    const filters = this.getFilters();
    filters.reverse();

    for (const filter of filters) {
      const view = filter.encodeSync(this.stream);
      this.stream = new Uint8Array(view);
      this.length.value = this.stream.length;
    }

    if (filters.find(f => f.name === "Crypt")) {
      this.encrypted = true;

      return this.stream;
    }

    this.encrypted = true;

    return this.stream;
  }

  public decodeSync(): ArrayBuffer {
    if (this.encrypted === false) {
      return this.stream.slice().buffer;
    }

    const filters = this.getFilters();

    for (const filter of filters) {
      const view = filter.decodeSync(this.stream);
      this.stream = new Uint8Array(view);
    }

    this.encrypted = false;

    return this.stream.slice();
  }

  public async encode(): Promise<ArrayBuffer> {
    if (this.encrypted) {
      return this.stream.slice().buffer;
    }

    const filters = this.getFilters();
    filters.reverse();

    for (const filter of filters) {
      const view = await filter.encode(this.stream);
      this.stream = new Uint8Array(view);
      this.length.value = this.stream.length;
    }

    if (filters.find(f => f.name === "Crypt")) {
      this.encrypted = true;

      return this.stream;
    }

    if (!this.encrypted) {
      if (this.documentUpdate?.document.encryptHandler && !(this.has("Type") && this.get("Type", PDFName).text === "XRef")) {
        // The cross-reference stream shall not be encrypted and strings appearing in the cross-reference
        // stream dictionary shall not be encrypted. It shall not have a Filter entry that specifies a Crypt filter
        const encryptedText = await this.encryptAsync();
        this.stream = BufferSourceConverter.toUint8Array(encryptedText);
        this.length.value = this.stream.length;
      }
    }
    this.encrypted = true;

    return this.stream;
  }

  public async decode(): Promise<ArrayBuffer> {
    if (this.encrypted === false) {
      return this.stream.slice().buffer;
    }

    const filters = this.getFilters();

    if (!this.filter || !filters.find(f => f.name === "Crypt")) {
      if (this.encrypted === undefined || this.encrypted) {
        if (!(this.has("Type") && this.get("Type", PDFName).text === "XRef")) {
          if (this.documentUpdate?.document.encryptHandler) {
            try {
              const decryptedText = await this.decryptAsync();
              this.stream = BufferSourceConverter.toUint8Array(decryptedText);
            } catch (e) {
              if (e instanceof Error) {
                let ref = "";
                if (this.isIndirect()) {
                  const indirect = this.getIndirect();
                  ref = ` (R ${indirect.id} ${indirect.generation})`;
                }
                throw new Error(`Cannot decrypt PDF stream${ref}. ${e.message}`);
              }
            }
          }
        }
      }
    }

    for (const filter of filters) {
      const view = await filter.decode(this.stream);
      this.stream = new Uint8Array(view);
    }

    this.encrypted = false;

    return this.stream.slice();
  }

  public async encryptAsync(): Promise<ArrayBuffer> {
    const parent = this.findIndirect(true);

    const streamView = BufferSourceConverter.toArrayBuffer(this.stream);
    if (!parent || !this.documentUpdate?.document.encryptHandler) {
      return streamView;
    }

    return this.documentUpdate.document.encryptHandler.encrypt(streamView, this);
  }

  public async decryptAsync(): Promise<ArrayBuffer> {
    const parent = this.findIndirect(true);

    const streamView = BufferSourceConverter.toArrayBuffer(this.stream);
    if (!parent || !this.documentUpdate?.document.encryptHandler) {
      return streamView;
    }

    return this.documentUpdate.document.encryptHandler.decrypt(streamView, this);
  }

  protected override onCopy(copy: PDFStream): void {
    super.onCopy(copy);

    copy.encrypted = this.encrypted;
    copy.stream = this.stream.slice(); // Copy Uint8Array
  }

  protected override onCreate(): void {
    super.onCreate();

    const update = this.getDocumentUpdate();

    this.length = update.document.createNumber(this.stream.length);

    const options = this.documentUpdate?.document.options || {};

    if (!options.disableCompressedStreams) {
      if (options.disableAscii85Encoding) {
        this.filter = update.document.createName("FlateDecode");
      } else {
        this.filter = update.document.createArray(
          update.document.createName("ASCII85Decode"),
          update.document.createName("FlateDecode"),
        );
      }
    }
  }

  public override toString(): string {
    const dictionary = super.toString();
    const stream = this.onToStringStream();

    return `${dictionary}\nstream\n${stream}\nendstream`;
  }

  protected onToStringStream(): string {
    return Convert.ToBinary(this.stream);
  }

  /**
   * Adds the name of the filter to the Field entry
   * @param name The name of the filter
   * @returns
   */
  public addFilter(name: string): void {
    if (typeOf(this.filter, ObjectTypeEnum.Array)) {
      // Array
      for (const filter of this.filter) {
        if (typeOf(filter, ObjectTypeEnum.Name) && filter.text === name) {
          return;
        }
      }

      this.filter.push(this.getDocument().createName(name));
    } else if (!this.filter) {
      // Empty
      this.filter = this.getDocument().createName(name);
    } else {
      // Name
      if (this.filter.text !== name) {
        this.getDocument().createName(name);
      }
    }
  }

  public override to<T extends PDFDictionary>(type: new () => T, replace = false): T {
    const res = super.to(type);

    if (replace && this.ownerElement instanceof PDFIndirectObject) {
      this.ownerElement.value = res;
    }

    return res;
  }

  public override clear(streamOnly = false): void {
    this.stream = PDFStream.DEFAULT_STREAM;
    this.length.value = 0;

    if (!streamOnly) {
      super.clear();
    }
  }

}

import { PDFObjectReader } from "./ObjectReader";
import { PDFObjectTypes } from "./ObjectTypes";
import { Filter, FilterFactory } from "../filters";
import { PDFIndirectObject } from "./IndirectObject";
