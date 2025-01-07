import { Convert } from "pvtsutils";
import { BadCharError, ParsingError } from "../errors";
import { CharSet } from "../CharSet";
import { PDFNumeric, PDFObjectReader } from "../objects";
import { ViewReader } from "../ViewReader";
import { ViewWriter } from "../ViewWriter";
import { CrossReference } from "./CrossReference";
import { TrailerDictionary } from "./dictionaries/Trailer";
import { PDFDocumentObject, PDFDocumentObjectTypes } from "./DocumentObject";
import { PDFDocumentObjectGrouper } from "./DocumentObjectGrouper";
import type { CrossReferenceStream } from "./CrossReferenceStream";

export class CrossReferenceTable
  extends TrailerDictionary
  implements CrossReference
{
  public objects: PDFDocumentObject[] = [];
  public xrefStream?: CrossReferenceStream;

  protected override onFromPDF(reader: ViewReader): void {
    reader.findIndex((c) => !CharSet.whiteSpaceChars.includes(c));
    if (!CharSet.xrefChars.every((c) => c === reader.readByte())) {
      throw new BadCharError(reader.position - 1);
    }

    while (true) {
      // read sub-section
      PDFObjectReader.skip(reader);

      const firstItem = PDFNumeric.fromPDF(reader);
      reader.read(1); // SPACE CHAR
      const length = PDFNumeric.fromPDF(reader);
      PDFObjectReader.skip(reader);

      // read sub-sections
      let counter = length.value;
      const items: PDFDocumentObject[] = [];
      let id = firstItem.value - 1;
      while (counter--) {
        // nnnnnnnnnn ggggg n eol
        id++;
        const line = Convert.ToUtf8String(reader.read(18));

        const view = reader.view.subarray(reader.position);
        const charCode = view[1];
        if (charCode === 0x0d || charCode === 0x0a || charCode === 0x20) {
          // In some cases eol can include odd characters, so we need to skip them
          reader.read(2);
        } else {
          // In some cases, the line has 19 characters
          reader.read(1);
        }

        const matches = /([0-9]{10}) ([0-9]{5}) ([fn])/.exec(line);
        if (!matches) {
          const offset = reader.view.byteOffset + reader.position;
          throw new ParsingError(
            "Cross-reference entity doesn't match to required structure",
            offset
          );
        }

        if (!this.documentUpdate) {
          throw new Error(
            "PDF DocumentUpdate must be assigned to the CrossReferenceTable"
          );
        }

        const offset = parseInt(matches[1], 10);
        const generation = parseInt(matches[2], 10);
        const status = matches[3] as PDFDocumentObjectTypes;

        if (status === "n" && offset === 0) {
          // skip objects with byte offset 0
          continue;
        }

        items.push(
          new PDFDocumentObject({
            documentUpdate: this.documentUpdate,
            id,
            generation,
            offset,
            type: status
          })
        );
      }

      this.objects.push(...items);

      PDFObjectReader.skip(reader);
      if (reader.view[reader.position] === 0x74) {
        // t
        // Read 'trailer'
        if (!CharSet.trailerChars.every((c) => c === reader.readByte())) {
          throw new BadCharError(reader.position - 1);
        }

        PDFObjectReader.skip(reader);

        // Read trailer dictionary
        super.onFromPDF(reader);
        break;
      }
    }
  }

  protected override onWritePDF(writer: ViewWriter): void {
    writer.writeLine(CharSet.xrefChars); // xref

    const groups = PDFDocumentObjectGrouper.group(this.objects);

    for (const group of groups) {
      const firstIndex = group[0].id;

      writer.writeString(`${firstIndex} ${group.length}\n`);
      for (const item of group) {
        if (item.type === PDFDocumentObjectTypes.compressed) {
          // For hybrid-reference files it's possible to have compressed objects
          // change type to in-use, because we don't create compressed objects and don't use compressed streams
          item.type = PDFDocumentObjectTypes.inUse;
        }
        const offset = item.offset.toString().padStart(10, "0");
        const generation = item.generation.toString().padStart(5, "0");
        writer.writeString(`${offset} ${generation} ${item.type}\r\n`);
      }
    }

    writer.writeLine(CharSet.trailerChars); // trailer
    super.onWritePDF(writer);
    writer.writeLine();
  }

  public override toString(): string {
    const res: string[] = ["xref"];

    const groups = PDFDocumentObjectGrouper.group(this.objects);

    for (const group of groups) {
      const firstIndex = group[0].id;

      res.push(`${firstIndex} ${group.length}`);
      for (const item of group) {
        const offset = item.offset.toString().padStart(10, "0");
        const generation = item.generation.toString().padStart(5, "0");
        res.push(`${offset} ${generation} ${item.type} % id:${item.id}`);
      }
    }

    res.push("trailer");
    res.push(super.toString());

    return res.join("\n");
  }

  public addObject(obj: PDFDocumentObject): void {
    this.objects.push(obj);
  }
}
