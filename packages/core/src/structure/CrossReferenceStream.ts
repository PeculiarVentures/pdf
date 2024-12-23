import { Convert } from "pvtsutils";
import {
  PDFArray,
  PDFDictionary,
  PDFDictionaryField,
  PDFNumberField,
  PDFName,
  PDFNameField,
  PDFNumeric,
  PDFStream,
  Maybe,
  PDFMaybeField
} from "../objects";
import { CatalogDictionary } from "./dictionaries/Catalog";
import { CrossReference } from "./CrossReference";
import { PDFDocumentObject, PDFDocumentObjectTypes } from "./DocumentObject";
import {
  EncryptDictionary,
  InformationDictionary,
  PublicKeyEncryptDictionary,
  StandardEncryptDictionary,
  TrailerDictionary
} from "./dictionaries";
import { PDFTextString } from "../objects/TextString";
import { ViewWriter } from "../ViewWriter";
import { PDFDocumentObjectGrouper } from "./DocumentObjectGrouper";
import { ViewReader } from "../ViewReader";
import { ParsingError } from "../errors";

function num(view: Uint8Array, defaultValue = 0) {
  if (!view.length) {
    return defaultValue;
  }

  let value = 0;
  for (const byte of view) {
    value = (value << 8) | byte;
  }

  return value;
}

export interface CrossReferenceIndex {
  start: number;
  size: number;
}

export class CrossReferenceStream extends PDFStream implements CrossReference {
  public static readonly TYPE = "XRef";

  /**
   * Returns object number from Index value
   * @param indexes Array of indexes from the Index field of the Compressed-Reference Stream
   * @param position
   * @returns
   */
  public static getIdentifier(
    indexes: CrossReferenceIndex[],
    position: number
  ): number {
    let current = 0;
    for (const index of indexes) {
      if (current + index.size > position) {
        return index.start + (position - current);
      }
      current += index.size;
    }
    throw new RangeError(
      "Argument 'position' is greater than amount of items in the Cross-Reference Stream"
    );
  }

  /**
   * The type of PDF object that this dictionary describes
   */
  @PDFNameField("Type")
  public Type!: string;

  /**
   * The total number of entries in the file’s cross-reference table,
   * as defined by the combination of the original section and all update sections
   * @remarks Shall not be an indirect reference
   */
  @PDFNumberField("Size")
  public Size!: number;

  /**
   * The byte offset in the decoded stream from the beginning of the file
   * to the beginning of the previous cross-reference section
   * @remarks
   * - present only if the file has more than one cross-reference section
   * - shall be a direct object
   */
  @PDFNumberField("Prev", true)
  public Prev!: null | number;

  /**
   * The catalog dictionary for the PDF document contained in the file
   * (see {@link CatalogDictionary})
   */
  @PDFDictionaryField({
    name: "Root",
    type: CatalogDictionary,
    indirect: true
  })
  public Root!: CatalogDictionary;

  /**
   * The document’s encryption dictionary
   * @remarks
   * - required if document is encrypted
   * - PDF 1.1
   */
  @PDFDictionaryField({
    name: "Encrypt",
    type: PDFDictionary,
    optional: true,
    get: (o) => {
      const filter = o.get("Filter");
      // TODO Add EncryptDictionaryFactory
      if (filter instanceof PDFName) {
        switch (filter.text) {
          case "Standard":
            return new StandardEncryptDictionary(o);
          default:
            return new PublicKeyEncryptDictionary(o);
        }
      }
      throw new Error("Wrong type for 'Filter'");
    }
  })
  public Encrypt!: null | EncryptDictionary;

  /**
   * The document’s information dictionary.
   * @remarks Deprecated in PDF 2.0
   */
  @PDFMaybeField("Info", InformationDictionary, true)
  public Info!: Maybe<InformationDictionary>;

