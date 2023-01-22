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
   * the document.
   * 
   * 0 - An algorithm that is undocumented. This value shall not be used.
   * 
   * 1 - (Deprecated) Indicates the use of 7.6.3.1, "Algorithm 1: Encryption of data
   * using the RC4 or AES algorithms" (deprecated) with a file encryption key
   * length of 40 bits; see below.
   * 
   * 2 - (PDF 1.4; deprecated) Indicates the use of 7.6.3.1, "Algorithm 1: Encryption of
   * data using the RC4 or AES algorithms" (deprecated) but permitting file
   * encryption key lengths greater than 40 bits.
   * 
   * 3 - (PDF 1.4; deprecated) An unpublished algorithm that permits file encryption
   * key lengths ranging from 40 to 128 bits. This value shall not appear in a
   * conforming PDF file.
   * 
   * 4 - (PDF 1.5; deprecated) The security handler defines the use of encryption and
   * decryption in the document, using the rules specified by the CF, StmF, and StrF
   * entries using 7.6.3.1, "Algorithm 1: Encryption of data using the RC4 or AES
   * algorithms" (deprecated) with a file encryption key length of 128 bits.
   * 
   * 5 - (PDF 2.0) The security handler defines the use of encryption and decryption in
   * the document, using the rules specified by the CF, StmF, StrF and EFF entries
   * using 7.6.3.2, "Algorithm 1.A: Encryption of data using the AES algorithms"
   * with a file encryption key length of 256 bits. 
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
