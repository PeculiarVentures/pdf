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

export class CrossReferenceTable extends TrailerDictionary implements CrossReference {

  public objects: PDFDocumentObject[] = [];

  protected override onFromPDF(reader: ViewReader): void {
    reader.findIndex(c => !CharSet.whiteSpaceChars.includes(c));
    if (!CharSet.xrefChars.every(c => c === reader.readByte())) {
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
        id++;
        const entityPosition = reader.position;
        const line = Convert.ToUtf8String(reader.read(20));

        const matches = /([0-9]{10}) ([0-9]{5}) ([fn])/.exec(line);
        if (!matches) {
          throw new ParsingError("Cross-reference entity doesn't match to required structure", entityPosition);
        }

        if (!this.documentUpdate) {
          throw new Error("PDF DocumentUpdate must be assigned to the CrossReferenceTable");
        }

        const offset = parseInt(matches[1], 10);
        const generation = parseInt(matches[2], 10);
        const status = matches[3] as PDFDocumentObjectTypes;

        if (status === "n" && offset === 0) {
          // skip objects with byte offset 0
          continue;
        }

        items.push(new PDFDocumentObject({
          documentUpdate: this.documentUpdate,
          id,
          generation,
          offset,
          type: status,
        }));
      }

      this.objects.push(...items);

      PDFObjectReader.skip(reader);
      if (reader.view[reader.position] === 0x74) { // t
        // Read 'trailer'
        if (!CharSet.trailerChars.every(c => c === reader.readByte())) {
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
    const res: string[] = [
      "xref",
    ];

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
