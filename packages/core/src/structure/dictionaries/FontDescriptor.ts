import { PDFDictionaryField, PDFNumberField, PDFNameField, PDFStream, PDFTextString, PDFLiteralStringField } from "../../objects";
import { PDFDictionary } from "../../objects/Dictionary";
import { PDFRectangle } from "../common";

export enum FontDescriptorFlags {
  /**
   * All glyphs have the same width (as opposed to proportional or variable pitch fonts, which have different widths).
   */
  fixedPitch = 1 << 0,
  /**
   * Glyphs have serifs, which are short strokes drawn at an angle on the top
   * and bottom of glyph stems. (Sans serif fonts do not have serifs.)
   */
  serif = 1 << 1,
  /**
   * Font contains glyphs outside the Standard Latin character set. This flag
   * and the Nonsymbolic flag shall not both be set or both be clear.
   */
  symbolic = 1 << 2,
  /**
   * Glyphs resemble cursive handwriting.
   */
  script = 1 << 3,
  /**
   * Font uses the Standard Latin character set or a subset of it. This flag and
   * the Symbolic flag shall not both be set or both be clear.
   */
  nonsymbolic = 1 << 5,
  /**
   * Glyphs have dominant vertical strokes that are slanted.
   */
  italic = 1 << 6,
  /**
   * AllCap Font contains no lowercase letters; typically used for display purposes,
   * such as for titles or headlines.
   */
  allCap = 1 << 16,
  /**
   * Font contains both uppercase and lowercase letters.The uppercase
   * letters are similar to those in the regular version of the same typeface
   * family.The glyphs for the lowercase letters have the same shapes as the
   * corresponding uppercase letters, but they are sized and their proportions
   * adjusted so that they have the same size and stroke weight as lowercase
   * glyphs in the same typeface family.
   */
  smallCap = 1 << 17,
  /**
   * See description after Note 1 in this subclause
   */
  forceBold = 1 << 18,
}

export class FontDescriptorDictionary extends PDFDictionary {

  public static readonly TYPE = "Font";

  /**
   * (Required) The type of PDF object that this dictionary describes; shall be
   * FontDescriptor for a font descriptor. 
   */
  @PDFNameField("Type")
  public type!: typeof FontDescriptorDictionary.TYPE;

  /**
   * (Required) The PostScript name of the font. This name shall be the same as the
   * value of BaseFont in the font or CIDFont dictionary that refers to this font
   * descriptor.
   */
  @PDFNameField("FontName")
  public fontName!: string;

  /**
   * A byte string specifying the preferred font family name.
   * @remarks PDF 1.5
   */
  @PDFLiteralStringField("FontFamily", true)
  public fontFamily!: string | null;

  /**
   * (Optional; PDF 1.5) The font stretch value. It shall be one of these names
   * (ordered from narrowest to widest): UltraCondensed, ExtraCondensed,
   * Condensed, SemiCondensed, Normal, SemiExpanded, Expanded, ExtraExpanded
   * or UltraExpanded.
   * The specific interpretation of these values varies from font to font.
   * @remarks PDF 1.5
   */
  @PDFNameField("FontStretch", true)
  public fontStretch!: string | null;

  /**
   * The weight (thickness) component of the fully-qualified
   * font name or font specifier. The possible values shall be 100, 200, 300, 400,
   * 500, 600, 700, 800, or 900, where each number indicates a weight that is at
   * least as dark as its predecessor. A value of 400 shall indicate a normal weight;
   * 700 shall indicate bold.
   * The specific interpretation of these values varies from font to font.
   * @remarks PDF 1.5
   */
  @PDFNumberField("FontWeight", true)
  public fontWeight!: number | null;

  /**
   * A collection of flags defining various characteristics of the font
   */
  @PDFNumberField("Flags")
  public flags!: FontDescriptorFlags;

