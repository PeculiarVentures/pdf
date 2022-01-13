import { BufferSourceConverter } from "pvtsutils";
import { ViewReader } from "./ViewReader";

const SOI = 0xFFD8;
const SOF0 = 0xFFC0;
const SOF15 = 0xFFCF;

export class JPEG {

  public static readonly DEFAULT_VIEW = new Uint8Array();

  public static isJPEG(view: BufferSource): boolean {
    const reader = new ViewReader(view);

    return reader.readUint16() === SOI;
  }

  public data = JPEG.DEFAULT_VIEW;
  public bitsPerComponent = 0;
  public height = 0;
  public width = 0;
  public channels = 0;

  public static fromView(view: BufferSource): JPEG {
    const reader = new ViewReader(view);

    if (reader.readUint16() !== SOI) {
      throw new Error("Cannot get SOI marker from JPEG.");
    }

    // Find out any Frame marker
    while (!reader.isEOF) {
      const marker = reader.readUint16();
      if (SOF0 <= marker && marker <= SOF15) {
        break;
      }
      // Skip block data
      reader.position += reader.readUint16();
    }

    if (reader.isEOF) {
      throw new Error("JPEG Frame marker not found.");
    }

    // Skip Length parameter
    reader.position += 2;

    const res = new JPEG();

    res.data = BufferSourceConverter.toUint8Array(view);
    res.bitsPerComponent = reader.readUint8();
    res.height = reader.readUint16();
    res.width = reader.readUint16();
    res.channels = reader.readUint8();

    return res;
  }

}
