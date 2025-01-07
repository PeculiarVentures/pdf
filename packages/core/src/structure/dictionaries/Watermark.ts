import * as objects from "../../objects";
import { AnnotationDictionary } from "./Annotation";
import { FixedPrintDictionary } from "./FixedPrint";

export class WatermarkDictionary extends AnnotationDictionary {
  public static readonly SUBTYPE = "Watermark";

  /**
   * The type of annotation that this dictionary describes; shall be
   * `Watermark` for a watermark annotation.
   */
  @objects.PDFNameField("Subtype", false, WatermarkDictionary.SUBTYPE)
  public override subtype!: typeof WatermarkDictionary.SUBTYPE;

  /**
   * A fixed print dictionary that specifies how this annotation shall be drawn relative to the
   * dimensions of the target media. If this entry is not present, the annotation
   * shall be drawn without any special consideration for the dimensions of the
   * target media.
   */
  @objects.PDFDictionaryField({
    name: "FixedPrint",
    optional: true,
    type: FixedPrintDictionary
  })
  public FixedPrint!: FixedPrintDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    this.subtype = WatermarkDictionary.SUBTYPE;
  }
}
