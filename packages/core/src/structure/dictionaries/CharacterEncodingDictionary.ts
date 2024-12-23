import * as objects from "../../objects";

export class CharacterEncodingDictionary extends objects.PDFDictionary {
  public static readonly TYPE = "Encoding";

  /**
   * The type of PDF object that this dictionary describes if present, shall be Encoding for an encoding dictionary.
   */
  @objects.PDFNameField("Type", true, CharacterEncodingDictionary.TYPE)
  public Type!: typeof CharacterEncodingDictionary.TYPE;

  /**
   * (Optional) The base encoding — that is, the encoding from which the Differences entry
   * (if present) describes differences — shall be the name of one of the predefined encodings
   * `MacRomanEncoding`, `MacExpertEncoding`, or `WinAnsiEncoding`.
   *
   * If this entry is absent, the Differences entry shall describe differences from a default
   * base encoding. For a font program that is embedded in the PDF file, the default base encoding
   * shall be the font program’s built-in encoding, "Character encoding" and further elaborated in the
   * subclauses on specific font types. Otherwise, for a nonsymbolic font, it shall be StandardEncoding,
   * and for a symbolic font, it shall be the font’s built-in encoding.
   */
  @objects.PDFNameField("BaseEncoding", true, "StandardEncoding")
  public BaseEncoding!: string;

  /**
   * An array describing the differences from the encoding specified by BaseEncoding or, if BaseEncoding
   * is absent from a default base encoding. The Differences array is described in subsequent subclauses.
   * @remarks should not be used with TrueType fonts
   */
  @objects.PDFArrayField("Differences", true)
  public Differences?: objects.PDFArray | null;
}
