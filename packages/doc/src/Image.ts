import * as core from "@peculiarventures/pdf-core";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import * as fastPng from "fast-png";
import { type PDFDocument } from "./Document";
import { WrapObject } from "./WrapObject";

export interface ImageExport {
  type: string;
  data: ArrayBuffer;
}

export interface ImageCreateParameters {
  image: BufferSource;
  width: core.TypographySize;
  height: core.TypographySize;
}

function RGB(
  data: Uint8Array,
  depth: number,
  palette: fastPng.IndexedColors,
) {
  const indexSize = data.length * (8 / depth);
  const resSize = indexSize * 3;
  const res = new Uint8Array(resSize);

  let offset = 0;
  let indexPos = 0;
  const indexes = new Uint8Array(indexSize);
  let bit = 0xff;
  switch (depth) {
    case 1:
      bit = 0x80;
      break;
    case 2:
      bit = 0xc0;
      break;
    case 4:
      bit = 0xf0;
      break;
    case 8:
      bit = 0xff;
      break;
    default:
      throw new Error("Incorrect depth value");
  }

  for (const item of data) {
    let bit2 = bit;
    let shift = 8;
    while (bit2) {
      shift -= depth;
      indexes[indexPos++] = (item & bit2) >> shift;

      bit2 >>= depth;
    }
  }

  for (const index of indexes) {
    const color = palette[index];
    if (!color) {
      throw new Error("Incorrect index of palette color");
    }
    res.set(color, offset);
    offset += 3;
  }

  return res;
}

export class Image extends WrapObject<core.ImageDictionary> {

  /**
   * Gets width of the image
   */
  public get width(): number {
    return this.target.Width;
  }

  /**
   * Sets width of the image
   */
  public set width(v: core.TypographySize) {
    this.target.Width = core.TypographyConverter.toPoint(v);
  }

  /**
   * Gets height of the image
   */
  public get height(): number {
    return this.target.Height;
  }

  /**
   * Sets height of the image
   */
  public set height(v: core.TypographySize) {
    this.target.Height = core.TypographyConverter.toPoint(v);
  }

  public static create(raw: BufferSource, document: PDFDocument): Image {
    try {
      if (core.JPEG.isJPEG(raw)) {
        return this.createJPEG(raw, document);
      }

      if (core.PNG.isPNG(raw)) {
        return this.createPNG(raw, document);
      }

      throw new Error("Unknown type of the image.");
    } catch (e) {
      if (e instanceof Error) {
        e.message = `Cannot create PDF Image. ${e.message}`;
      }

      throw e;
    }

  }

  protected static createPNG(raw: BufferSource, document: PDFDocument): Image {
    const png = fastPng.decode(BufferSourceConverter.toUint8Array(raw));
    const idat = png.data;

    // Create Image dictionary
    const imageDict = core.ImageDictionary.create(document.target.update);
    imageDict.Width = core.TypographyConverter.toPoint(png.width);
    imageDict.Height = core.TypographyConverter.toPoint(png.height);
    imageDict.BitsPerComponent = png.depth;

    if (png.channels === 3) {
      imageDict.ColorSpace = document.target.createName("DeviceRGB");
      const rgbView = new Uint8Array(idat.length);

      let offset = 0;
      let rgbOffset = 0;

      while (offset < idat.length) {
        rgbView[rgbOffset++] = idat[offset++];
        rgbView[rgbOffset++] = idat[offset++];
        rgbView[rgbOffset++] = idat[offset++];
      }

      imageDict.stream = rgbView;
    } else if (png.channels === 4) {
      imageDict.ColorSpace = document.target.createName("DeviceRGB");
      const pixels = idat.length / 4;
      const rgbView = new Uint8Array(pixels * 3);
      const alphaView = new Uint8Array(pixels);

      let offset = 0;
      let rgbOffset = 0;
      let alphaOffset = 0;

      while (offset < idat.length) {
        rgbView[rgbOffset++] = idat[offset++];
        rgbView[rgbOffset++] = idat[offset++];
        rgbView[rgbOffset++] = idat[offset++];
        alphaView[alphaOffset++] = idat[offset++];
      }

      imageDict.stream = rgbView;

      const sMaskDict = imageDict.SMask = core.ImageDictionary.create(document.target.update).makeIndirect();
      sMaskDict.Width = png.width;
      sMaskDict.Height = png.height;
      sMaskDict.ColorSpace = document.target.createName("DeviceGray");
      sMaskDict.BitsPerComponent = png.depth;
      sMaskDict.stream = alphaView;
    } else if (png.channels === 1) {
      if (!png.palette) {
        throw new Error("Cannot get Palette from the indexed PNG image.");
      }
      imageDict.stream = BufferSourceConverter.toUint8Array(png.data);

      // The colour table data shall be m*(hival+1) bytes long
      const lookup = new Uint8Array(256 * 3);
      let offset = 0;
      for (const color of png.palette) {
        lookup.set(color, offset);
        offset += color.length;
      }

      const colorSpaces = document.target.createArray(
        document.target.createName("Indexed"), // type
        document.target.createName("DeviceRGB"), // base
        document.target.createNumber(255), // hival
        document.target.createStream(lookup).makeIndirect(), // lookup
      ).makeIndirect();

      imageDict.ColorSpace = colorSpaces;
    } else {
      throw new Error("Unsupported PNG type");
    }

    return new this(imageDict, document);
  }