  /**
   * An array of two byte-strings constituting a file identifier for the file.
   * The ID array shall (PDF 2.0) have a minimum length of 16 bytes. If there is an Encrypt entry,
   * this array and the two byte-strings shall be direct objects and shall be unencrypted.
   * @remarks
   * - required in PDF 2.0 or if an Encrypt entry is present
   * - PDF 1.1
   */
  @PDFDictionaryField({
    name: "ID",
    type: PDFArray,
    optional: true,
    get: (o) => o.items
  })
  public ID!: null | PDFTextString[];

  /**
   * An array containing a pair of integers for each subsection in this section
   */
  @PDFDictionaryField({
    name: "Index",
    type: PDFArray,
    optional: true,
    get: (o) => {
      // Convert to numbers
      const items = o.items.map((n) => {
        if (n instanceof PDFNumeric) {
          return n.value;
        }
        throw new Error(
          "Unsupported type in Index filed item of the Cross-Reference stream"
        );
      });

      // split to pairs
      const pairs: CrossReferenceIndex[] = [];
      for (let i = 0; i < items.length; i++) {
        pairs.push({
          start: items[i++],
          size: items[i]
        });
      }

      return pairs;
    },
    set: (values: CrossReferenceIndex[]) => {
      const result: PDFNumeric[] = [];
      for (const value of values) {
        result.push(new PDFNumeric(value.start));
        result.push(new PDFNumeric(value.size));
      }

      return new PDFArray(...result);
    }
  })
  public Index!: null | CrossReferenceIndex[];

  /**
   * An array of integers representing the size of the fields in a single
   * cross-reference entry
   */
  @PDFDictionaryField({
    name: "W",
    type: PDFArray,
    optional: true,
    get: (o) =>
      o.items.map((o) => {
        if (o instanceof PDFNumeric) {
          return o.value;
        }
        throw new Error(
          "Unsupported type in W item of the Cross-Reference stream"
        );
      }),
    set: (value: number[]) =>
      new PDFArray(...value.map((o) => new PDFNumeric(o)))
  })
  public W!: number[];

  public objects: PDFDocumentObject[] = [];

  private computerNumberLength(number: number, prevValue: number) {
    const hex = number.toString(16);
    let length = 0;
    if (hex.length % 2) {
      length = (hex.length + 1) / 2;
    } else {
      length = hex.length / 2;
    }

    return prevValue > length ? prevValue : length;
  }

  private computeWidths(items: PDFDocumentObject[]): [number, number, number] {
    let field1 = 0;
    let field2 = 0;
    let field3 = 0;
    for (const item of items) {
      let status = 0;
      switch (item.type) {
        case PDFDocumentObjectTypes.inUse:
          status = 1;
          break;
        case PDFDocumentObjectTypes.compressed:
          status = 2;
          break;
      }
      field1 = this.computerNumberLength(status, field1);
      field2 = this.computerNumberLength(item.offset, field2);
      field3 = this.computerNumberLength(item.generation, field3);
    }

    return [field1, field2, field3];
  }

  private numberToUint8Array(number: number, size: number): Uint8Array {
    const res = new Uint8Array(size);
    const numberArray = Convert.FromHex(number.toString(16));
    res.set(
      new Uint8Array(numberArray),
      res.byteLength - numberArray.byteLength
    );

    return res;
  }

  public async prepare(): Promise<void> {
    const items = this.objects;
    const widths = this.computeWidths(items);
    const groups = PDFDocumentObjectGrouper.group(items);

    this.W = widths;
    const streamWriter = new ViewWriter();

    const index: CrossReferenceIndex[] = [];

    for (const group of groups) {
      index.push({ start: group[0].id, size: group.length });
      for (const item of group) {
        let status = 0;
        switch (item.type) {
          case PDFDocumentObjectTypes.inUse:
            status = 1;
            break;
          case PDFDocumentObjectTypes.compressed:
            status = 2;
            break;
        }
        streamWriter.write(this.numberToUint8Array(status, widths[0]));
        streamWriter.write(this.numberToUint8Array(item.offset, widths[1]));
        streamWriter.write(this.numberToUint8Array(item.generation, widths[2]));
      }
    }

    if (this.documentUpdate && this.documentUpdate.previous) {
      this.Prev = this.documentUpdate.previous.startXref;
    }

    this.stream = streamWriter.toUint8Array();

    await this.encode();

    this.Index = index;
  }

