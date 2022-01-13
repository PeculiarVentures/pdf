import { PDFArray, PDFNumeric } from "../../objects";
import { TypographyConverter, TypographySize } from "../../TypographyConverter";

export type MetricsNumberArray = [number, number, number, number, number, number];

export type TransformationMatrix = [
  [number, number, 0],
  [number, number, 0],
  [number, number, 1],
];

export interface RotateTransformation {
  type: "rotate";
  angle: number;
}

export interface TranslateTransformation {
  type: "translate";
  x: TypographySize;
  y: TypographySize;
}

export interface ScaleTransformation {
  type: "scale";
  width: number;
  height: number;
}

export interface SkewTransformation {
  type: "skew";
  /**
   * Skews the X axis by an angle a
   */
  a: number;
  /**
   * Skews the Y axis by an angle b
   */
  b: number;
}

export type Transformation = ScaleTransformation | RotateTransformation | SkewTransformation | TranslateTransformation;
export type Transformations = Transformation[];

export class Metrics extends PDFArray {

  public static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  public static toMatrix(metrics: MetricsNumberArray): TransformationMatrix {
    return [
      [metrics[0], metrics[1], 0],
      [metrics[2], metrics[3], 0],
      [metrics[4], metrics[5], 1],
    ];
  }

  // ? Maybe optional `update` in create method is better
  public static createWithoutDocument(): Metrics {
    const metric = new Metrics();

    metric.onCreate();

    return metric;
  }

  protected setValue(index: number, v: number): void {
    const num = this.get(index, PDFNumeric);
    num.value = v;

    this.modify();
  }

  protected getValue(index: number): number {
    return this.get(index, PDFNumeric).value;
  }

  public get a(): number {
    return this.getValue(0);
  }

  public set a(v: number) {
    this.setValue(0, v);
  }

  public get b(): number {
    return this.getValue(1);
  }

  public set b(v: number) {
    this.setValue(1, v);
  }

  public get c(): number {
    return this.getValue(2);
  }

  public set c(v: number) {
    this.setValue(2, v);
  }

  public get d(): number {
    return this.getValue(3);
  }

  public set d(v: number) {
    this.setValue(3, v);
  }

  public get e(): number {
    return this.getValue(4);
  }

  public set e(v: number) {
    this.setValue(4, v);
  }

  public get f(): number {
    return this.getValue(5);
  }

  public set f(v: number) {
    this.setValue(5, v);
  }

  protected override onCreate(): void {
    this.items = [
      new PDFNumeric(1),
      new PDFNumeric(0),
      new PDFNumeric(0),
      new PDFNumeric(1),
      new PDFNumeric(0),
      new PDFNumeric(0),
    ];
  }

  public toArray(): MetricsNumberArray {
    return [
      this.get(0, PDFNumeric).value,
      this.get(1, PDFNumeric).value,
      this.get(2, PDFNumeric).value,
      this.get(3, PDFNumeric).value,
      this.get(4, PDFNumeric).value,
      this.get(5, PDFNumeric).value,
    ];
  }

  protected transformMetrics(metrics: MetricsNumberArray): void {
    const current = this.toArray();

    const result = this.multiply(Metrics.toMatrix(current), Metrics.toMatrix(metrics));

    this.a = result[0][0];
    this.b = result[0][1];
    this.c = result[1][0];
    this.d = result[1][1];
    this.e = result[2][0];
    this.f = result[2][1];
  }

  public translate(x: TypographySize, y: TypographySize): void {
    this.transformMetrics([
      1,
      0,
      0,
      1,
      TypographyConverter.toPoint(x),
      TypographyConverter.toPoint(y),
    ]);
  }

  public scale(width: number, height: number): void {
    this.transformMetrics([
      width,
      0,
      0,
      height,
      0,
      0,
    ]);
  }

  public rotate(angle: number): void {
    const radians = Metrics.toRadians(angle);
    const rc = Math.cos(radians);
    const rs = Math.sin(radians);

    this.transformMetrics([
      rc,
      rs,
      -rs,
      rc,
      0,
      0,
    ]);
  }

  public skew(a: number, b: number): void {
    const wx = Metrics.toRadians(a);
    const wy = Metrics.toRadians(b);

    this.transformMetrics([
      1,
      wx,
      wy,
      1,
      0,
      0,
    ]);
  }

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
   * Multiplies two matrixes
   * @param a The first matrix
   * @param b The second matrix
   * @returns 
   * Taken from https://www.tutorialspoint.com/algorithm-for-matrix-multiplication-in-javascript
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
      throw new Error("Number of columns in the first matrix should be the same as the number of rows in the second");
    }
    // eslint-disable-next-line prefer-spread
    const productRow = Array.apply(null, new Array(y)).map(Number.prototype.valueOf, 0);
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