  protected static createJPEG(raw: BufferSource, document: PDFDocument): Image {
    const jpeg = core.JPEG.fromView(raw);

    let colorSpace: string;
    switch (jpeg.channels) {
      case 1:
        colorSpace = "DeviceGray";
        break;
      case 3:
        colorSpace = "DeviceRGB";
        break;
      case 4:
        colorSpace = "DeviceCMYK";
        break;
      default:
        throw new Error("Unsupported color type");
    }

    // Create output objects
    const imageDict = core.ImageDictionary.create(document.target.update);
    imageDict.Width = jpeg.width;
    imageDict.Height = jpeg.height;
    imageDict.ColorSpace = document.target.createName(colorSpace);
    imageDict.BitsPerComponent = jpeg.bitsPerComponent;
    imageDict.addFilter(core.DCTFilter.NAME);
    imageDict.stream = jpeg.data;

    return new this(imageDict, document);
  }

  public async export(): Promise<ImageExport> {
    const filter = this.target.filter;
    const data = await this.target.decode();
    if ((filter instanceof core.PDFName && filter.text === core.DCTFilter.NAME) ||
      (filter instanceof core.PDFArray && filter.items.some((o, i) => filter.get(i, core.PDFName).text === core.DCTFilter.NAME))) {
      return {
        type: "jpeg",
        data
      };
    } else {
      // PNG
      const colorSpace = this.target.ColorSpace;
      if (colorSpace instanceof core.PDFArray) {
        const colorType = colorSpace.get(0);
        const palette: fastPng.IndexedColors = [];
        if (colorType instanceof core.PDFName && colorType.text === "Indexed") {
          // TODO: The base parameter shall be an array or name
          const base = colorSpace.get(1);
          if (!(base instanceof core.PDFName && base.text === "DeviceRGB")) {
            throw new Error("Unsupported base name in ColorSpace");
          }
          const hival = colorSpace.get(2);
          if (!(hival instanceof core.PDFNumeric && hival.value === 255)) {
            throw new Error("Unsupported hival value in ColorSpace");
          }

          const lookup = colorSpace.get(3);
          if (lookup instanceof core.PDFStream) {
            const stream = await lookup.decode();
            const view = new Uint8Array(stream);
            for (let i = 0; i < view.byteLength; i++) {
              palette.push([view[i++], view[i++], view[i]]);
            }
          } else if (lookup instanceof core.PDFHexString) {
            throw new Error("Unsupported ByteString of lookup in ColorSpace");
          } else {
            throw new Error("Unsupported type of lookup in ColorSpace");
          }
        } else {
          throw new Error("Unsupported type ColorSpace");
        }

        const rgb = RGB(new Uint8Array(data), this.target.BitsPerComponent || 1, palette);
        const img = fastPng.encode({
          data: rgb,
          height: this.target.Height,
          width: this.target.Width,
          channels: 3,
          depth: 8,
        });

        return {
          type: "png",
          data: img.buffer,
        };
      }

      if (colorSpace instanceof core.PDFName) {
        let channels = 1;
        switch (colorSpace.text) {
          case "DeviceGray":
            channels = 1;
            break;
          case "DeviceRGB":
            channels = 3;
            break;
          case "DeviceCMYK":
            channels = 4;
            break;
          default:
            throw new Error("Unsupported ColorSpace name");
        }

        let pixels = new Uint8Array(data);
        if (this.target.SMask) {
          channels++;

          const alpha = await this.target.SMask.decode();
          const alphaView = new Uint8Array(alpha);
          const pixelsAlpha = new Uint8Array(data.byteLength + alpha.byteLength);

          let alphaOffset = 0;
          let offset = 0;
          for (let i = 0; i < pixels.length; i++) {
            // Gray
            pixelsAlpha[offset++] = pixels[i];

            if (colorSpace.text === "DeviceRGB") {
              pixelsAlpha[offset++] = pixels[++i];
              pixelsAlpha[offset++] = pixels[++i];
            }

            pixelsAlpha[offset++] = alphaView[alphaOffset++];
          }

          pixels = pixelsAlpha;
        }

        const img = fastPng.encode({
          data: pixels,
          height: this.target.Height,
          width: this.target.Width,
          channels,
          depth: this.target.BitsPerComponent as fastPng.BitDepth,
        });

        return {
          type: "png",
          data: img.buffer,
        };
      }

      throw new Error("ColorSpace is empty");
    }
  }

}