  public override onCreate(): void {
    super.onCreate();

    this.Type = CrossReferenceStream.TYPE;

    const update = this.getDocumentUpdate();
    const options = this.documentUpdate?.document.options || {};
    if (!options.disableCompressedStreams) {
      // Adobe Acrobat throws exception on document reading if ASCII85 presents in filters
      // Use FlateDecode only
      this.filter = update.document.createName("FlateDecode");
    }

    // TODO Implement via static function and Trailer Dictionary interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (TrailerDictionary.prototype as any).onCreate.call(this);
  }

  protected override onToStringStream(): string {
    const res: string[] = [];

    for (const object of this.objects) {
      switch (object.type) {
        case PDFDocumentObjectTypes.compressed:
          res.push(
            `  compressed id:${object.id} stream:${object.offset} index:${object.generation}`
          );
          break;
        case PDFDocumentObjectTypes.free:
          res.push(
            `  free       id:${object.id} next:${object.offset} gen:${object.generation}`
          );
          break;
        case PDFDocumentObjectTypes.inUse:
          res.push(
            `  in-use     id:${object.id} offset:${object.offset} gen:${object.generation}`
          );
          break;
      }
    }

    return res.join("\n");
  }

  public addObject(obj: PDFDocumentObject): void {
    this.objects.push(obj);
  }

  protected override onFromPDF(reader: ViewReader): void {
    super.onFromPDF(reader);

    const streamData = this.decodeSync();
    // console.log("streamData:", Buffer.from(streamData).toString("hex"));

    const streamDataReader = new ViewReader(new Uint8Array(streamData));
    const w = [...this.W];
    // console.log("W:", xref.w);

    const indexes = this.Index || [{ start: 0, size: this.Size }];

    // Some documents may have more indexes in the cross-reference stream than represented in the Index,
    // which can lead to errors. To avoid this, we pre-determine the number of objects (totalCount) and
    // exit the loop if we reach this count.
    let totalCount = 0;
    for (const index of indexes) {
      totalCount += index.size;
    }

    let count = 0;
    while (!streamDataReader.isEOF && count < totalCount) {
      const field1 = num(streamDataReader.read(w[0]), 1);
      const field2 = num(streamDataReader.read(w[1]));
      const field3 = num(streamDataReader.read(w[2]));

      const index = CrossReferenceStream.getIdentifier(indexes, count);

      let objStatus: PDFDocumentObjectTypes;
      switch (field1) {
        case 0: {
          // free
          objStatus = PDFDocumentObjectTypes.free;
          // console.log(`free       id:${index} next:${field2} gen:${field3}`);
          break;
        }
        case 1: {
          // in-use
          objStatus = PDFDocumentObjectTypes.inUse;
          // console.log(`in-use     id:${index} offset:${field2} gen:${field3}`);
          break;
        }
        case 2: {
          // compressed
          objStatus = PDFDocumentObjectTypes.compressed;
          // console.log(`compressed id:${index} stream:${field2} index:${field3}`);
          break;
        }
        default:
          throw new ParsingError(
            "Unsupported type in PDF Cross-Reference stream"
          );
      }

      if (!this.documentUpdate) {
        throw new ParsingError(
          "Cross-Reference stream does not have document update. Please set it before parsing."
        );
      }

      const docObject = new PDFDocumentObject({
        type: objStatus,
        documentUpdate: this.documentUpdate,
        id: index,
        offset: field2,
        generation: field3
      });
      this.addObject(docObject);

      count++;
    }
  }
}
