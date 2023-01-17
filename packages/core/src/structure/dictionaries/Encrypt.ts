import { PDFDictionary, PDFNumberField, PDFNameField, PDFMaybeField, Maybe } from "../../objects";
import { CryptoFiltersDictionary } from "./CryptoFilters";

export class EncryptDictionary extends PDFDictionary {

  public static IDENTITY = "Identity";

  /**
   * The name of the preferred security handler for this document. It shall be
   * the name of the security handler that was used to encrypt the document
   */
  @PDFNameField("Filter")
  public Filter!: string;

  /**
   *  A name that completely specifies the format and interpretation of
   * the contents of the encryption dictionary
   */
  @PDFNameField("SubFilter", true)
  public SubFilter!: null | string;

  /**
   * A code specifying the algorithm to be used in encrypting and decrypting
   * the document
   */
  @PDFNumberField("V", true, 0)
  public V!: number;

  /**
   * The length of the file encryption key, in bits. The value shall be a multiple of 8, 
   * in the range 40 to 128. 
   * 
   * Default value: 40. 
   */
  @PDFNumberField("Length", true, 40)
  public Length!: number;

  /**
   * A dictionary whose keys shall be crypt filter names and whose values shall be the
   * corresponding crypt filter dictionaries 
   */
  @PDFMaybeField("CF", CryptoFiltersDictionary)
  public CF!: Maybe<CryptoFiltersDictionary>;

  /**
   * The name of the crypt filter that shall be used by default when decrypting streams
   */
  @PDFNameField("StmF", true, "Identity")
  public StmF!: string;

  /**
   * The name of the crypt filter that shall be used when decrypting all strings in the document
   */
  @PDFNameField("StrF", true, "Identity")
  public StrF!: string;

  /**The name of the crypt filter that shall be used when encrypting embedded file streams that do
   * not have their own crypt filter specifier; it shall correspond to a key in the CF
   * dictionary or a standard crypt filter name 
   */
  @PDFNameField("EFF", true)
  public EFF!: null | string;

}
