import { PDFArray, PDFStream } from "../../objects";
import { PDFDictionary } from "../../objects/Dictionary";
import { PDFArrayField, PDFDictionaryField, PDFNumberField, PDFNameField } from "../../objects/DictionaryFieldDecorator";
import { Metrics, PDFRectangle } from "../common";
import { FontDictionary } from "./FontDictionary";

export class Type3FontDictionary extends FontDictionary {
  public static readonly SUBTYPE = "Type3";

  /**
   * (Required) The type of font; shall be Type1 for a Type 1 font.
   */
  @PDFNameField("Subtype")
  public override subtype!: typeof Type3FontDictionary.SUBTYPE;

  /**
   * (Required) A rectangle expressed in the glyph coordinate
   * system, specifying the font bounding box.This is the smallest rectangle enclosing all
   * marks that would result if all of the glyphs of the font were placed with their origins
   * coincident and their descriptions executed.
   * If all four elements of the rectangle are zero, a PDF processor shall make no
   * assumptions about glyph sizes based on the font bounding box.If any element is nonzero, the font bounding box shall be accurate.If any glyph’s marks fall outside this
   * bounding box, behaviour is implementation dependent and may not match the
   * creator’s expectations.
   */
  @PDFDictionaryField({
    name: "FontBBox",
    type: PDFRectangle
  })
  public FontBBox!: PDFRectangle;

  /**
   * (Required) An array of six numbers specifying the font matrix, mapping glyph space to
   * text space.
   * NOTE A common practice is to define glyphs in terms of a 1000 - unit glyph
   * coordinate system, in which case the font matrix is[0.001 0 0 0.001 0 0].
   */
  @PDFDictionaryField({
    name: "FontMatrix",
    type: Metrics,
  })
  public FontMatrix!: Metrics;

  /**
   * (Required) A dictionary in which each key shall be a glyph name and the value
   * associated with that key shall be a content stream that constructs and paints the glyph
   * for that character.The stream shall include as its first operator either d0 or d1,
   * followed by operators describing one or more graphics objects.See below for more
   * details about Type 3 glyph descriptions.
   */
  @PDFDictionaryField({
    name: "CharProcs",
    type: PDFDictionary,
  })
  public CharProcs!: PDFDictionary;

  /**
   * (Required) An encoding dictionary whose Differences array shall specify the complete
   * character encoding for this font(see 9.6.5, "Character encoding").
   */
  @PDFDictionaryField({
    name: "Encoding",
    type: PDFDictionary,
  })
  public Encoding!: PDFDictionary;

  /**
   * (Required) The first character code defined in the font’s Widths array.
   */
  @PDFNumberField("FirstChar")
  public FirstChar!: number;

  /**
   * (Required) The last character code defined in the font’s Widths array.
   */
  @PDFNumberField("LastChar")
  public LastChar!: number;

  /**
   * (Required; should be an indirect reference) An array of(LastChar - FirstChar + 1)
   * numbers, each element being the glyph width for the character code that equals
   * FirstChar plus the array index.For character codes outside the range
   * FirstChar to LastChar, the width shall be 0. These widths shall be interpreted in glyph
   * space as specified by FontMatrix(unlike the widths of a Type 1 font, which are in
   * thousandths of a unit of text space).
   * If FontMatrix specifies a rotation, only the horizontal component of the transformed
   * width shall be used.That is, the resulting displacement shall be horizontal in text space,
   * as is the case for all simple fonts.
   */
  @PDFArrayField("Widths")
  public Widths!: PDFArray;

  /**
   * (Optional but should be used; PDF 1.2) A list of the named resources, such as fonts and
   * images, required by the glyph descriptions in this font(see 7.8.3, "Resource
   * dictionaries"). If any glyph descriptions refer to named resources but this dictionary is
   * absent, the names shall be looked up in the resource dictionary of the page on which
   * the font is used.
   */
  @PDFDictionaryField({
    name: "Resources",
    type: PDFDictionary,
  })
  public Resources!: PDFDictionary;

  /**
   * (Optional; PDF 1.2) A stream containing a CMap file that maps character codes to
   * Unicode values(see 9.10.3, "ToUnicode CMaps"). 
   */
  @PDFDictionaryField({
    name: "ToUnicode",
    type: PDFStream,
    optional: true,
  })
  public ToUnicode!: PDFStream;


  protected override onCreate(): void {
    super.onCreate();

    this.subtype = Type3FontDictionary.SUBTYPE;
  }
}
