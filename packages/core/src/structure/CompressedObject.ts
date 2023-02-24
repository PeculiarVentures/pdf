import { BufferSourceConverter } from "pvtsutils";
import { PDFDictionaryField, PDFName, PDFNumeric, PDFObjectReader, PDFObjectTypes, PDFStream } from "../objects";
import { ViewReader } from "../ViewReader";
import { ViewWriter } from "../ViewWriter";

interface CompressedObjectRef {
  /**
   * Object number
   */
  id: number;
  /**
   * Byte offset of the object in decompressed stream
   */
  offset: number;
}

export class CompressedObject extends PDFStream {

  public static readonly TYPE = "ObjStm";

  protected override onCreate(): void {
    super.onCreate();

    this.type = CompressedObject.TYPE;
    this.n = 0;
    this.first = 0;
  }

  /**
   * The type of PDF object that this dictionary describes.
   * Shall be ObjStm for an object stream
   */
  @PDFDictionaryField({
    name: "Type",
    type: PDFName,
    get: o => o.text,
    set: v => new PDFName(v),
  })
  public type!: string;

  /**
   * The number of indirect objects stored in the stream
   */
  @PDFDictionaryField({
    name: "N",
    type: PDFNumeric,
    get: o => o.value,
    set: v => new PDFNumeric(v),
    defaultValue: 0,
  })
  public n!: number;

  /**
   * The byte offset in the decoded stream of the first compressed object
   */
  @PDFDictionaryField({
    name: "First",
    type: PDFNumeric,
    get: o => o.value,
    set: v => new PDFNumeric(v),
    defaultValue: 0,
  })
  public first!: number;

  /**
   * A reference to another object stream, of which the current object stream shall be considered an extension
   */
  @PDFDictionaryField({
    name: "Extends",
    type: CompressedObject,
  })
  public extends?: CompressedObject | null;

  /**
   * Keeps decoded stream data after 'decode' call
   */
  #decodedValue?: Uint8Array;
  #refTable: CompressedObjectRef[] = [];

  private get decodedValue(): Uint8Array {
    this.decodeSync();

    if (!this.#decodedValue) {
      throw new Error("Compressed stream in not decoded call 'decode' method first");
    }

    return this.#decodedValue;
  }
  private set decodedValue(v: Uint8Array) {
    /**
     * Data structure:
     * N[<id> <offset>] N[<objects>]
     */

    // parse decoded data
    const reader = new ViewReader(v);

    // Read number pairs with id and offset
    let counter = this.n;
    while (counter--) {
      const id = PDFNumeric.fromPDF(reader).value;
      reader.readByte(); // white space
      const offset = PDFNumeric.fromPDF(reader).value;
      this.#refTable.push({ id, offset });
      reader.readByte(); // white space
    }

    this.#decodedValue = BufferSourceConverter.toUint8Array(v);
  }

  public override async decode(): Promise<ArrayBuffer> {
    if (this.#decodedValue) {
      return this.#decodedValue.buffer;
    }

    const buffer = await super.decode();
    this.decodedValue = BufferSourceConverter.toUint8Array(buffer);

    return buffer;
  }

  public override decodeSync(): ArrayBuffer {
    if (this.#decodedValue) {
      return this.#decodedValue.buffer;
    }

    const buffer = super.decodeSync();
    this.decodedValue = BufferSourceConverter.toUint8Array(buffer);

    return buffer;
  }

  public override async encode(): Promise<ArrayBuffer> {
    // Don't call encode for encrypted stream
    if (this.encrypted) {
      return this.stream.slice().buffer;
    }

    const headerWriter = new ViewWriter();
    const dataWriter = new ViewWriter();

    const refTable = this.#refTable;
    for (const item of refTable) {
      const obj = this.getDocumentUpdate().getObject(item.id);

      headerWriter.writeString(`${item.id} ${dataWriter.length} `);
      obj.value.writePDF(dataWriter);
    }

    const writer = new ViewWriter();
    writer.write(headerWriter.toUint8Array());
    writer.write(dataWriter.toUint8Array());

    this.n = refTable.length;
    this.first = headerWriter.length;

    this.stream = writer.toUint8Array();
    this.length.value = this.stream.length;

    return super.encode();
  }

  public setValue(id: number): void {
    this.#refTable.push({
      id,
      offset: -1, // Use -1 for not serialized values. Must be updated in `encode` method
    });

    this.n++;
  }

  public getValue(index: number): PDFObjectTypes {
    if (index >= this.#refTable.length) {
      throw new RangeError("Argument 'index' is greater than amount of indirect objects in the Compressed Object");
    }

    const item = this.#refTable[index];
    const offset = item.offset + this.first;

    return PDFObjectReader.read(new ViewReader(this.decodedValue.subarray(offset)), this.documentUpdate);
  }

}
