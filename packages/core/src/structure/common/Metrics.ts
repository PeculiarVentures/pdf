import { PDFNumeric } from "../../objects/Numeric";
import { PDFArray } from "../../objects/Array";
import { TypographyConverter, TypographySize } from "../../TypographyConverter";

/** Array of 6 numbers representing a transformation matrix [a,b,c,d,e,f] */
export type MetricsNumberArray = [
  number,
  number,
  number,
  number,
  number,
  number
];

/** 3x3 transformation matrix representation */
export type TransformationMatrix = [
  [number, number, 0],
  [number, number, 0],
  [number, number, 1]
];

/** Rotation transformation parameters */
export interface RotateTransformation {
  type: "rotate";
  /** Angle in degrees */
  angle: number;
}

/** Translation transformation parameters */
export interface TranslateTransformation {
  type: "translate";
  /** X-axis translation distance */
  x: TypographySize;
  /** Y-axis translation distance */
  y: TypographySize;
}

/** Scaling transformation parameters */
export interface ScaleTransformation {
  type: "scale";
  /** Horizontal scale factor */
  width: number;
  /** Vertical scale factor */
  height: number;
}

/** Skewing transformation parameters */
export interface SkewTransformation {
  type: "skew";
  /** Skews the X axis by an angle a */
  a: number;
  /** Skews the Y axis by an angle b */
  b: number;
}

export type Transformation =
  | ScaleTransformation
  | RotateTransformation
  | SkewTransformation
  | TranslateTransformation;
export type Transformations = Transformation[];

/**
 * Represents a transformation matrix in PDF documents.
 * Handles various geometric transformations like translation, rotation, scaling, and skewing.
 * The transformation matrix is represented as:
 * ```plaintext
 * | a b 0 |
 * | c d 0 |
 * | e f 1 |
 * ```
 */
export class Metrics extends PDFArray {
  /**
   * Converts degrees to radians
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  public static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Converts a 6-element array to a 3x3 transformation matrix
   * @param metrics - Array of 6 numbers [a,b,c,d,e,f]
   * @returns 3x3 transformation matrix
   */
  public static toMatrix(metrics: MetricsNumberArray): TransformationMatrix {
    return [
      [metrics[0], metrics[1], 0],
      [metrics[2], metrics[3], 0],
      [metrics[4], metrics[5], 1]
    ];
  }

  /**
   * Creates a new Metrics instance without attaching it to a document
   * @returns New Metrics instance with identity matrix values
   */
  public static createWithoutDocument(): Metrics {
    const metric = new Metrics();

    metric.onCreate();

    return metric;
  }

  /**
   * Sets a value in the transformation matrix
   * @param index - Index in the matrix array
   * @param v - New value to set
   */
  protected setValue(index: number, v: number): void {
    const num = this.get(index, PDFNumeric);
    num.value = v;

    this.modify();
  }

  /**
   * Gets a value from the transformation matrix
   * @param index - Index in the matrix array
   * @returns Value at the specified index
   */
  protected getValue(index: number): number {
    return this.get(index, PDFNumeric).value;
  }

  // Matrix component getters/setters
  /** Gets/sets the scaling factor for the x axis */
  public get a(): number {
    return this.getValue(0);
  }
  public set a(v: number) {
    this.setValue(0, v);
  }

  /** Gets/sets the horizontal skewing factor */
  public get b(): number {
    return this.getValue(1);
  }
  public set b(v: number) {
    this.setValue(1, v);
  }

  /** Gets/sets the vertical skewing factor */
  public get c(): number {
    return this.getValue(2);
  }
  public set c(v: number) {
    this.setValue(2, v);
  }

  /** Gets/sets the scaling factor for the y axis */
  public get d(): number {
    return this.getValue(3);
  }
  public set d(v: number) {
    this.setValue(3, v);
  }

  /** Gets/sets the horizontal translation */
  public get e(): number {
    return this.getValue(4);
  }
  public set e(v: number) {
    this.setValue(4, v);
  }

  /** Gets/sets the vertical translation */
  public get f(): number {
    return this.getValue(5);
  }
  public set f(v: number) {
    this.setValue(5, v);
  }

