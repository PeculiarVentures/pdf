import {
  PDFArray,
  PDFArrayField,
  PDFDictionary,
  PDFDictionaryField,
  PDFNumberField,
  PDFStream,
  PDFTextString,
  PDFTextStringField
} from "../../objects";
import { IconFitDictionary } from "./IconFitDictionary";

export enum CaptionPosition {
  /**
   * No icon; caption only
   */
  noIcon = 0,
  /**
   * No caption; icon only
   */
  noCaption = 1,
  /**
   * Caption below the icon
   */
  captionBelow = 2,
  /**
   * Caption above the icon
   */
  captionAbove = 3,
  /**
   * Caption to the right of the icon
   */
  captionRight = 4,
  /**
   * Caption to the left of the icon
   */
  captionLeft = 5,
  /**
   * Caption overlaid directly on the icon
   */
  captionOverlaid = 6
}

export class AppearanceCharacteristicsDictionary extends PDFDictionary {
  /**
   * The number of degrees by which the widget annotation shall be
   * rotated counterclockwise relative to the page. The value shall be a multiple of
   * 90. Default value: 0
   */
  @PDFNumberField("R", true, 0)
  public r!: number | null;

  /**
   * An array of numbers that shall be in the range 0.0 to 1.0 specifying
   * the colour of the widget annotation’s border. The number of array elements
   * determines the colour space in which the colour shall be defined:
   * - 0 No colour; transparent
   * - 1 DeviceGray
   * - 3 DeviceRGB
   * - 4 DeviceCMYK
   */
  @PDFArrayField("BC", true)
  public BC!: PDFArray | null;

  /**
   * An array of numbers that shall be in the range 0.0 to 1.0 specifying
   * the colour of the widget annotation’s background. The number of array
   * elements shall determine the colour space, as described for BC.
   */
  @PDFArrayField("BG", true)
  public BG!: PDFArray | null;

  /**
   * The widget annotation’s normal caption, which
   * shall be displayed when it is not interacting with the user.
   *
   * Unlike the remaining entries listed in this Table, which apply only to widget
   * annotations associated with push-button fields (see 12.7.5.2.2, "Pushbuttons"),
   * he CA entry may be used with any type of button field, including
   * check boxes (see 12.7.5.2.3, "Check boxes") and radio buttons (12.7.5.2.4,
   * "Radio buttons").
   * @remarks Button fields only
   */
  @PDFTextStringField("CA", true)
  public ca!: PDFTextString | null;

  /**
   * The widget annotation’s rollover caption, which shall be displayed
   * when the user rolls the cursor into its active area
   * without pressing the mouse button.
   * @remarks Push-button fields only
   */
  @PDFTextStringField("RC", true)
  public rc!: PDFTextString | null;

  /**
   * The widget annotation’s alternate (down) caption, which shall be displayed
   * when the mouse button is pressed within its active area.
   * @remarks Push-button fields only
   */
  @PDFTextStringField("AC", true)
  public ac!: PDFTextString | null;

  /**
   * A form XObject defining the widget annotation’s normal icon, which shall be
   * displayed when it is not interacting with the user.
   * @remarks
   * - push-button fields only
   * - shall be an indirect reference
   */
  @PDFDictionaryField({
    name: "I",
    type: PDFStream,
    optional: true,
    indirect: true
  })
  public I!: PDFStream | null;

  /**
   * A form XObject defining the widget annotation’s rollover icon, which shall be
   * displayed when the user rolls the cursor into its active area without pressing
   * the mouse button.
   * @remarks Push-button fields only
   */
  @PDFDictionaryField({
    name: "RI",
    type: PDFStream,
    optional: true,
    indirect: true
  })
  public ri!: PDFStream | null;

  /**
   * A form XObject defining the widget annotation’s alternate (down) icon, which shall
   * be displayed when the mouse button is pressed within its active area.
   * @remarks Push-button fields only
   */
  @PDFDictionaryField({
    name: "IX",
    type: PDFStream,
    optional: true,
    indirect: true
  })
  public ix!: PDFStream | null;

  /**
   * An icon fit dictionary specifying how the widget annotation’s icon
   * shall be displayed within its annotation rectangle. If present, the icon fit
   * dictionary shall apply to all of the annotation’s icons (normal, rollover, and
   * alternate).
   * @remarks Push-button fields only
   */
  @PDFDictionaryField({
    name: "IF",
    type: IconFitDictionary,
    optional: true
  })
  public if!: IconFitDictionary | null;

  /**
   * A code indicating where to position the
   * text of the widget annotation’s caption relative to its icon:
   * - 0 No icon; caption only
   * - 1 No caption; icon only
   * - 2 Caption below the icon
   * - 3 Caption above the icon
   * - 4 Caption to the right of the icon
   * - 5 Caption to the left of the icon
   * - 6 Caption overlaid directly on the icon
   *
   * Default value: 0.
   * @remarks Push-button fields only
   */
  @PDFNumberField("TP", true, 0)
  public tp!: CaptionPosition;
}
