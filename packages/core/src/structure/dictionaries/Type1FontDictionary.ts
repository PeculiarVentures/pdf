import { PDFArray, PDFArrayField, PDFDictionary, PDFDictionaryField, PDFNameField, PDFNumberField, PDFStream } from "../../objects";
import { FontDictionary } from "./FontDictionary";

export class Type1FontDictionary extends FontDictionary {
  public static readonly SUBTYPE = "Type1";

  /**
   * (Required) The type of font; shall be Type1 for a Type 1 font.
   */
  @PDFNameField("Subtype")
  public override subtype!: typeof Type1FontDictionary.SUBTYPE;

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
  @PDFNumberField("FirstChar", true)
  public FirstChar!: number | null;

  /**
   * The last character code defined in the font’s Widths array.
   * @remarks
   * - Required
   * - Optional in PDF 1.0 - 1.7 for the standard 14 fonts
   */
  @PDFNumberField("LastChar", true)
  public LastChar!: number | null;

  /**
   * (Required; optional in PDF 1.0 - 1.7 for the standard 14 fonts; indirect
   * reference preferred) An array of(LastChar + FirstChar + 1) numbers,
   * each element being the glyph width for the character code that equals
   * FirstChar plus the array index.For character codes outside the range
   * FirstChar to LastChar, the value of MissingWidth from
   * the FontDescriptor entry for this font shall be used.The glyph widths
   * shall be measured in units in which 1000 units correspond to 1 unit in
   * text space.These widths shall be consistent with the actual widths given
   * in the font program.For more information on glyph widths and other
   * glyph metrics, see 9.2.4, "Glyph positioning and metrics".
   */
  @PDFArrayField("Widths", true)
  public Widths!: PDFArray | null;

  /**
   * (Optional) A specification of the font’s character encoding if different
   * from its built -in encoding.The value of Encoding shall be either the name
   * of a predefined encoding(MacRomanEncoding, MacExpertEncoding,
   * or WinAnsiEncoding, as described in Annex D, "Character Sets and
   * Encodings") or an encoding dictionary that shall specify differences from
   * the font’s built -in encoding or from a specified predefined encoding(see
   * 9.6.5, "Character encoding").
   */
  @PDFDictionaryField({
    name: "Encoding",
    type: PDFDictionary,
    optional: true,
  })
  public Encoding!: PDFDictionary | null;

  /**
   * (Optional; PDF 1.2) A stream containing a CMap file that maps character
   * codes to Unicode values(see 9.10.3, "ToUnicode CMaps").
   */
  @PDFDictionaryField({
    name: "ToUnicode",
    type: PDFStream,
    optional: true,
  })
  public ToUnicode!: PDFStream | null;

  protected override onCreate(): void {
    super.onCreate();

    this.subtype = Type1FontDictionary.SUBTYPE;
    this.BaseFont = "";
  }
}
