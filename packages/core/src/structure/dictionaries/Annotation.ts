import {
  Maybe,
  PDFArray,
  PDFArrayField,
  PDFDateField,
  PDFDictionary,
  PDFDictionaryField,
  PDFNumberField,
  PDFMaybeField,
  PDFNameField,
  PDFTextString
} from "../../objects";
import { PDFRectangle } from "../common/Rectangle";
import { AppearanceDictionary } from "./AppearanceDictionary";
import { PageObjectDictionary } from "./PageObject";

export enum AnnotationFlags {
  /**
   * Applies only to annotations which do not belong to one of the standard annotation types
   * and for which no annotation handler is available. If set, do not render the unknown
   * annotation using an appearance stream specified by its appearance dictionary, if any (see
   * annotation and do not print it even if the Print flag is set. If clear, render such an unknown
   * 12.5.5, "Appearance streams").
   */
  invisible = 1 << 0,
  /**
   * If set, do not render the annotation or allow it to interact with the user,
   * regardless of its annotation type or whether an annotation handler is available.
   * @remarks In cases where screen space is limited, the ability to hide and show
   * annotations selectively can be used in combination with appearance
   * streams (see 12.5.5, "Appearance streams") to render auxiliary popup
   * information similar in function to online help systems.
   * @remarks PDF 1.2
   */
  hidden = 1 << 1,
  /**
   * If set, print the annotation when the page is printed unless the Hidden flag is
   * also set. If clear, never print the annotation, regardless of whether it is rendered on the
   * screen. If the annotation does not contain any appearance streams this flag shall be
   * ignored.
   * @remarks This can be useful for annotations representing interactive push-buttons,
   * which would serve no meaningful purpose on the printed page.
   * @remarks PDF 1.2
   */
  print = 1 << 2,
  /**
   * If set, do not scale the annotation’s appearance to match the magnification of the
   * page. The location of the annotation on the page (defined by the upper-left corner of its
   * annotation rectangle) shall remain fixed, regardless of the page magnification. See further
   * discussion following this table.
   * @remarks PDF 1.3
   */
  noZoom = 1 << 3,
  /**
   * If set, do not rotate the annotation’s appearance to match the rotation of the
   * page. The upper-left corner of the annotation rectangle shall remain in a fixed location on
   * the page, regardless of the page rotation. See further discussion following this table
   * @remarks PDF 1.3
   */
  noRotate = 1 << 4,
  /**
   * If set, do not render the annotation on the screen or allow it to interact with the
   * user. The annotation may be printed (depending on the setting of the Print flag) but
   * should be considered hidden for purposes of on-screen display and user interaction.
   * @remarks PDF 1.3
   */
  noView = 1 << 5,
  /**
   * If set, do not allow the annotation to interact with the user. The annotation may
   * be rendered or printed (depending on the settings of the NoView and Print flags) but
   * should not respond to mouse clicks or change its appearance in response to mouse
   * motions.
   *
   * This flag shall be ignored for widget annotations; its function is subsumed by the
   * ReadOnly flag of the associated form field (see "Table 226: Field flags common to all field
   * types").
   * @remarks PDF 1.3
   */
  readOnly = 1 << 6,
  /**
   * If set, do not allow the annotation to be deleted or its properties (including
   * position and size) to be modified by the user. However, this flag does not restrict changes
   * to the annotation’s contents, such as the value of a form field.
   * @remarks PDF 1.4
   */
  locked = 1 << 7,
  /**
   * If set, invert the interpretation of the NoView flag for annotation selection and
   * mouse hovering, causing the annotation to be visible when the mouse pointer hovers over
   * the annotation or when the annotation is selected.
   * @remarks PDF 1.5
   */
  toggleNoView = 1 << 8,
  /**
   * If set, do not allow the contents of the annotation to be modified by the user.
   * This flag does not restrict deletion of the annotation or changes to other annotation
   * properties, such as position and size.
   * @remarks PDF 1.7
   */
  lockedContents = 1 << 9
}

export enum SubTypeAnnotation {
  /**
   * Text annotations
   */
  text = "Text",
  /**
   * Link annotations
   */
  link = "Link",
  /**
   * Free text annotations
   */
  freeText = "FreeText",
  /**
   * Line annotations
   */
  line = "Line",
  /**
   * Square and circle annotations
   */
  square = "Square",
  /**
   * Square and circle annotations
   */
  circle = "Circle",
  /**
   * Polygon and polyline annotations
   */
  polygon = "Polygon",
  /**
   * Polygon and polyline annotations
   */
  polyLine = "PolyLine",
  /**
   * Text markup annotations
   */
  highlight = "Highlight",
  /**
   * Text markup annotations
   */
  underline = "Underline",
  /**
   * Text markup annotations
   */
  squiggly = "Squiggly",
  /**
   * Text markup annotations
   */
  strikeOut = "StrikeOut",
  /**
   * Caret annotations
   */
  caret = "Caret",
  /**
   * Rubber stamp annotations
   */
  stamp = "Stamp",
  /**
   * Ink annotations
   */
  ink = "Ink",
  /**
   * Pop-up annotations
   */
  popup = "Popup",
  /**
   * File attachment annotations
   */
  fileAttachment = "FileAttachment",
  /**
   * Sound annotations
   */
  sound = "Sound",
  /**
   * Movie annotations
   */
  movie = "Movie",
  /**
   * Screen annotations
   */
  screen = "Screen",
  /**
   * Widget annotations
   */
  widget = "Widget",
  /**
   * Printer’s mark annotations
   */
  printerMark = "PrinterMark",
  /**
   * Trap network annotations
   */
  trapNet = "TrapNet",
  /**
   * Watermark annotations
   */
  watermark = "Watermark",
  /**
   * Redaction annotations
   */
  redact = "Redact",
  /**
   * Projection annotations
   */
  projection = "Projection",
  /**
   * RichMedia annotations"
   */
  richMedia = "RichMedia",
  /**
   * 3D Annotations
   */
  threeD = "3D"
}

