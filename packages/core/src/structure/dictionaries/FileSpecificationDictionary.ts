import { PDFArray, PDFArrayField, PDFBooleanField, PDFDictionary, PDFDictionaryField, PDFNameField, PDFStream, PDFTextString, PDFTextStringField } from "../../objects";
import { CollectionItemsDictionary } from "./CollectionItemsDictionary";

export class FileSpecificationDictionary extends PDFDictionary {

  public static readonly TYPE = "Filespec";

  /**
   * The type of PDF object that this dictionary describes. Shall be Filespec for a file specification dictionary. 
   */
  @PDFNameField("Type", true, FileSpecificationDictionary.TYPE)
  public type!: typeof FileSpecificationDictionary.TYPE;
  
  /**
   * The name of the file system that shall be used to interpret this file
   * specification. If this entry is present, all other entries in the dictionary shall be
   * interpreted by the designated file system. PDF shall define only one standard file
   * system name, URL (see 7.11.5, "URL specifications"); an application can register
   * other names (see Annex E, "PDF Name Registry"). This entry shall be independent
   * of the F and UF entries. 
   */
  @PDFNameField("FS", true)
  public fs!: string | null;

  /**
   * A file specification string of the form described in 7.11.2,
   * "File specification strings" or (if the file system is URL) a uniform resource locator,
   * as described in 7.11.5, "URL specifications".
   * The UF entry should be used in addition to the F entry. The UF entry provides
   * cross-platform and cross-language compatibility and the F entry provides
   * backwards compatibility. A PDF reader shall use the value of the UF key, when
   * present, instead of the F key.
   * 
   * (PDF 2.0) For unencrypted wrapper documents for an encrypted payload
   * document (see 7.6.7, "Unencrypted wrapper document") the F entry shall not
   * contain or be derived from the encrypted payload’s actual file name. This is to
   * avoid potential disclosure of sensitive information in the original filename. The
   * value of F for encrypted payload documents should include the name of the
   * cryptographic filter needed to decrypt the document. See the example in 7.6.7,
   * "Unencrypted wrapper document". 
   * @remarks 
   * - Required if the DOS, Mac, and Unix entries are all absent
   * - Amended with the UF entry for PDF 1.7
   */
  @PDFNameField("F", true)
  public f!: string | null;
  
  /**
   *  A Unicode text string that provides file specification of the form described in 7.11.2,
   * "File specification strings". This is a text string as defined in 7.9.2.2, "Text string
   * type". The F entry should be included along with this entry for backwards
   * compatibility reasons. A PDF reader shall use the value of the UF key, when
   * present, instead of the F key.
   * 
   * (PDF 2.0) For unencrypted wrapper documents for an encrypted payload
   * document (see 7.6.6, "Unencrypted wrapper document") the UF entry shall not
   * contain or be derived from the encrypted payload’s actual file name. This is to
   * avoid potential disclosure of sensitive information in the original filename. 
   * @remarks 
   * - Optional, but recommended if the F entry exists in the dictionary
   * - PDF 1.7
   */
  @PDFTextStringField("UF", true)
  public uf!: PDFTextString | null;
  
  /**
   * A file specification string representing a DOS file name. 
   * @remarks Deprecated in PDF 2.0
   */
  @PDFTextStringField("DOS", true)
  public dos!: PDFTextString | null;
  
  /**
   *  A file specification string representing a Mac OS file name.
   * @remarks Deprecated in PDF 2.0
   */
  @PDFTextStringField("Mac", true)
  public mac!: PDFTextString | null;
  
  /**
   * A file specification string representing a UNIX file name.
   * @remarks Deprecated in PDF 2.0
   */
  @PDFTextStringField("Unix", true)
  public unix!: PDFTextString | null;
  
  /**
   * An array of two byte strings constituting a file identifier (see 14.4, "File
   * identifiers") that should be included in the referenced file.
   * @note The use of this entry improves an application’s chances of finding
   * the intended file and allows it to warn the user if the file has
   * changed since the link was made. 
   */
  @PDFArrayField("ID", true)
  public id!: PDFArray | null;

  /**
   * A flag indicating whether the file referenced by the file
   * specification is volatile (changes frequently with time). If the value is true,
   * applications shall not cache a copy of the file. For example, a movie annotation
   * referencing a URL to a live video camera could set this flag to true to notify the
   * PDF reader that it should re-acquire the movie each time it is played. 
   * 
   * Default value: false. 
   */
  @PDFBooleanField("v", true, false)
  public v!: boolean;

  /**
   * A dictionary containing a subset of the F and UF keys corresponding to the entries
   * by those names in the file specification dictionary. The value of each such key
   * shall be an embedded file stream (see 7.11.4, "Embedded file streams") containing
   * the corresponding file. If this entry is present, the Type entry is required and the
   * file specification dictionary shall be indirectly referenced.
   * 
   * (PDF2.0) For unencrypted wrapper documents for an encrypted payload
   * document (see 7.6.7, "Unencrypted wrapper document") the EF dictionary is
   * required for the file stream containing the encrypted payload. 
   * @remarks
   * - Required if RF is present; PDF 1.3
   * - Amended to include the UF key in PDF 1.7
   */
  @PDFDictionaryField({
    name: "EF", 
    type: PDFDictionary,
    optional: true,
  })
  public ef!: PDFDictionary | null;
  
  /**
   * A dictionary with the same structure as the EF dictionary,
   * which shall be present. For each key in this dictionary, the same key shall appear
   * in the EF dictionary of this file specification dictionary. Each value shall be a
   * related files array (see 7.11.4.2, "Related files arrays") identifying files that are
   * related to the corresponding file in the EF dictionary. If this entry is present,
   * the Type entry is required and the file specification dictionary shall be indirectly
   * referenced.
   * 
   * @remarks PDF 1.3
   */
  @PDFDictionaryField({
    name: "RF", 
    type: PDFDictionary,
    optional: true,
  })
  public rf!: PDFDictionary | null;

  /**
   * Descriptive text associated with the file specification. It shall
   * be used for file specification dictionaries referenced from the
   * EmbeddedFiles name tree (see 7.7.4, "Name dictionary"). 
   * @remarks PDF 1.6
   */
  @PDFTextStringField("Desc", true)
  public desc!: PDFTextString | null;
  
  /**
   * A collection item dictionary, which shall be used to create the user interface for portable collections 
   * (see {@link CollectionItemsDictionary}).
   * @remarks PDF 1.7
   */
  @PDFDictionaryField({
    name: "CI", 
    type: CollectionItemsDictionary,
    optional: true,
    indirect: true,
  })
  public ci!: CollectionItemsDictionary | null;

  /**
   * A stream object defining the thumbnail image for the file  specification.
   * @remarks PDF 2.0
   */
  @PDFDictionaryField({
    name: "Thumb", 
    type: PDFStream,
    optional: true,
  })
  public thumb!: PDFStream | null;

  protected override onCreate(): void {
    super.onCreate();

    this.type = FileSpecificationDictionary.TYPE;
  }

}
