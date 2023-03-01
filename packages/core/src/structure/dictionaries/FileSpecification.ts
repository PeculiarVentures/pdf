import * as objects from "../../objects";
import { EmbeddedFileStream } from "./EmbeddedFile";

export class FileSpecificationEntries extends objects.PDFDictionary {
  @objects.PDFMaybeField("F", EmbeddedFileStream)
  public F!: objects.Maybe<EmbeddedFileStream>;

  @objects.PDFMaybeField("UF", EmbeddedFileStream)
  public UF!: objects.Maybe<EmbeddedFileStream>;
}

/**
 * Represents file specification dictionary described in `Table 43: Entries in a file specification dictionary`
 */
export class FileSpecificationDictionary extends objects.PDFDictionary {

  public static TYPE = "Filespec";

  /**
   * The type of PDF object that this dictionary describes
   *
   * Shall be `Filespec` for a file specification dictionary.
   *
   * @remarks
   * Required if an EF, EP or RF entry is present; recommended always
   */
  @objects.PDFNameField("Type", true, FileSpecificationDictionary.TYPE)
  public Type!: typeof FileSpecificationDictionary.TYPE;

  /**
   * The name of the file system that shall be used to interpret this file
   * specification. If this entry is present, all other entries in the dictionary shall be
   * interpreted by the designated file system. PDF shall define only one standard
   * filesystem name, URL (see 7.11.5, "URL specifications"); an application can register
   * other names (see Annex E, "PDF Name Registry"). This entry shall be independent of the
   * F and UF entries.
   */
  @objects.PDFNameField("FS", true)
  public FS!: string | null;

  /**
   * A file specification string of the form described in 7.11.2,"File specification strings"
   * or (if the file system is URL) a uniform resource locator, as described in 7.11.5,
   * "URL specifications".
   *
   * The UF entry should be used in addition to the F entry. The UF entry provides cross-platform
   * and cross-language compatibility and the F entry provides backwards compatibility.
   * A PDF reader shall use the value of the UF key, when present, instead of the F key.
   *
   * @remarks Required if the DOS, Mac, and Unix entries are all absent
   *
   * @remarks Amended with the UF entry for PDF 1.7
   *
   * @remarks PDF 2.0
   *
   * For unencrypted wrapper documents for an encrypted payload document (see 7.6.7, "Unencrypted
   * wrapper document") the F entry shall not contain or be derived from the encrypted payload’s
   * actual file name. This is to avoid potential disclosure of sensitive information in the original
   * filename. The value of F for encrypted payload documents should include the name of the cryptographic
   * filter needed to decrypt the document. See the example in 7.6.7,"Unencrypted wrapper document".
   */
  @objects.PDFTextField("F", objects.PDFLiteralString, true)
  public F!: string | null;

  /**
   * A Unicode text string that provides file specification of the form described in 7.11.2,"File
   * specification strings". This is a text string as defined in 7.9.2.2, "Text string type".
   * The F entry should be included along with this entry for backwards compatibility reasons.
   * A PDF reader shall use the value of the UF key, when present, instead of the F key.
   *
   * @remarks Recommended if the F entry exists in the dictionary; PDF 1.7
   *
   * @remarks PDF 2.0
   *
   * For unencrypted wrapper documents for an encrypted payload document (see 7.6.6, "Unencrypted
   * wrapper document") the UF entry shall not contain or be derived from the encrypted payload’s
   * actual file name. This is to avoid potential disclosure of sensitive information in the original
   * filename.
   *
   * @since PDF 1.7
   */
  @objects.PDFTextField("UF", objects.PDFLiteralString, true)
  public UF!: string | null;

  /**
   * A file specification string representing a DOS file name.
   *
   * @deprecated PDF 2.0
   */
  @objects.PDFTextField("DOS", objects.PDFLiteralString, true)
  public DOS!: string | null;

  /**
   * A file specification string representing a Mac OS file name.
   *
   * @deprecated PDF 2.0
   */
  @objects.PDFTextField("Mac", objects.PDFLiteralString, true)
  public Mac!: string | null;

  /**
   * A file specification string representing a Unix file name.
   *
   * @deprecated PDF 2.0
   */
  @objects.PDFTextField("Unix", objects.PDFLiteralString, true)
  public Unix!: string | null;

  /**
   * An array of two byte strings constituting a file identifier (see 14.4, "File identifiers")
   * that should be included in the referenced file.
   *
   * @note
   * The use of this entry improves an application’s chances of finding the intended file
   * and allows it to warn the user if the file has changed since the link was made.
   */
  @objects.PDFArrayField("ID", true)
  public ID!: objects.PDFArray | null;

  /**
   * A flag indicating whether the file referenced by the file specification is volatile
   * (changes frequently with time). If the value is true, applications shall not cache a copy
   * of the file. For example, a movie annotation referencing a URL to a live video camera could
   * set this flag to true to notify thePDF reader that it should re-acquire the movie each time
   * it is played.
   *
   * Default value: false.
   *
   * @since PDF 1.2
   */
  @objects.PDFBooleanField("ID", true, false)
  public V!: boolean;

  /**
   * A dictionary containing a subset of the F and UF keys corresponding to the entries by those
   * names in the file specification dictionary. The value of each such key shall be an embedded
   * file stream (see 7.11.4, "Embedded file streams") containing the corresponding file. If this
   * entry is present, the Type entry is required and the file specification dictionary shall be
   * indirectly referenced.
   *
   * @remarks Required if RF is present
   *
   * @remarks Amended to include the UF key in PDF 1.7
   *
   * @remarks PDF2.0
   *
   * For unencrypted wrapper documents for an encrypted payload document (see 7.6.7, "Unencrypted
   * wrapper document") the EF dictionary is required for the file stream containing the encrypted
   * payload.
   *
   * @since PDF 1.3
   */
  @objects.PDFMaybeField("EF", FileSpecificationEntries)
  public EF!: objects.Maybe<FileSpecificationEntries>;

  /**
   * A dictionary with the same structure as the EF dictionary, which shall be present. For each key
   * in this dictionary, the same key shall appear in the EF dictionary of this file specification
   * dictionary. Each value shall be are lated files array (see 7.11.4.2, "Related files arrays")
   * identifying files that are related to the corresponding file in the EF dictionary. If this entry
   * is present, the Type entry is required and the file specification dictionary shall be indirectly
   * referenced.
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "RF",
    type: objects.PDFDictionary,
    optional: true,
  })
  public RF!: objects.PDFDictionary | null;

  /**
   * Descriptive text associated with the file specification. It shall be used for file specification
   * dictionaries referenced from the EmbeddedFiles name tree (see 7.7.4, "Name dictionary").
   *
   * @since PDF 1.6
   */
  @objects.PDFTextField("Desc", objects.PDFLiteralString, true)
  public Desc!: string | null;

  /**
   * A collection item dictionary, which shall be used to create the user interface for portable
   * collections (see 7.11.6,"Collection items").
   *
   * @remarks Shall be indirect reference
   *
   * @since PDF 1.7
   */
  @objects.PDFDictionaryField({
    name: "CI",
    type: objects.PDFDictionary,
    optional: true,
    indirect: true,
  })
  public CI!: objects.PDFDictionary | null;

  /**
   * A stream object defining the thumbnail image for the file specification. (See 12.3.4, "Thumbnail
   * images")
   *
   * @since PDF 2.0
   */

  @objects.PDFStreamField("Thumb", true)
  public Thumb!: objects.PDFStream | null;

  protected override onCreate(): void {
    this.Type = FileSpecificationDictionary.TYPE;
  }

}
