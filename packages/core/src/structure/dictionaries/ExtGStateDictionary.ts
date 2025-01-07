import { LineCapStyle, LineJoinStyle } from "../../content";
import * as objects from "../../objects";

export class ExtGStateDictionary extends objects.PDFDictionary {
  public static TYPE = "ExtGState";

  /**
   * The type of PDF object that this dictionary describes;
   * shall be ExtGState for a graphics state parameter dictionary
   */
  @objects.PDFNameField("Type", true, ExtGStateDictionary.TYPE)
  public Type!: typeof ExtGStateDictionary.TYPE;

  /**
   * The line width
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("LW", true)
  public LW!: number | null;

  /**
   * The line cap style
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("LC", true)
  public LC!: LineCapStyle | null;

  /**
   * The line cap style
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("LJ ", true)
  public LJ!: LineJoinStyle | null;

  /**
   * The miter limit
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("ML ", true)
  public ML!: number | null;

  /**
   * The line dash pattern, expressed as an array of the form
   * [dashArray dashPhase], where dashArray shall be itself an array and dashPhase
   * shall be a number
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFMaybeField("D", objects.PDFArray)
  public D!: objects.Maybe<objects.PDFArray>;

  /**
   * The name of the rendering intent (see 8.6.5.8, "Rendering intents").
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNameField("RI", true)
  public RI!: string | null;

  /**
   * A flag specifying whether to apply overprint (see 8.6.7, "Overprint
   * control"). In PDF 1.2 and earlier, there is a single overprint parameter that
   * applies to all painting operations. Beginning with PDF 1.3, two separate
   * overprint parameters were defined: one for stroking and one for all other
   * painting operations. Specifying an OP entry shall set both parameters unless
   * there is also an op entry in the same graphics state parameter dictionary, in
   * which case the OP entry shall set only the overprint parameter for stroking.
   * @remarks
   * - Optional
   */
  @objects.PDFBooleanField("OP", true, false)
  public OP!: boolean;

  /**
   * A flag specifying whether to apply overprint (see 8.6.7,
   * "Overprint control") for painting operations other than stroking. If this entry is
   * absent, the OP entry, if any, shall also set this parameter.
   * @remarks
   * - Optional
   * -  PDF 1.3
   */
  @objects.PDFBooleanField("op", true, false)
  public op!: boolean;

  /**
   * The overprint mode (see 8.6.7, "Overprint control").
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("OPM", true)
  public OPM!: number | null;

  /**
   * An array of the form [font size], where font shall be an
   * indirect reference to a font dictionary and size shall be a number expressed in
   * text space units. These two objects correspond to the operands of
   * the Tf operator (see 9.3, "Text state parameters and operators"); however, the
   * first operand shall be an indirect object reference instead of a resource name.
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFMaybeField("Font", objects.PDFArray)
  public Font!: objects.Maybe<objects.PDFArray>;

  /**
   * The black-generation function, which maps the interval [0.0 1.0] to
   * the interval [0.0 1.0] (see 10.4.2.3, "Conversion from DeviceRGB to
   * DeviceCMYK").
   * @remarks
   * - Optional
   */
  @objects.PDFDictionaryField({
    name: "BG",
    optional: true
  })
  public BG!: objects.PDFObjectTypes;

  /**
   * Same as BG except that the value may also be the name
   * Default, denoting the black-generation function that was in effect at the start of
   * the page. If both BG and BG2 are present in the same graphics state parameter
   * dictionary, BG2 shall take precedence.
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "BG2",
    optional: true
  })
  public BG2!: objects.PDFObjectTypes;

  /**
   * The undercolour-removal function, which maps the interval [0.0 1.0]
   * to the interval [−1.0 1.0] (see 10.4.2.3, "Conversion from DeviceRGB to
   * DeviceCMYK").
   * @remarks
   * - Optional
   */
  @objects.PDFDictionaryField({
    name: "UCR",
    optional: true
  })
  public UCR!: objects.PDFObjectTypes;

