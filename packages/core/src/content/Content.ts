import { EventEmitter } from "events";
import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";

import { ViewReader } from "../ViewReader";
import * as objects from "../objects";
import { TypographyConverter, TypographySize } from "../TypographyConverter";
import { Metrics, Transformations } from "../structure/common/Metrics";
import { PDFOperator } from "./Operator";

export type PDFContentCreateParams = [string, ...objects.PDFObjectTypes[]];

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

    return color.map(o => new objects.PDFNumeric(o));
  }

  public static toPDFArray(color: Colors): objects.PDFArray {
    return new objects.PDFArray(...this.toPDFNumberArray(color));
  }
}

/**
 * Line cap styles
 */
export enum LineCapStyle {
  /**
   * Butt cap. The stroke shall be squared off at the endpoint of the path. There shall be
   * no projection beyond the end of the path.
   */
  buttCap = 0,
  /**
   * Round cap. A semicircular arc with a diameter equal to the line width shall be
   * drawn around the endpoint and shall be filled in.
   */
  roundCap = 1,
  /**
   * Projecting square cap. The stroke shall continue beyond the endpoint of the path
   * for a distance equal to half the line width and shall be squared off.
   */
  projectingSquareCap = 2,
}

export enum LineJoinStyle {
  /**
   * Miter join. The outer edges of the strokes for the two segments shall be extended
   * until they meet at an angle, as in a picture frame. If the segments meet at too sharp
   * an angle (as defined by the miter limit parameter — see 8.4.3.5, "Miter limit"), a
   * bevel join shall be used instead.
   */
  miterJoin = 0,

  /**
   * Round join. An arc of a circle with a diameter equal to the line width shall be drawn
   * around the point where the two segments meet, connecting the outer edges of the
   * strokes for the two segments. This pie-slice-shaped figure shall be filled in,
   * producing a rounded corner.
   */
  roundJoin = 1,

  /**
   * Bevel join. The two segments shall be finished with butt caps (see 8.4.3.3, "Line cap
   * style") and the resulting notch beyond the ends of the segments shall be filled with
   * a triangle.
   */
  bevelJoin = 2,
}

export interface ContentSetFontSizeParameters {
  font: string;
  size: number;
}

export interface ClippingAreaParams {
  x: TypographySize;
  y: TypographySize;
  width: TypographySize;
  height: TypographySize;
}
export interface ContentDrawTextParameters extends ContentSetFontSizeParameters {
  graphicsState?: string;
  color: Colors;
  clippingArea?: ClippingAreaParams;
  transforms?: Transformations;
}

export interface ContextDrawEllipseParameters {
  borderWidth: TypographySize;
  borderColor?: Colors;
  bgColor?: Colors;
}

export class PDFContent extends EventEmitter {

  public static readonly SPLITTERS = " \n\r\t";

  public static create(...params: PDFContentCreateParams[]): PDFContent {
    const content = new PDFContent();

    return content.push(...params);
  }

  public override emit(event: "clear"): boolean;
  public override emit(event: "push", operator: PDFOperator | PDFContentScope): boolean;
  public override emit(event: string | symbol, ...args: any[]): boolean;
  public override emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  public override on(event: "clear", listener: () => void): this;
  public override on(event: "push", listener: (operator: PDFOperator | PDFContentScope) => void): this;
  public override on(event: string | symbol, listener: (...args: any[]) => void): this;
  public override on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  public override once(event: "clear", listener: () => void): this;
  public override once(event: "push", listener: (operator: PDFOperator | PDFContentScope) => void): this;
  public override once(event: string | symbol, listener: (...args: any[]) => void): this;
  public override once(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.once(event, listener);
  }

  public push(scope: PDFContentScope): this;
  public push(operator: PDFOperator): this;
  public push(...params: PDFContentCreateParams[]): this;
  public push(...params: any[]): this {
    if (params.length === 1) {
      const param = params[0];
      if (param instanceof PDFContentScope
        || param instanceof PDFOperator) {
        this.emit("push", param);
        this.operators.push(param);

        return this;
      }
    }

    for (const [name, ...parameters] of params) {
      const operator = PDFOperator.create(name, ...parameters);

      this.push(operator);
    }

    return this;
  }

  public operators: Array<PDFOperator | PDFContent> = [];

  public clear(): this {
    this.operators = [];
    this.emit("clear");

    return this;
  }

  public static fromString(data: string): PDFContent {
    const content = new PDFContent();

    content.fromString(data);

    return content;
  }

