import { PDFDictionary, PDFDictionaryField, PDFNameField } from "../../objects";
import { FontDescriptorDictionary } from "./FontDescriptor";

export class FontDictionary extends PDFDictionary {
  public static readonly TYPE = "Font";

  /**
   * (Required) The type of PDF object that this dictionary describes; shall be
   * Font for a font dictionary.
   */
  @PDFNameField("Type")
  public type!: typeof FontDictionary.TYPE;

  /**
   * (Required) The type of font; shall be Type1 for a Type 1 font.
   */
  @PDFNameField("Subtype")
  public subtype!: string;

  /**
   * (Required in PDF 1.0; optional in PDF 1.1 through 1.7, deprecated in PDF
   * 2.0) The name by which this font is referenced in the Font subdictionary
   * of the current resource dictionary.
   * @deprecated in PDF 2.0
   */
  @PDFNameField("Name")
  public Name!: string | null;

  /**
   * (Required; optional in PDF 1.0 - 1.7 for the standard 14 fonts; shall be an
   * indirect reference) A font descriptor describing the font’s metrics other
   * than its glyph widths(see 9.8, "Font descriptors").
   * For the standard 14 fonts, the entries FirstChar, LastChar, Widths,
   * and FontDescriptor shall either all be present or all be absent.
   * Ordinarily, these dictionary keys may be absent; specifying them enables
   * a standard font to be overridden; see 9.6.2.2, "Standard Type 1 fonts
   * (standard 14 fonts)(PDF 1.0 - 1.7)".
   */
  @PDFDictionaryField({
    name: "FontDescriptor",
    type: FontDescriptorDictionary
  })
  public FontDescriptor!: FontDescriptorDictionary;

  protected override onCreate(): void {
    super.onCreate();

    this.type = FontDictionary.TYPE;
    this.subtype = "";
  }
}
