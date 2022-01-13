import { PDFArray, PDFArrayField, PDFDictionary, PDFNumberField, PDFNameField } from "../../objects";

export enum BorderStyle {
  /**
   * A solid rectangle surrounding the annotation
   */
  solid = "S",
  /**
   * A dashed rectangle surrounding the annotation. The dash pattern
   * may be specified by the D entry
   */
  dashed = "D",
  /**
   * A simulated embossed rectangle that appears to be raised above
   * the surface of the page
   */
  beveled = "B",
  /**
   * A simulated engraved rectangle that appears to be recessed below
   * the surface of the page
   */
  insert = "I",
  /**
   * A single line along the bottom of the annotation rectangle
   */
  underline = "U",
}

export class BorderStyleDictionary extends PDFDictionary {

  public static readonly TYPE = "Border";

  /**
   * The type of PDF object that this dictionary describes; if present, shall
   * be `Border` for a border style dictionary. 
   */
  @PDFNameField("Type", true)
  public type!: typeof BorderStyleDictionary.TYPE | null;

  /**
   * The border width in points. If this value is 0, no border shall drawn. 
   * Default value: 1
   */
  @PDFNumberField("W", true, 1)
  public W!: number;

  /**
   * The border style
   */
  @PDFNameField("S", true)
  public S!: BorderStyle | null;

  /**
   * A dash array defining a pattern of dashes and gaps that shall be used in
   * drawing a dashed border (border style D in the S entry). The dash array shall be
   * specified in the same format as in the line dash pattern parameter of the graphics
   * state (see 8.4.3.6, "Line dash pattern"). The dash phase shall not be specified and
   * shall be assumed to be 0.
   */
  @PDFArrayField("D", true)
  public D!: PDFArray | null;

  protected override onCreate(): void {
    this.type = BorderStyleDictionary.TYPE;
  }

}