  public fromString(data: string): void {
    const viewReader = new ViewReader(Convert.FromBinary(data));

    let args: objects.PDFObjectTypes[] = [];
    while (!viewReader.isEOF) {
      try {
        const arg = objects.PDFObjectReader.read(viewReader);
        if (arg instanceof objects.PDFComment) {
          continue;
        }

        args.push(arg);
      } catch {
        const name = viewReader.read((v) => PDFContent.SPLITTERS.includes(String.fromCharCode(v)));
        if (!name.length) {
          break;
        }

        const operator = new PDFOperator();
        operator.name = Convert.ToUtf8String(name, "ascii");
        operator.parameters = args;
        this.operators.push(operator);

        args = [];
      }
    }
  }

  public override toString(singleLine = false): string {
    const splitter = singleLine ? " " : "\n";

    return this.operators
      .map(o => o.toString(singleLine))
      .join(splitter);
  }

  public setFontAndSize(params: ContentSetFontSizeParameters): this {
    return this.push(["Tf", new objects.PDFName(params.font), new objects.PDFNumeric(params.size)]);
  }

  public toArrayBuffer(): ArrayBuffer {
    const text = this.toString();

    return Convert.FromBinary(text);
  }

  public toUint8Array(): Uint8Array {
    const buffer = this.toArrayBuffer();

    return new Uint8Array(buffer);
  }

  //#region Graphics state operators

  /**
   * Save the current graphics state on the graphics state stack
   */
  public graphicsBegin(): this {
    return this.push(["q"]);
  }

  /**
   * Restore the graphics state by removing the most recently saved state from the
   * stack and making it the current state
   */
  public graphicsEnd(): this {
    return this.push(["Q"]);
  }

  public graphicsState(dictName: string): this {
    return this.push(["gs", new objects.PDFName(dictName)]);
  }

  /**
   * Modify the current transformation matrix (CTM) by concatenating the specified
   * matrix (see 8.3.2, "Coordinate spaces"). Although the operands specify a matrix,
   * they shall be written as six separate numbers, not as an array.
   * @param a Operand in matrix
   * @param b Operand in matrix
   * @param c Operand in matrix
   * @param d Operand in matrix
   * @param e Operand in matrix
   * @param f Operand in matrix
   * @returns
   */
  public concatMatrix(a: TypographySize, b: TypographySize, c: TypographySize, d: TypographySize, e: TypographySize, f: TypographySize): this {
    this.push(["cm", TypographyConverter.toPDFNumeric(a), TypographyConverter.toPDFNumeric(b), TypographyConverter.toPDFNumeric(c), TypographyConverter.toPDFNumeric(d), TypographyConverter.toPDFNumeric(e), TypographyConverter.toPDFNumeric(f)]);

    return this;
  }

  /**
   * Set the line width in the graphics state
   * @param width
   */
  public setLineWidth(width: TypographySize): this {
    this.push(["w", TypographyConverter.toPDFNumeric(width)]);

    return this;
  }

  /**
   * Set the line cap style in the graphics state
   * @param cap Line cap style
   */
  public setLineCap(cap: LineCapStyle): this {
    this.push(["J", new objects.PDFNumeric(cap)]);

    return this;
  }

  /**
   * Set the line join style in the graphics state
   * @param join Line join style
   */
  public setLineJoin(join: LineJoinStyle): this {
    this.push(["j", new objects.PDFNumeric(join)]);

    return this;
  }

  //#endregion

  //#region Path construction operators

  /**
   * Begin a new subpath by moving the current point to coordinates (x, y), omitting any
   * connecting line segment. If the previous path construction operator in the current path was
   * also m, the new m overrides it; no vestige of the previous m operation remains in the path.
   * @param x Typography size of X coordinate
   * @param y Typography size of Y coordinate
   */
  public moveTo(x: TypographySize, y: TypographySize): this {
    this.push(["m", TypographyConverter.toPDFNumeric(x), TypographyConverter.toPDFNumeric(y)]);

    return this;
  }

  /**
   * Append a straight line segment from the current point to the point (x, y). The new current
   * point shall be (x, y).
   */
  public lineTo(x: TypographySize, y: TypographySize): this {
    this.push(["l", TypographyConverter.toPDFNumeric(x), TypographyConverter.toPDFNumeric(y)]);

    return this;
  }

  /**
   * Append a cubic Bézier curve to the current path. The curve shall extend from the current
   * point to the point (x3 , y3), using (x1, y1 ) and (x2, y2 ) as the Bézier control points (see 8.5.2.2,
   * y3 "Cubic Bézier curves"). The new current point shall be (x3 , y3 ).
   */
  public curveTo(x1: TypographySize, y1: TypographySize, x2: TypographySize, y2: TypographySize, x3: TypographySize, y3: TypographySize): this {
    this.push(["c",
      TypographyConverter.toPDFNumeric(x1), TypographyConverter.toPDFNumeric(y1),
      TypographyConverter.toPDFNumeric(x2), TypographyConverter.toPDFNumeric(y2),
      TypographyConverter.toPDFNumeric(x3), TypographyConverter.toPDFNumeric(y3),
    ]);

    return this;
  }

