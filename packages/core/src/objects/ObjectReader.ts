
import { ParsingError } from "../errors";
import type { PDFDocumentUpdate } from "../structure/DocumentUpdate";
import type { ViewReader } from "../ViewReader";
import type { PDFObject } from "./Object";
import type { PDFTextString } from "./TextString";

import { CharSet } from "../CharSet";

export type PDFObjectTypes = PDFNull |
  PDFBoolean | PDFNumeric | PDFLiteralString | PDFHexString | PDFName |
  PDFDictionary | PDFArray | PDFIndirectReference | PDFTextString;

export abstract class PDFObjectReader {

  public static read(reader: ViewReader, update: PDFDocumentUpdate | null = null, parent: PDFObject | null = null): PDFObjectTypes {
    this.skip(reader);

    switch (true) {
      case (reader.view[reader.position] === 0x6e): // n
        return PDFNull.fromPDF(reader);
      case (reader.view[reader.position] === 0x74 // t
        || reader.view[reader.position] === 0x66): // f
        return PDFBoolean.fromPDF(reader);
      case (reader.view[reader.position] === 0x2f): // /
        return PDFName.fromPDF(reader);
      case (reader.view[reader.position] === 0x28): // (
        return PDFLiteralString.fromPDF(reader);
      case (reader.view[reader.position] === 0x5b): { // [
        const array = new PDFArray();
        array.documentUpdate = update;
        array.ownerElement = parent;
        array.fromPDF(reader);

        return array;
      }
      case (PDFNumeric.isDigit(reader.view[reader.position])): { // Number or Indirect Reference
        const startPosition = reader.position;
        try {
          const ref = new PDFIndirectReference();
          ref.documentUpdate = update;
          ref.ownerElement = parent;
          ref.fromPDF(reader);

          return ref;
        } catch {
          reader.position = startPosition;

          return PDFNumeric.fromPDF(reader);
        }
      }
      case (reader.view[reader.position] === 0x3c): {// <
        if (reader.view[reader.position + 1] === 0x3c) { // Dictionary or Stream
          const dictionaryPosition = reader.position;
          const dictionary = new PDFDictionary();
          dictionary.documentUpdate = update;
          dictionary.ownerElement = parent;
          dictionary.fromPDF(reader);

          this.skip(reader);
          if (reader.view[reader.position] !== 0x73) { // s
            return dictionary;
          }
          reader.position = dictionaryPosition;

          const stream = new PDFStream();
          stream.documentUpdate = update;
          stream.ownerElement = parent;
          stream.fromPDF(reader);

          return stream;
        } else {
          return PDFHexString.fromPDF(reader);
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
        PDFComment.fromPDF(reader);
        continue; // continue white spaces and comment skipping if comment found
      }
      break;
    }
  }

}

import { PDFBoolean } from "./Boolean";
import { PDFComment } from "./Comment";
import { PDFHexString } from "./HexString";
import { PDFIndirectReference } from "./IndirectReference";
import { PDFNull } from "./Null";
import { PDFNumeric } from "./Numeric";
import { PDFArray } from "./Array";
import { PDFName } from "./Name";
import { PDFLiteralString } from "./LiteralString";
import { PDFDictionary } from "./Dictionary";
import { PDFStream } from "./Stream";
