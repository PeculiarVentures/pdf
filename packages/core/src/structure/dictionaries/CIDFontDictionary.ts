import * as objects from "../../objects";
import { CIDSystemInfoDictionary } from "./CIDSystemInfoDictionary";
import { FontDictionary } from "./FontDictionary";

export class CIDFontDictionary extends FontDictionary {
  public static readonly SUBTYPE = "CIDFontType2";

  /**
   * (Required) The type of font; shall be Type1 for a Type 1 font.
   */
  @objects.PDFNameField("Subtype")
  public override subtype!: typeof CIDFontDictionary.SUBTYPE;

  /**
   * The PostScript name of the CIDFont. For Type 0 CIDFonts, this
   * shall be the value of the CIDFontName entry in the CIDFont program.
   * For Type 2 CIDFonts, it shall be derived the same way as for a simple
   * TrueType font; see 9.6.3, "TrueType fonts". In either case, the name may
   * have a subset prefix if appropriate; see 9.9.2, "Font subsets".
   */
  @objects.PDFNameField("BaseFont")
  public BaseFont!: string;

  /**
   * A dictionary containing entries that define the character
   * collection of the CIDFont. See "Table 114: Entries in a CIDSystemInfo
   * dictionary".
   */
  @objects.PDFDictionaryField({
    name: "CIDSystemInfo",
    type: CIDSystemInfoDictionary,
  })
  public CIDSystemInfo!: CIDSystemInfoDictionary;

  /**
   * The default width for glyphs in the CIDFont (see 9.7.4.3,
   * "Glyph metrics in CIDFonts"). Default value: 1000.
   */
  @objects.PDFNumberField("DW", true, 1000)
  public DW!: objects.PDFNumeric | null;

  /**
   * A description of the widths for the glyphs in the CIDFont
   */
  @objects.PDFMaybeField("W", objects.PDFArray)
  public W!: objects.Maybe<objects.PDFArray>;

  /**
   * An array of two numbers specifying the default metrics for vertical writing (see
   * 9.7.4.3, "Glyph metrics in CIDFonts"). Default value: [880 -1000]
   * @remarks applies only to CIDFonts used for vertical writing
   */
  @objects.PDFMaybeField("DW2", objects.PDFArray)
  public DW2!: objects.Maybe<objects.PDFArray>;

  /**
   * A description of the metrics for vertical writing for the glyphs in the CIDFont (see
   * 9.7.4.3, "Glyph metrics in CIDFonts"). Default value: none (the DW2 value
   * shall be used for all glyphs).
   * @remarks applies only to CIDFonts used for vertical writing
   */
  @objects.PDFMaybeField("W2", objects.PDFArray)
  public W2!: objects.Maybe<objects.PDFArray>;

  /**
   * A specification of the mapping from CIDs to glyph indices. If the value is a
   * stream, the bytes in the stream shall contain the mapping from CIDs to
   * glyph indices: the glyph index for a particular CID value c shall be a 2­
   * byte value stored in bytes 2 × c and 2 × c + 1, where the first byte
   * shall be the high-order byte. If the value of CIDToGIDMap is a name, it
   * shall be Identity, indicating that the mapping between CIDs and glyph
   * indices is the identity mapping
   * @remarks
   * Required for Type 2 CIDFonts with embedded font programs
   */
  @objects.PDFDictionaryField({
    name: "CIDToGIDMap",
    optional: true,
  })
  public CIDToGIDMap!: objects.PDFStream | objects.PDFName | null;

  protected override onCreate(): void {
    super.onCreate();

    this.subtype = CIDFontDictionary.SUBTYPE;
  }

}