  //#endregion

  //#region Path-painting operators

  /**
   * Stroke the path
   * @param close Close or not
   */
  public stroke(close = false): this {
    this.push([close ? "s" : "S"]);

    return this;
  }

  /**
   * Fill the path, using the non-zero winding number rule to determine the region to fill
   */
  public fill(): this {
    this.push(["f"]);

    return this;
  }

  /**
   * End the path object without filling or stroking it. This operator shall be a path-painting no-op,
   * used primarily for the side effect of changing the current clipping path (see 8.5.4, "Clipping path
   * operators").
   */
  public pathEnd(): this {
    this.push(["n"]);

    return this;
  }

  //#endregion

  //#region Clipping paths

  public clippingArea(params: ClippingAreaParams): this {

    this.push(["re",
      TypographyConverter.toPDFNumeric(params.x), TypographyConverter.toPDFNumeric(params.y),
      TypographyConverter.toPDFNumeric(params.width), TypographyConverter.toPDFNumeric(params.height)]);
    this.clip();
    this.pathEnd();

    return this;
  }

  /**
   * Modify the current clipping path by intersecting it with the current path, using the non-zero
   * winding number rule to determine which regions lie inside the clipping path.
   */
  public clip(): this {
    this.push(["W"]);

    return this;
  }

  /**
   * Modify the current clipping path by intersecting it with the current path, using the even-odd
   * rule to determine which regions lie inside the clipping path.
   */
  public clipEO(): this {
    this.push(["W*"]);

    return this;
  }

  //#endregion

  //#region Text objects

  public textBegin(): this {
    this.push(["BT"]);

    return this;
  }

  public textEnd(): this {
    this.push(["ET"]);

    return this;
  }

  //#endregion

  //#region Text state

  /**
   * Set the character spacing, Tc, to charSpace, which shall be a number expressed in
   * unscaled text space units. Character spacing shall be used by the Tj, TJ, and '
   * operators. Initial value: 0.
   * @param charSpace Char space
   */
  public textCharacterSpacing(charSpace: TypographySize): this {
    this.push(["Tc", TypographyConverter.toPDFNumeric(charSpace)]);

    return this;
  }

  /**
   * Set the word spacing, Tw, to wordSpace, which shall be a number expressed in
   * unscaled text space units. Word spacing shall be used by the Tj, TJ, and ' operators.
   * Initial value: 0.
   * @param wordSpace Word space
   */
  public textWordSpacing(wordSpace: TypographySize): this {
    this.push(["Tw", TypographyConverter.toPDFNumeric(wordSpace)]);

    return this;
  }

  /**
   * Set the horizontal scaling, Th , to (scale ÷ 100). scale shall be a number specifying
   * the percentage of the normal width. Initial value: 100 (normal width).
   * @param scale Scale in the percentage of the normal width
   * @returns
   */
  public textScale(scale: number): this {
    this.push(["Tz", TypographyConverter.toPDFNumeric(scale)]);

    return this;
  }

  /**
   * Set the text leading, Tl , to leading, which shall be a number expressed in unscaled
   * text space units. Text leading shall be used only by the T*, ', and " operators. Initial
   * value: 0.
   * @param leading Leading
   */
  public textLeading(leading: TypographySize): this {
    this.push(["TL", TypographyConverter.toPDFNumeric(leading)]);

    return this;
  }

  /**
   * Set the text font, Tf, to font and the text font size, Tfs, to size. font shall be the name
   * of a font resource in the Font subdictionary of the current resource dictionary;
   * size shall be a number representing a scale factor. There is no initial value for
   * either font or size; they shall be specified explicitly by using Tf before any text is
   * shown. Zero sized text shall not mark or clip any pixels (depending on text render
   * mode).
   * @param font Font name
   * @param size Font size
   */
  public textFont(font: string, size: TypographySize): this {
    this.push(["Tf", new objects.PDFName(font), TypographyConverter.toPDFNumeric(size)]);

    return this;
  }

  /**
   * Set the text rendering mode, Tmode, to render, which shall be an integer.
   * Initial value: 0.
   * @param render
   */
  public textRender(render: number): this {
    this.push(["Tr", new objects.PDFNumeric(render)]);

    return this;
  }

