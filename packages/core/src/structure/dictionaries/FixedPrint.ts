import * as objects from "../../objects";
import { Metrics } from "../common/Metrics";

export class FixedPrintDictionary extends objects.PDFDictionary {

  public static readonly TYPE = "FixedPrint";
  static DEFAULT_0 = 0;

  /**
   * The type of PDF object that this dictionary describes
   */
  @objects.PDFNameField("Type")
  public Type!: typeof FixedPrintDictionary.TYPE;

  /**
   * The matrix used to transform the annotation’s rectangle before
   * rendering. 
   */
  @objects.PDFMaybeField("Matrix", Metrics)
  public Matrix!: objects.Maybe<Metrics>;

  /**
   * The amount to translate the associated content horizontally, as a
   * percentage of the width of the target media (or if unknown, the width of the
   * page’s MediaBox). 1.0 represents 100% and 0.0 represents 0%. Negative
   * values should not be used, since they may cause content to be drawn off the
   * media. 
   * Default value: 0.
   */
  @objects.PDFNumberField("H", true, FixedPrintDictionary.DEFAULT_0)
  public H!: number;

  /**
   * The amount to translate the associated content vertically, as a
   * percentage of the height of the target media (or if unknown, the height of the
   * page’s MediaBox). 1.0 represents 100% and 0.0 represents 0%. Negative
   * values should not be used, since they may cause content to be drawn off the
   * media. 
   * Default value: 0.
   */
  @objects.PDFNumberField("V", true, FixedPrintDictionary.DEFAULT_0)
  public V!: number;

  protected override onCreate(): void {
    super.onCreate();
    this.Type = FixedPrintDictionary.TYPE;
  }
}

