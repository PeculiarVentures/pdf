
import type { PDFDocumentUpdate } from "../structure/DocumentUpdate";
import type { ViewReader } from "../ViewReader";
import type { PDFObject, PDFObjectConstructor } from "./Object";

import { ParsingError, UnregisteredObjectTypeError } from "../errors";
import { CharSet } from "../CharSet";
import { isDigit, ObjectTypeEnum } from "./internal";
import { PDFObjectTypes } from "./ObjectTypes";

import type { PDFArray } from "./Array";
import type { PDFBoolean } from "./Boolean";
import type { PDFComment } from "./Comment";
import type { PDFDictionary } from "./Dictionary";
import type { PDFHexString } from "./HexString";
import type { PDFIndirectReference } from "./IndirectReference";
import type { PDFLiteralString } from "./LiteralString";
import type { PDFName } from "./Name";
import type { PDFNull } from "./Null";
import type { PDFNumeric } from "./Numeric";
import type { PDFStream } from "./Stream";

export abstract class PDFObjectReader {

  protected static items: Record<string, PDFObjectConstructor<PDFObject>> = {};

  public static register<T extends PDFObject>(
    type: PDFObjectConstructor<T>
  ): void {
    this.items[type.NAME] = type;
  }

  public static get(name: ObjectTypeEnum.Null): typeof PDFNull;
  public static get(name: ObjectTypeEnum.Boolean): typeof PDFBoolean;
  public static get(name: ObjectTypeEnum.Numeric): typeof PDFNumeric;
  public static get(name: ObjectTypeEnum.Name): typeof PDFName;
  public static get(name: ObjectTypeEnum.LiteralString): typeof PDFLiteralString;
  public static get(name: ObjectTypeEnum.HexString): typeof PDFHexString;
  public static get(name: ObjectTypeEnum.IndirectReference): typeof PDFIndirectReference;
  public static get(name: ObjectTypeEnum.Array): typeof PDFArray;
  public static get(name: ObjectTypeEnum.Dictionary): typeof PDFDictionary;
  public static get(name: ObjectTypeEnum.Stream): typeof PDFStream;
  public static get(name: ObjectTypeEnum.Comment): typeof PDFComment;
  public static get<T extends PDFObject>(name: string): PDFObjectConstructor<T>;
  public static get<T extends PDFObject>(name: string): PDFObjectConstructor<T> {
    const Constructor = this.items[name];
    if (!Constructor) {
      throw new UnregisteredObjectTypeError(name);
    }

    return Constructor as PDFObjectConstructor<T>;
  }

  public static read(reader: ViewReader, update?: PDFDocumentUpdate | null, parent?: PDFObject | null): PDFObjectTypes;
  public static read(reader: ViewReader, update: PDFDocumentUpdate | null = null, parent: PDFObject | null = null): PDFObject {
    this.skip(reader);

    switch (true) {
      case (reader.view[reader.position] === 0x6e): // n
        return this.get(ObjectTypeEnum.Null).fromPDF(reader);
      case (reader.view[reader.position] === 0x74 // t
        || reader.view[reader.position] === 0x66): // f
        return this.get(ObjectTypeEnum.Boolean).fromPDF(reader);
      case (reader.view[reader.position] === 0x2f): // /
        return this.get(ObjectTypeEnum.Name).fromPDF(reader);
      case (reader.view[reader.position] === 0x28): // (
        return this.get(ObjectTypeEnum.LiteralString).fromPDF(reader);
      case (reader.view[reader.position] === 0x5b): { // [
        const Constructor = this.get(ObjectTypeEnum.Array);
        const array = new Constructor();
        array.documentUpdate = update;
        array.ownerElement = parent;
        array.fromPDF(reader);

        return array;
      }
      case (isDigit(reader.view[reader.position])): { // Number or Indirect Reference
        const startPosition = reader.position;
        try {
          const Constructor = this.get(ObjectTypeEnum.IndirectReference);
          const ref = new Constructor();
          ref.documentUpdate = update;
          ref.ownerElement = parent;
          ref.fromPDF(reader);

          return ref;
        } catch {
          reader.position = startPosition;

          return this.get(ObjectTypeEnum.Numeric).fromPDF(reader);
        }
      }
      case (reader.view[reader.position] === 0x3c): {// <
        if (reader.view[reader.position + 1] === 0x3c) { // Dictionary or Stream
          const dictionaryPosition = reader.position;
          const DictionaryConstructor = this.get(ObjectTypeEnum.Dictionary);
          const dictionary = new DictionaryConstructor();
          dictionary.documentUpdate = update;
          dictionary.ownerElement = parent;
          dictionary.fromPDF(reader);

          this.skip(reader);
          if (reader.view[reader.position] !== 0x73) { // s
            return dictionary;
          }
          reader.position = dictionaryPosition;

          const StreamConstructor = this.get(ObjectTypeEnum.Stream);
          const stream = new StreamConstructor();
          stream.documentUpdate = update;
          stream.ownerElement = parent;
          stream.fromPDF(reader);

          return stream;
        } else {
          return this.get(ObjectTypeEnum.HexString).fromPDF(reader);
        }
      }
    }

    throw new ParsingError(`Cannot read PDF object at position ${reader.position}`, reader.position);
  }

  /**
   * Move pointer in the reader skipping all white spaces and comments
   * @param reader View reader
   */
  public static skip(reader: ViewReader): void {
    while (true) {
      // skip white spaces
      reader.findIndex(c => !CharSet.whiteSpaceChars.includes(c));
      if (reader.isEOF) {
        break;
      }
      // skip comment
      if (reader.view[reader.position] === CharSet.percentChar) {
        this.get(ObjectTypeEnum.Comment).fromPDF(reader);
        continue; // continue white spaces and comment skipping if comment found
      }
      break;
    }
  }

}
