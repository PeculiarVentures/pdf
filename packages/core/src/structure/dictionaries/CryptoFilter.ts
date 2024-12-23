import { PDFDictionary, PDFNumberField, PDFNameField } from "../../objects";

export enum CryptoFilterMethods {
  /**
   * The application shall not decrypt data but shall direct the input
   * stream to the security handler for decryption
   */
  None = "None",
  /**
   * The application shall ask the security handler for
   * the file encryption key and shall implicitly decrypt data with
   * 7.6.3.1, "Algorithm 1: Encryption of data using the RC4 or AES
   * algorithms", using the RC4 algorithm.
   */
  RC4 = "V2",
  /**
   * The application shall ask the security
   * handler for the file encryption key and shall implicitly decrypt
   * data with 7.6.3.1, "Algorithm 1: Encryption of data using the RC4
   * or AES algorithms", using the AES algorithm in Cipher Block
   * Chaining (CBC) mode with a 16-byte block size and an
   * initialization vector that shall be randomly generated and placed
   * as the first 16 bytes in the stream or string. The key size
   * (Length) shall be 128 bits.
   * @since PDF 1.6
   */
  AES128 = "AESV2",
  /**
   * The application shall ask the security handler for the
   * file encryption key and shall implicitly decrypt data with 7.6.3.2,
   * "Algorithm 1.A: Encryption of data using the AES algorithms",
   * using the AES-256 algorithm in Cipher Block Chaining (CBC)
   * with padding mode with a 16-byte block size and an
   * initialization vector that is randomly generated and placed as
   * the first 16 bytes in the stream or string. The key size (Length)
   * shall be 256 bits.
   * @since PDF 2.0
   */
  AES256 = "AESV3"
}

export class CryptoFilterDictionary extends PDFDictionary {
  public static TYPE = "CryptFilter";

  /**
   * If present, shall be CryptFilter for a crypt filter dictionary.
   */
  @PDFNameField("Type", true, CryptoFilterDictionary.TYPE)
  public Type!: typeof CryptoFilterDictionary.TYPE;

  /**
   * The method used, if any, by the PDF reader to decrypt data
   */
  @PDFNameField("CFM", true, "None")
  public CFM!: CryptoFilterMethods;

  @PDFNameField("AuthEvent", true, "DocOpen")
  public AuthEvent!: string;

  /**
   * The standard security handler expresses the Length entry in bytes.
   */
  @PDFNumberField("Length", true)
  public Length!: null | number;
}