  /**
   * Set the text rise, Trise , to rise, which shall be a number expressed in unscaled text
   * space units. Initial value: 0.
   * @param rise
   */
  public textRise(rise: TypographySize): this {
    this.push(["Ts", TypographyConverter.toPDFNumeric(rise)]);

    return this;
  }

  //#endregion

  //#region Text positioning

  /**
   * Move to the start of the next line, offset from the start of the
   * current line by (tx , ty ). tx and ty shall denote numbers expressed in
   * unscaled text space units.
   * @param x
   * @param y
   */
  public textMove(x: TypographySize, y: TypographySize): this {
    this.push(["Td", TypographyConverter.toPDFNumeric(x), TypographyConverter.toPDFNumeric(y)]);

    return this;
  }

  /**
   * Move to the start of the next line, offset from the start of the
   * current line by (tx , ty ). As a side effect, this operator shall set the
   * leading parameter in the text state
   * @param x
   */
  public textMoveLeading(x: TypographySize, y: TypographySize): this {
    this.push(["TD", TypographyConverter.toPDFNumeric(x), TypographyConverter.toPDFNumeric(y)]);

    return this;
  }

  /**
   * Set the text matrix, Tm , and the text line matrix, Tlm
   * @param a
   * @param b
   * @param c
   * @param d
   * @param e
   * @param f
   */
  public textMatrix(a: number, b: number, c: number, d: number, e: number, f: number): this;
  public textMatrix(matrix: Metrics): this;
  public textMatrix(a: number | Metrics, b = 0, c = 0, d = 1, e = 0, f = 0): this {
    if (a instanceof Metrics) {
      this.push(["Tm", a]);
    } else {
      this.push(["Tm", TypographyConverter.toPDFNumeric(a), TypographyConverter.toPDFNumeric(b), TypographyConverter.toPDFNumeric(c), TypographyConverter.toPDFNumeric(d), TypographyConverter.toPDFNumeric(e), TypographyConverter.toPDFNumeric(f)]);
    }

    return this;
  }

  public textTransform(transforms: Transformations): this {
    const matrix = Metrics.createWithoutDocument();

    matrix.transform(transforms);

    return this.textMatrix(
      matrix.a,
      matrix.b,
      matrix.c,
      matrix.d,
      matrix.e,
      matrix.f,
    );
  }

  /**
   * Move to the start of the next line. This operator has the same effect as the code
   * @returns
   */
  public textNextLine(): this {
    this.push(["T*"]);

    return this;
  }

  //#endregion

  //#region Text showing

  /**
   * Show a text string
   * @param text
   */
  public textShow(text: string | objects.PDFLiteralString | objects.PDFHexString | BufferSource): this {
    if (typeof text === "string") {
      text = new objects.PDFLiteralString(text);
    } else if (BufferSourceConverter.isBufferSource(text)) {
      text = new objects.PDFHexString(text);
    }

    this.push(["Tj", text]);

    return this;
  }

  //#endregion

  //#region Color

  /**
   * Sets color
   * @example
   * ```
   * content.setColor(0.5); // 0.5 g % grayscale filling
   * content.setColor(0.5, true); // 0.5 G % grayscale stroking
   *
   * content.setColor([0, 0, 1]); // 0 0 1 rg % RGB filling
   * content.setColor([0, 0, 1], true); // 0 0 1 RG % RGB stroking
   *
   * content.setColor([0, 0, 0, 1]); // 0 0 0 1 k % CMYK filling
   * content.setColor([0, 0, 0, 1], true); // 0 0 0 1 K % CMYK stroking
   *
   * ```
   * @param color
   * @param stroking
   * @returns
   */
  public setColor(color: Colors, stroking = false): this {
    let operator: string;
    let parameters: objects.PDFNumeric[];
    if (typeof color === "number") {
      // grayscale
      operator = stroking
        ? "G"
        : "g";
      parameters = [new objects.PDFNumeric(color)];
    } else if (color.length === 1) {
      // grayscale
      operator = stroking
        ? "G"
        : "g";
      parameters = color.map(o => new objects.PDFNumeric(o));
    } else if (color.length === 3) {
      // RGB
      operator = stroking
        ? "RG"
        : "rg";
      parameters = color.map(o => new objects.PDFNumeric(o));
    } else {
      // CMYK
      operator = stroking
        ? "K"
        : "k";
      parameters = color.map(o => new objects.PDFNumeric(o));
    }

    this.push([operator, ...parameters]);

    return this;
  }
  //#endregion

  //#region XObject
  public drawXObject(name: string): this {
    this.push(["Do", new objects.PDFName(name)]);

    return this;
  }
  //#endregion

  //#region Marked content

