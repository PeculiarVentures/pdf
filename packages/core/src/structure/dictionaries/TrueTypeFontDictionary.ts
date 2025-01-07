import {
  PDFArray,
  PDFArrayField,
  PDFDictionaryField,
  PDFNameField,
  PDFNumberField,
  PDFStream
} from "../../objects";
import { FontDictionary } from "./FontDictionary";

export class TrueTypeFontDictionary extends FontDictionary {
  public static readonly SUBTYPE = "TrueType";

  /**
   * (Required) The type of font; shall be Type1 for a Type 1 font.
   */
  @PDFNameField("Subtype")
  public override subtype!: typeof TrueTypeFontDictionary.SUBTYPE;

  /**
   * (Required) The PostScript language name of the font.For Type 1 fonts,
   * this is always the value of the FontName entry in the font program; for
   * more information, see Section 5.2 of the PostScript Language Reference,
   * Third Edition.The PostScript language name of the font may be used to
   * find the font program in the PDF processor or its environment.It is also
   * the name that is used when printing to a PostScript language compatible
   * output device.
   */
  @PDFNameField("BaseFont")
  public BaseFont!: string;

  /**
   * (Required; optional in PDF 1.0 - 1.7 for the standard 14 fonts) The first
   * character code defined in the font’s Widths array.
   */
  @PDFNumberField("FirstChar")
  public FirstChar!: number;

  /**
   * (Required; optional in PDF 1.0 - 1.7 for the standard 14 fonts) The last
   * character code defined in the font’s Widths array.
   */
  @PDFNumberField("LastChar")
  public LastChar!: number;

  /**
   * (Required; optional in PDF 1.0 - 1.7 for the standard 14 fonts; indirect
   * reference preferred) An array of(LastChar - FirstChar + 1) numbers,
   * each element being the glyph width for the character code that equals
   * FirstChar plus the array index. For character codes outside the range
   * FirstChar to LastChar, the value of MissingWidth from
   * the FontDescriptor entry for this font shall be used. The glyph widths
   * shall be measured in units in which 1000 units correspond to 1 unit in
   * text space.These widths shall be consistent with the actual widths given
   * in the font program.For more information on glyph widths and other
   * glyph metrics, see 9.2.4, "Glyph positioning and metrics".
   */
  @PDFArrayField("Widths")
  public Widths!: PDFArray;

  /**
   * (Optional) A specification of the font’s character encoding if different
   * from its built -in encoding.The value of Encoding shall be either the name
   * of a predefined encoding(MacRomanEncoding, MacExpertEncoding,
   * or WinAnsiEncoding, as described in Annex D, "Character Sets and
   * Encodings") or an encoding dictionary that shall specify differences from
   * the font’s built -in encoding or from a specified predefined encoding(see
   * 9.6.5, "Character encoding").
   */
  @PDFNameField("Encoding", true) // TODO dictionary | string
  public Encoding!: string | null;

  /**
   * (Optional; PDF 1.2) A stream containing a CMap file that maps character
   * codes to Unicode values(see 9.10.3, "ToUnicode CMaps").
   */
  @PDFDictionaryField({
    name: "ToUnicode",
    type: PDFStream,
    optional: true
  })
  public ToUnicode!: PDFStream | null;

  protected override onCreate(): void {
    super.onCreate();

    this.subtype = TrueTypeFontDictionary.SUBTYPE;
  }
}
