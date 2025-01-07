import { FieldFlags, IFieldDictionary, PDFField } from "../../forms";
import * as objects from "../../objects";
import { ActionDictionary } from "./ActionDictionary";
import { AdditionalActionsDictionary } from "./AdditionalActionsDictionary";
import { AnnotationDictionary } from "./Annotation";
import { AppearanceCharacteristicsDictionary } from "./AppearanceCharacteristicsDictionary";
import { BorderStyleDictionary } from "./BorderStyleDictionary";

export interface WidgetOptions {
  coordinate: {
    x: number;
    y: number;
  };
}

export enum WidgetHighlightingMode {
  /**
   * No highlighting.
   */
  none = "N",
  /**
   * Invert the colours used to display the contents of the annotation rectangle.
   */
  invert = "I",
  /**
   * Stroke the colours used to display the annotation border. That
   * is, for each colour channel in the colour space used for display of the
   * annotation value, colour values shall be transformed by the function
   * `𝑓(𝑥) = 1 – 𝑥` for display.
   */
  outline = "O",
  /**
   * Display the annotation’s down appearance, if any (see 12.5.5,
   * "Appearance streams"). If no down appearance is defined, the contents
   * of the annotation rectangle shall be offset to appear as if it were being
   * pushed below the surface of the page.
   */
  push = "P",
  /**
   * Same as P (which is preferred).
   */
  toggle = "T"
}

export class WidgetDictionary extends AnnotationDictionary {
  public static readonly SUBTYPE = "Widget";

  /**
   * The type of annotation that this dictionary describes. Shall be
   * `Widget` for a widget annotation.
   */
  @objects.PDFNameField("Subtype", false, WidgetDictionary.SUBTYPE)
  public override subtype!: typeof WidgetDictionary.SUBTYPE;

  /**
   * The annotation’s highlighting mode, the visual effect that shall be
   * used when the mouse button is pressed or held down inside its active area.
   *
   * A highlighting mode other than P shall override any down appearance
   * defined for the annotation. Default value: I
   */
  @objects.PDFNameField("H", true, WidgetHighlightingMode.invert)
  public h!: WidgetHighlightingMode;

  /**
   * An appearance characteristics dictionary (see {@link AppearanceCharacteristicsDictionary}) that shall be used in
   * constructing a dynamic appearance stream specifying the annotation’s visual
   * presentation on the page.
   *
   * The name MK for this entry is of historical significance only and has no direct
   * meaning
   */
  @objects.PDFMaybeField("MK", AppearanceCharacteristicsDictionary)
  public MK!: objects.Maybe<AppearanceCharacteristicsDictionary>;

  /**
   * An action that shall be performed when the annotation is activated
   * @remarks PDF 1.1
   */
  @objects.PDFMaybeField("A", ActionDictionary)
  public A!: objects.Maybe<ActionDictionary>;

  /**
   * An additional-actions dictionary defining the annotation’s behavior in response
   * to various trigger events (see {@link AdditionalActionsDictionary}).
   * @remarks PDF 1.2
   */
  @objects.PDFDictionaryField({
    name: "AA",
    optional: true,
    type: AdditionalActionsDictionary
  })
  public aa!: AdditionalActionsDictionary | null;

  /**
   * A border style dictionary (see {@link BorderStyleDictionary}")
   * specifying the width and dash pattern that shall be used in drawing the annotation’s border.
   * The annotation dictionary’s AP entry, if present, shall take precedence over the BS entry.
   * @remarks PDF 1.2
   */
  @objects.PDFMaybeField("BS", BorderStyleDictionary)
  public BS!: objects.Maybe<BorderStyleDictionary>;

  /**
   * An indirect reference to the widget annotation’s parent field.
   * A widget annotation may have at most one parent; that is, it can be included
   * in the Kids array of at most one field
   * @remarks Required if this widget annotation is one of multiple children in a field; optional otherwise
   */
  @objects.PDFDictionaryField({
    name: "Parent",
    optional: true,
    type: PDFField,
    indirect: true
  })
  public Parent!: PDFField | null;

  protected override onCreate(): void {
    super.onCreate();

    this.subtype = WidgetDictionary.SUBTYPE;
  }
}

export class SingleWidgetDictionary
  extends WidgetDictionary
  implements IFieldDictionary
{
  @objects.PDFNameField("FT")
  public ft!: string;

  @objects.PDFMaybeField("Kids", objects.PDFArray)
  public Kids!: objects.Maybe<objects.PDFArray>;

  @objects.PDFTextStringField("T")
  public t!: objects.PDFTextString;

  @objects.PDFDictionaryField({
    name: "TU",
    type: objects.PDFLiteralString,
    optional: true
  })
  public TU!: objects.PDFLiteralString | null;

  @objects.PDFDictionaryField({
    name: "TM",
    type: objects.PDFLiteralString,
    optional: true
  })
  public tm!: objects.PDFLiteralString | null;

  @objects.PDFNumberField("Ff", true, 0)
  public ff!: FieldFlags | number;

  @objects.PDFDictionaryField({
    name: "V",
    optional: true
  })
  public V!: objects.PDFObjectTypes | null;

  @objects.PDFDictionaryField({
    name: "DV",
    optional: true
  })
  public dv!: objects.PDFObjectTypes | null;
}
