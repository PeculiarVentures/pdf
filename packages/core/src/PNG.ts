import { BufferSource } from "pvtsutils";
import { ViewReader } from "./ViewReader";
import { ViewWriter } from "./ViewWriter";

export class PNG {
  public static readonly HEADER = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10
  ]);

  public static isPNG(view: BufferSource): boolean {
    const reader = new ViewReader(view);

    return PNG.HEADER.every((o) => o === reader.readByte());
  }

  public static fromView(view: BufferSource): PNG {
    const reader = new ViewReader(view);

    // Check PNG header
    if (!PNG.HEADER.every((o) => o === reader.readByte())) {
      throw new Error("Incorrect PNG header");
    }

    const sections = new Map<string, ViewWriter>();

    // Read each section from PNG data
    while (!reader.isEOF) {
      const dataLength = reader.readUint32(true);
      const sectionName = reader.readString(4);
      const data = reader.read(dataLength);
      reader.read(4); // CSR value, unused at the moment

      let section = sections.get(sectionName);
      if (!section) {
        section = new ViewWriter();
        sections.set(sectionName, section);
      }
      section.write(data);
    }

    // Initialize internal values
    const ihdr = sections.get("IHDR");
    if (!ihdr)
      throw new TypeError(
        "Invalid structure of PNG data. IHDR section not found."
      );

    const headerData = new ViewReader(ihdr.toUint8Array());

    const png = new PNG();
    png.width = headerData.readUint32(true);
    png.height = headerData.readUint32(true);
    png.bitDepth = headerData.readByte();
    png.colorType = headerData.readByte();
    png.hasAlphaChannel = png.colorType === 4 || png.colorType === 6;
    png.compressionMethod = headerData.readByte();
    png.filterMethod = headerData.readByte();
    png.interlaceMethod = headerData.readByte();
    png.sections = new Map<string, Uint8Array>();
    for (const [key, section] of sections) {
      png.sections.set(key, section.toUint8Array());
    }

    return png;
  }

  public width!: number;
  public height!: number;
  public bitDepth!: number;
  public colorType!: number;
  public hasAlphaChannel!: boolean;
  public compressionMethod!: number;
  public filterMethod!: number;
  public interlaceMethod!: number;
  public sections!: Map<string, Uint8Array>;
}