export class AnnotationDictionary extends PDFDictionary {
  public static readonly TYPE = "Annot";

  /**
   * The type of PDF object that this dictionary describes; if present, shall be Annot
   * for an annotation dictionary
   */
  @PDFNameField("Type", true, AnnotationDictionary.TYPE)
  public type!: typeof AnnotationDictionary.TYPE;

  /**
   *  The type of annotation that this dictionary describes
   */
  @PDFNameField("Subtype")
  public subtype!: string;

  /**
   * The annotation rectangle, defining the location of the annotation on the page
   * in default user space units.
   */
  @PDFDictionaryField({
    name: "Rect",
    type: PDFRectangle
  })
  public rect!: PDFRectangle;

  /**
   * Text that shall be displayed for the annotation or, if this type of annotation
   * does not display text, an alternative description of the annotation’s contents
   * in humanreadable form. In either case, this text is useful when extracting the document’s content
   * in support of accessibility to users with disabilities or for other purposes
   */
  @PDFDictionaryField({
    name: "Contents",
    type: PDFTextString,
    optional: true
  })
  public contents!: string | null;

  /**
   * An indirect reference to the
   * page object with which this annotation is associated
   */
  @PDFDictionaryField({
    name: "P",
    type: PageObjectDictionary,
    optional: true,
    indirect: true
  })
  public p!: PageObjectDictionary | null;

  /**
   * The annotation name, a text string uniquely identifying it among all
   * the annotations on its page.
   */
  @PDFDictionaryField({
    name: "NM",
    type: PDFTextString,
    optional: true
  })
  public nm!: string | null;

  /**
   * The date and time when the annotation was most recently modified.
   */
  @PDFDateField("M", true)
  public m!: Date | null;

  /**
   * A set of flags specifying various characteristics of the annotation. Default value: 0
   */
  @PDFNumberField("F", true, 0)
  public f!: AnnotationFlags;

  /**
   * An appearance dictionary specifying how the annotation shall be
   * presented visually on the page (see 12.5.5, "Appearance streams"). A PDF writer shall
   * include an appearance dictionary when writing or updating an annotation dictionary
   * except for the two cases listed below
   */
  @PDFMaybeField("AP", AppearanceDictionary)
  public AP!: Maybe<AppearanceDictionary>;

  /**
   * The annotation’s appearance state, which selects the applicable appearance stream from
   * an appearance subdictionary
   */
  @PDFNameField("AS", true)
  public as!: string | null;

  /**
   * An array specifying the characteristics of the annotation’s border, which shall
   * be drawn as a rounded rectangle.
   */
  @PDFArrayField("Border", true)
  public border!: PDFArray | null;

  /**
   * An array of numbers in the range 0.0 to 1.0, representing a colour
   * used for the following purposes:
   * The background of the annotation’s icon when closed,
   * The title bar of the annotation’s popup window,
   * The border of a link annotation
   */
  @PDFArrayField("C", true)
  public c!: PDFArray | null;

  /**
   * The integer key of the annotation’s entry in the structural parent tree
   */
  @PDFNumberField("StructParent", true)
  public structParent!: number | null;

  /**
   * An optional content group or optional content membership dictionary
   * specifying the optional content properties for the annotation.
   */
  @PDFDictionaryField({
    name: "OC",
    type: PDFDictionary,
    optional: true
  })
  public oc!: PDFDictionary | null;

  /**
   * An array of one or more file specification dictionaries which denote the associated files for this annotation
   */
  @PDFDictionaryField({
    name: "AF",
    type: PDFDictionary,
    optional: true
  })
  public af!: PDFDictionary | null;

  @PDFNumberField("ca", true, 1.0)
  public ca!: number | null;

  @PDFNumberField("CA", true, 1.0)
  public CA!: number | null;

  /**
   * The blend mode that shall be used when painting the annotation onto the page
   */
  @PDFNameField("BM", true)
  public bm!: string | null;

  /**
   * A language identifier overriding the document’s language identifier to
   * specify the natural language for all text in the annotation except where overridden by
   * other explicit language specifications
   */
  @PDFDictionaryField({
    name: "Lang",
    type: PDFTextString,
    optional: true
  })
  public lang!: string | null;

  protected override onCreate(): void {
    const document = this.getDocument();

    this.type = AnnotationDictionary.TYPE;
    this.rect = PDFRectangle.create(document.update);
  }
}
