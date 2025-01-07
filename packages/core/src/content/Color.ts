import * as objects from "../objects";

export type GrayscaleColor = number | [number];
export type RGBColor = [number, number, number];
export type CMYKColor = [number, number, number, number];

export type Colors = GrayscaleColor | RGBColor | CMYKColor;

export class ColorConverter {
  public static fromPDFNumberArray(array: objects.PDFNumeric[]): Colors {
    const res: number[] = [];

    for (const item of array) {
      res.push(item.value);
    }

    return res as Colors;
  }

  public static fromPDFArray(array: objects.PDFArray): Colors {
    const res: number[] = [];

    for (const item of array) {
      if (item instanceof objects.PDFNumeric) {
        res.push(item.value);
      }
    }

    if (!res.length) {
      // if array is empty, then it is grayscale with white color
      return 1;
    }

    return res as Colors;
  }

  public static toPDFNumberArray(color: Colors): objects.PDFNumeric[] {
    if (typeof color === "number") {
      // grayscale
      return [new objects.PDFNumeric(color)];
    }

    return color.map((o) => new objects.PDFNumeric(o));
  }

  public static toPDFArray(color: Colors): objects.PDFArray {
    return new objects.PDFArray(...this.toPDFNumberArray(color));
  }
}