  /**
   * (Required except for Type 3 fonts) A rectangle,
   * expressed in the glyph coordinate system, that shall specify the font bounding
   * box. This should be the smallest rectangle enclosing the shape that would
   * result if all of the glyphs of the font were placed with their origins coincident
   * and then filled. 
   */
  @PDFDictionaryField({
    name: "FontBBox",
    type: PDFRectangle,
    optional: true
  })
  public fontBBox!: PDFRectangle | null;

  /**
   * (Required) The angle, expressed in degrees counterclockwise from the
   * vertical, of the dominant vertical strokes of the font
   */
  @PDFNumberField("ItalicAngle")
  public italicAngle!: number;

  /**
   * The maximum height above the baseline
   * reached by glyphs in this font. The height of glyphs for accented characters
   * shall be excluded.
   */
  @PDFNumberField("Ascent", true)
  public ascent!: number | null;

  /**
   * The maximum depth below the baseline
   * reached by glyphs in this font. The value shall be a negative number.
   */
  @PDFNumberField("Descent", true)
  public descent!: number | null;

  /**
   * The spacing between baselines of consecutive lines of text.
   * Default value: 0. 
   */
  @PDFNumberField("Leading", true, 0)
  public leading!: number;

  /**
   * The vertical coordinate of the top of flat capital letters, measured from the baseline. 
   */
  @PDFNumberField("CapHeight", true)
  public capHeight!: number | null;

  /**
   * The font’s x height: the vertical coordinate of the top of flat
   * nonascending lowercase letters (like the letter x), measured from the
   * baseline, in fonts that have Latin characters. Default value: 0. 
   */
  @PDFNumberField("XHeight", true, 0)
  public xHeight!: number;

  /**
   * The thickness measured horizontally, of the
   * dominant vertical stems of glyphs in the font.
   */
  @PDFNumberField("StemV", true)
  public stemV!: number | null;

  /**
   * The thickness measured vertically of the dominant horizontal
   * stems of glyphs in the font. Default value: 0. 
   */
  @PDFNumberField("StemH", true, 0)
  public stemH!: number;

  /**
   * The average width of glyphs in the font. Default value: 0.
   */
  @PDFNumberField("AvgWidth", true, 0)
  public avgWidth!: number;

  /**
   * The maximum width of glyphs in the font. Default value: 0.
   */
  @PDFNumberField("MaxWidth", true, 0)
  public maxWidth!: number;

  /**
   * The width to use for character codes whose widths are not
   * specified in a font dictionary’s Widths array. This shall have a predictable
   * effect only if all such codes map to glyphs whose actual widths are the same as
   * the value of the MissingWidth entry. Default value: 0. 
   */
  @PDFNumberField("MissingWidth", true, 0)
  public missingWidth!: number;

  /**
   * A stream containing a Type 1 font program
   */
  @PDFDictionaryField({
    name: "FontFile",
    type: PDFStream,
    optional: true
  })
  public fontFile!: PDFStream | null;

  /**
   * A stream containing a TrueType font program
   * @remarks PDF 1.1
   */
  @PDFDictionaryField({
    name: "FontFile2",
    type: PDFStream,
    optional: true
  })
  public fontFile2!: PDFStream | null;

  /**
   * A stream containing a font program whose format is
   * specified by the Subtype entry in the stream dictionary 
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "FontFile3",
    type: PDFStream,
    optional: true
  })
  public fontFile3!: PDFStream | null;

  /**
   * A string listing the character names defined in a font subset. The names in this
   * string shall be in PDF syntax — that is, each name preceded by a slash (/). The
   * names may appear in any order. The name . notdef shall be omitted; it shall
   * exist in the font subset. If this entry is absent, the only indication of a font
   * subset shall be the subset tag in the FontName entry
   * @remarks PDF 1.1
   * @deprecated PDF 2.0
   */
  @PDFDictionaryField({
    name: "CharSet",
    type: PDFTextString,
    optional: true
  })
  public charSet!: string | null;

  protected override onCreate(): void {
    super.onCreate();

    this.type = FontDescriptorDictionary.TYPE;
    this.italicAngle = 0;
    this.flags = 0;
    // this.fontWeight = 400;
    this.fontName = "";
  }
}