  /**
   * Begin a marked-content sequence
   * @param tag
   * @param properties
   */
  public markedContentBegin(tag: string, properties?: objects.PDFDictionary): this {
    if (properties) {
      this.push(["BMC", new objects.PDFName(tag), properties]);
    } else {
      this.push(["BDC", new objects.PDFName(tag)]);
    }

    return this;
  }

  /**
   * End a marked-content sequence
   */
  public markedContentEnd(): this {
    this.push(["EMC"]);

    return this;
  }

  //#endregion

  /**
   * Draws a circle
   * @param x X coordinate of the circle center
   * @param y Y coordinate of the circle center
   * @param r Radius of the circle
   */
  public drawCircle(x: TypographySize, y: TypographySize, r: TypographySize): this {
    const curvePt = 0.5523;

    const xPt = TypographyConverter.toPoint(x);
    const yPt = TypographyConverter.toPoint(y);
    const rPt = TypographyConverter.toPoint(r);

    return this
      .moveTo(xPt + rPt, yPt)
      .curveTo(xPt + rPt, yPt + rPt * curvePt, xPt + rPt * curvePt, yPt + rPt, xPt, yPt + rPt)
      .curveTo(xPt - rPt * curvePt, yPt + rPt, xPt - rPt, yPt + rPt * curvePt, xPt - rPt, yPt)
      .curveTo(xPt - rPt, yPt - rPt * curvePt, xPt - rPt * curvePt, yPt - rPt, xPt, yPt - rPt)
      .curveTo(xPt + rPt * curvePt, yPt - rPt, xPt + rPt, yPt - rPt * curvePt, xPt + rPt, yPt);
  }

  /**
   * Draws rectangle
   * @param x X coordinate (left top corner)
   * @param y Y coordinate (left top corner)
   * @param width Width
   * @param height Height
   * @returns
   */
  public drawRectangle(x: TypographySize, y: TypographySize, width: TypographySize, height: TypographySize): this {
    const xPt = TypographyConverter.toPoint(x);
    const yPt = TypographyConverter.toPoint(y);
    const heightPt = TypographyConverter.toPoint(height);
    const widthPt = TypographyConverter.toPoint(width);

    this.push(["re",
      new objects.PDFNumeric(xPt), new objects.PDFNumeric(yPt),
      new objects.PDFNumeric(widthPt), new objects.PDFNumeric(heightPt)]);

    return this;
  }

  public translate(x: TypographySize, y: TypographySize): this {
    return this.concatMatrix(1, 0, 0, 1, x, y);
  }

  public scale(width: TypographySize, height: TypographySize): this {
    return this.concatMatrix(width, 0, 0, height, 0, 0);
  }

  public skew(a: number, b: number): this {
    return this.concatMatrix(1, Math.tan(Metrics.toRadians(a)), Math.tan(Metrics.toRadians(b)), 1, 0, 0);
  }

  public rotate(angle: number): this {
    const radians = Metrics.toRadians(angle);

    return this.concatMatrix(
      Math.cos(radians),
      Math.sin(radians),
      -Math.sin(radians),
      Math.cos(radians),
      0,
      0,
    );
  }

  public transform(params: Transformations): this {
    if (params.length) {
      const metrics = Metrics.createWithoutDocument();
      metrics.transform(params);

      return this.concatMatrix(...metrics.toArray());
    }

    return this;
  }

  public graphics(): PDFGraphicsScope {
    const scope = new PDFGraphicsScope();
    this.push(scope);

    return scope;
  }

  public text(variable = false): PDFTextScope {
    const scope = (variable)
      ? new PDFContentScope(PDFOperator.fromString("/Tx BMC"), PDFOperator.fromString("EMC"))
      : new PDFTextScope();
    this.push(scope);

    return scope;
  }

}

export class PDFContentScope extends PDFContent {

  constructor(
    public begin: PDFOperator,
    public end: PDFOperator,
  ) {
    super();

    this.push(begin);
  }

  public override toString(singleLine?: boolean): string {
    this.push(this.end);

    return super.toString(singleLine);
  }

}

export class PDFGraphicsScope extends PDFContentScope {

  public static readonly BEGIN = PDFOperator.create("q");
  public static readonly END = PDFOperator.create("Q");

  constructor() {
    super(
      PDFGraphicsScope.BEGIN,
      PDFGraphicsScope.END,
    );
  }

}

export class PDFTextScope extends PDFContentScope {

  public static readonly BEGIN = PDFOperator.create("BT");
  public static readonly END = PDFOperator.create("ET");

  constructor() {
    super(
      PDFTextScope.BEGIN,
      PDFTextScope.END,
    );
  }

}
