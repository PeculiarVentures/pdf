import {
  PDFArray,
  PDFDictionaryField,
  PDFNameField,
  PDFStream
} from "../../objects";
import { FontDictionary } from "./FontDictionary";

export class Type0FontDictionary extends FontDictionary {
  public static readonly SUBTYPE = "Type0";

  /**
   * (Required) The type of font; shall be Type1 for a Type 1 font.
   */
  @PDFNameField("Subtype")
  public override subtype!: typeof Type0FontDictionary.SUBTYPE;

  /**
   * (Required) The name of the font. If the descendant is a Type 0 CIDFont,
   * this name should be the concatenation of the CIDFont’s BaseFont name,
   * a hyphen, and the CMap name given in the Encoding entry (or
   * the CMapName entry in the CMap). If the descendant is a Type 2
   * CIDFont, this name should be the same as the CIDFont’s BaseFont name.
   */
  @PDFNameField("BaseFont")
  public BaseFont!: string;

  /**
   * (Required) The name of a predefined CMap, or a stream containing a
   * CMap that maps character codes to font numbers and CIDs. If the
   * descendant is a Type 2 CIDFont whose associated TrueType font
   * program is not embedded in the PDF file, the Encoding entry shall be a
   * predefined CMap name
   */
  @PDFNameField("Encoding")
  public Encoding!: string;

  /**
   * (Required) A one-element array specifying the CIDFont dictionary that is
   * the descendant of this Type 0 font.
   */
  @PDFDictionaryField({
    name: "DescendantFonts",
    type: PDFArray
  })
  public DescendantFonts!: PDFArray;

  /**
   * (Optional) A stream containing a CMap file that maps character codes to
   * Unicode values
   */
  @PDFDictionaryField({
    name: "ToUnicode",
    type: PDFStream,
    optional: true
  })
  public ToUnicode!: PDFStream | null;

  protected override onCreate(): void {
    super.onCreate();

    this.subtype = Type0FontDictionary.SUBTYPE;
    this.Encoding = "Identity-H";
  }
}