  /**
   * Same as UCR except that the value may also be the
   * name Default, denoting the undercolour-removal function that was in effect at
   * the start of the page. If both UCR and UCR2 are present in the same graphics
   * state parameter dictionary, UCR2 shall take precedence.
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "UCR2",
    optional: true
  })
  public UCR2!: objects.PDFObjectTypes;

  /**
   * The transfer function, which maps the interval
   * [0.0 1.0] to the interval [0.0 1.0] (see 10.5, "Transfer functions"). The value shall
   * be either a single function (which applies to all process colourants) or an array
   * of four functions (which apply to the process colourants individually). The name
   * Identity may be used to represent the Identity function.
   * @remarks
   * - Optional
   * - Deprecated in PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "TR",
    optional: true
  })
  public TR!: objects.PDFObjectTypes;

  /**
   * Same as TR except that the value may
   * also be the name Default, denoting the transfer function that was in effect at the
   * start of the page. If both TR and TR2 are present in the same graphics state
   * parameter dictionary, TR2 shall take precedence.
   * @remarks
   * - Optional
   * - PDF 1.3
   * - Deprecated in PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "TR2",
    optional: true
  })
  public TR2!: objects.PDFObjectTypes;

  /**
   * The halftone dictionary or stream (see 10.6, "Halftones") or the
   * name Default, denoting the halftone that was in effect at the start of the page.
   * @remarks
   * - Optional
   */
  @objects.PDFDictionaryField({
    name: "HT",
    optional: true
  })
  public HT!: objects.PDFDictionary | objects.PDFStream | objects.PDFName;

  /**
   * The flatness tolerance (see 10.7.2, "Flatness tolerance").
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("FL", true)
  public FL!: number | null;

  /**
   * The smoothness tolerance (see 10.7.3, "Smoothness tolerance").
   * @remarks
   * - Optional
   * - PDF 1.3
   */
  @objects.PDFNumberField("SM", true)
  public SM!: number | null;

  /**
   * A flag specifying whether to apply automatic stroke adjustment (see
   * 10.7.5, "Automatic stroke adjustment").
   */
  @objects.PDFBooleanField("SA", true)
  public SA!: boolean | null;

  /**
   * The current blend mode that shall be used in the transparent imaging model (see 11.3.5, "Blend mode").
   * @remarks
   * - Optional
   * - PDF 1.4
   * - Array is deprecated in PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "BM",
    optional: true
  })
  public BM!: objects.PDFArray | objects.PDFName;

  /**
   * The current soft mask, specifying the mask shape or mask
   * opacity values that shall be used in the transparent imaging model (see 11.3.7.2,
   * "Source shape and opacity" and 11.6.4.3, "Mask shape and opacity").
   * Although the current soft mask is sometimes referred to as a "soft clip," altering
   * it with the gs operator completely replaces the old value with the new one,
   * rather than intersecting the two as is done with the current clipping path
   * parameter (see 8.5.4, "Clipping path operators").
   * @remarks
   * - Optional
   * - PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "SMask",
    optional: true
  })
  public SMask!: objects.PDFDictionary | objects.PDFName;

  /**
   * The current stroking alpha constant, specifying the constant
   * shape or constant opacity value that shall be used for stroking operations in the
   * transparent imaging model (see 11.3.7.2, "Source shape and opacity" and
   * 11.6.4.4, "Constant shape and opacity").
   * @remarks
   * - Optional
   * - PDF 1.4
   */
  @objects.PDFNumberField("CA", true)
  public CA!: number | null;

  /**
   * Same as CA, but for nonstroking operations.
   * @remarks
   * - Optional
   * - PDF 1.4
   */
  @objects.PDFNumberField("ca", true)
  public ca!: number | null;

  /**
   * The alpha source flag ("alpha is shape"), specifying whether
   * the current soft mask and alpha constant shall be interpreted as shape values
   * (true) or opacity values (false).
   * @remarks
   * - Optional
   * - PDF 1.4
   */
  @objects.PDFBooleanField("AIS", true)
  public AIS!: boolean | null;

  /**
   * The text knockout flag, shall determine the behaviour of
   * overlapping glyphs within a text object in the transparent imaging model (see
   * 9.3.8, "Text knockout"). This flag controls the behavior of glyphs obtained from
   * any font type, including Type 3.
   * @remarks
   * - Optional
   * - PDF 1.4
   */
  @objects.PDFBooleanField("TK", true)
  public TK!: boolean | null;

  /**
   * This graphics state parameter controls whether black point
   * compensation is performed while doing CIE-based colour conversions. It shall be
   * set to either OFF, ON or Default. The semantics of Default are up to the PDF
   * processor. See 8.6.5.9, "Use of black point compensation".
   *
   * The default value is: Default.
   * @remarks
   * - Optional
   * - PDF 2.0
   */
  @objects.PDFNameField("UseBlackPTComp", true, "Default")
  public UseBlackPTComp!: string | null;

  /**
   * Halftone origin, specified as an array of two numbers
   * specifying the X and Y location of the halftone origin in the current coordinate
   * system.
   * @note
   * The HTO key is very similar to the HTP key defined in PDF
   * versions up to 1.3 (1st Edition), but differs in the coordinate
   * system used.
   * @remarks
   * - Optional
   * - PDF 2.0
   */
  @objects.PDFMaybeField("HTO", objects.PDFArray)
  public HTO!: objects.Maybe<objects.PDFArray>;

  public override onCreate(): void {
    this.Type = ExtGStateDictionary.TYPE;
  }
}
