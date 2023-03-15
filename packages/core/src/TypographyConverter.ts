export interface PrintMetricConverter {
  names: string[];
  toPoint(value: number): number;
}

class PixelConverter {
  public static names = ["px"];
  public static toPoint(value: number): number {
    return value / 0.75;
  }
}

class PointConverter {
  public static names = ["pt"];
  public static toPoint(value: number): number {
    return value;
  }
}

class InchConverter {
  public static names = ["in"];
  public static toPoint(value: number): number {
    return value * 72;
  }
}

class CentimeterConverter {
  public static names = ["cm"];
  public static toPoint(value: number): number {
    const inches = value / 2.54;

    return InchConverter.toPoint(inches);
  }
}

class MillimeterConverter {
  public static names = ["mm"];
  public static toPoint(value: number): number {
    const cm = value / 10;

    return CentimeterConverter.toPoint(cm);
  }
}

export type TypographySize = number | string;

/**
 * Point (typography) converter
 * @see https://en.wikipedia.org/wiki/Point_(typography)
 */
export class TypographyConverter {
  public static converters: PrintMetricConverter[] = [
    PixelConverter,
    PointConverter,
    InchConverter,
    MillimeterConverter,
    CentimeterConverter,
  ];

  public static register(converter: PrintMetricConverter): void {
    this.converters.push(converter);
  }

  public static findConverter(name: string): PrintMetricConverter | null {
    const lcName = name.toLowerCase();
    for (const converter of this.converters) {
      if (converter.names.includes(lcName)) {
        return converter;
      }
    }

    return null;
  }

  public static toPoint(value: TypographySize): number {
    try {
      const textValue = `${value}`;
      // parse value and get require converter
      const matches = /(-?[0-9.]+(?:e-[0-9]+)?) *([a-z]+)?/i.exec(textValue);
      if (!matches) {
        throw new Error("Point size doesn't match to RegEx.");
      }

      let point = 0;
      const floatValue = parseFloat(matches[1]);
      if (isNaN(floatValue)) {
        throw new Error("Float number has wrong format.");
      }

      const metrics = matches[2];
      if (metrics) {
        const converter = this.findConverter(metrics);
        if (!converter) {
          throw new Error(`Unknown type of converter '${metrics}'`);
        }

        point = converter.toPoint(floatValue);
      } else {
        // Use default converter
        point = PointConverter.toPoint(floatValue);
      }


      // Round to 2 decimal places
      return Math.round(point * 100) / 100;
    } catch (e) {
      const message = "Cannot parse Typography point size.";

      if (e instanceof Error) {
        e.message = `${message} ${e.message}`;
        throw e;
      }

      throw new Error(message);
    }
  }

  /**
   * Converts typography size value to PDF Numeric
   * @param value Typography size value
   * @returns PDF number
   */
  public static toPDFNumeric(value: TypographySize): PDFNumeric {
    const valuePt = this.toPoint(value);

    return new PDFNumeric(valuePt);
  }

}

import { PDFNumeric } from "./objects/Numeric";
