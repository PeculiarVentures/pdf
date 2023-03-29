import * as core from "@peculiarventures/pdf-core";
import { type PDFDocument } from "./Document";
import { FormObject } from "./FormObject";
import { Image } from "./Image";
import { ImageDrawParameters, TextDrawParams } from "./Page";
import { WrapObject } from "./WrapObject";

export interface WatermarkParams {
  /**
   *  The amount to translate the associated content vertically, as a
   * percentage of the height of the target media.
   * 1.0 represents 100% and 0.0 represents 0%. Negative
   * values should not be used, since they may cause content to be drawn off the
   * media.
   * Default value 0.
   */
  v?: number;
  /**
   *  The amount to translate the associated content horizontally, as a
   * percentage of the width of the target media.
   * 1.0 represents 100% and 0.0 represents 0%. Negative
   * values should not be used, since they may cause content to be drawn off the
   * media.
   * Default value 0.
   */
  h?: number;

  /**
   * The matrix used to transform the annotation’s rectangle before
   * rendering.
   * Default value: the identity matrix [1 0 0 1 0 0].
   */
  matrix?: core.Metrics;

  left?: core.TypographySize;
  top?: core.TypographySize;

  pageHeight: core.TypographySize;

  appearance: FormObject;

  flags?: core.AnnotationFlags;
}

export interface WatermarkAppearance {
  type: string;
}

export interface ImageAppearance extends WatermarkAppearance {
  type: "image";
  image: Image;
  params: ImageDrawParameters;
}
export interface TextAppearance extends WatermarkAppearance {
  type: "text";
  params: TextDrawParams;
}

export class Watermark extends WrapObject<core.WatermarkDictionary> {
  static DEFAULT_0 = 0;

  public static create(params: WatermarkParams, document: PDFDocument): Watermark {
    params.top = core.TypographyConverter.toPoint(params.pageHeight) - core.TypographyConverter.toPoint(params.top || this.DEFAULT_0);

    const watermark = core.WatermarkDictionary.create(document.target.update);

    // count position
    const positionX = core.TypographyConverter.toPoint(params.left ?? 0);
    const positionY = core.TypographyConverter.toPoint(params.top ?? params.appearance.height) - params.appearance.height;

    watermark.AP.get().N = params.appearance.target.makeIndirect();

    // add fixedPrint
    if (params.v || params.h || params.matrix) {
      const fixedPrint = core.FixedPrintDictionary.create(document.target.update);
      if (params.v) {
        fixedPrint.V = params.v;
      }
      if (params.h) {
        fixedPrint.H = params.h;
      }
      if (params.matrix) {
        fixedPrint.Matrix.set(params.matrix);
      }
      watermark.FixedPrint = fixedPrint.makeIndirect();
    }

    // add position
    watermark.rect = core.PDFRectangle.create(document.target.update);
    watermark.rect.llX = positionX;
    watermark.rect.llY = positionY;
    watermark.rect.urX = positionX + params.appearance.width;
    watermark.rect.urY = positionY + params.appearance.height;

    // add flags
    if (params.flags) {
      watermark.f = params.flags;
    }

    return new this(watermark, document);
  }
}