  /**
   * Initializes the metrics with identity matrix values
   */
  protected override onCreate(): void {
    this.items = [
      new PDFNumeric(1),
      new PDFNumeric(0),
      new PDFNumeric(0),
      new PDFNumeric(1),
      new PDFNumeric(0),
      new PDFNumeric(0)
    ];
  }

  /**
   * Converts the transformation matrix to an array representation
   * @returns Array of 6 numbers [a,b,c,d,e,f]
   */
  public toArray(): MetricsNumberArray {
    return [
      this.get(0, PDFNumeric).value,
      this.get(1, PDFNumeric).value,
      this.get(2, PDFNumeric).value,
      this.get(3, PDFNumeric).value,
      this.get(4, PDFNumeric).value,
      this.get(5, PDFNumeric).value
    ];
  }

  /**
   * Applies a transformation matrix to the current matrix
   * @param metrics - Transformation matrix to apply
   */
  protected transformMetrics(metrics: MetricsNumberArray): void {
    const current = this.toArray();

    const result = this.multiply(
      Metrics.toMatrix(current),
      Metrics.toMatrix(metrics)
    );

    this.a = result[0][0];
    this.b = result[0][1];
    this.c = result[1][0];
    this.d = result[1][1];
    this.e = result[2][0];
    this.f = result[2][1];
  }

  /**
   * Translates the coordinate system
   * @param x - Horizontal translation distance
   * @param y - Vertical translation distance
   */
  public translate(x: TypographySize, y: TypographySize): void {
    this.transformMetrics([
      1,
      0,
      0,
      1,
      TypographyConverter.toPoint(x),
      TypographyConverter.toPoint(y)
    ]);
  }

  /**
   * Scales the coordinate system
   * @param width - Horizontal scale factor
   * @param height - Vertical scale factor
   */
  public scale(width: number, height: number): void {
    this.transformMetrics([width, 0, 0, height, 0, 0]);
  }

  /**
   * Rotates the coordinate system
   * @param angle - Rotation angle in degrees
   */
  public rotate(angle: number): void {
    const radians = Metrics.toRadians(angle);
    const rc = Math.cos(radians);
    const rs = Math.sin(radians);

    this.transformMetrics([rc, rs, -rs, rc, 0, 0]);
  }

  /**
   * Skews the coordinate system
   * @param a - X-axis skew angle in degrees
   * @param b - Y-axis skew angle in degrees
   */
  public skew(a: number, b: number): void {
    const wx = Metrics.toRadians(a);
    const wy = Metrics.toRadians(b);

    this.transformMetrics([1, wx, wy, 1, 0, 0]);
  }

  /**
   * Applies a series of transformations in sequence
   * @param transforms - Array of transformation operations to apply
   */
  public transform(transforms: Transformations): void {
    for (const transform of transforms) {
      switch (transform.type) {
        case "rotate":
          this.rotate(transform.angle);
          break;
        case "scale":
          this.scale(transform.width, transform.height);
          break;
        case "skew":
          this.skew(transform.a, transform.b);
          break;
        case "translate":
          this.translate(transform.x, transform.y);
          break;
      }
    }
  }

  /**
   * Multiplies two matrices together
   * @param a - First matrix
   * @param b - Second matrix
   * @returns Result of matrix multiplication
   * @throws Error if matrices cannot be multiplied
   */
  protected multiply(a: number[][], b: number[][]): number[][] {
    if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) {
      throw new Error("Arguments should be in 2-dimensional array format");
    }
    const x = a.length,
      z = a[0].length,
      y = b[0].length;
    if (b.length !== z) {
      // XxZ & ZxY => XxY
      throw new Error(
        "Number of columns in the first matrix should be the same as the number of rows in the second"
      );
    }
    // eslint-disable-next-line prefer-spread
    const productRow = Array.apply(null, new Array(y)).map(
      Number.prototype.valueOf,
      0
    );
    const product = new Array(x);
    for (let p = 0; p < x; p++) {
      product[p] = productRow.slice();
    }
    for (let i = 0; i < x; i++) {
      for (let j = 0; j < y; j++) {
        for (let k = 0; k < z; k++) {
          product[i][j] += a[i][k] * b[k][j];
        }
      }
    }

    return product;
  }
}
