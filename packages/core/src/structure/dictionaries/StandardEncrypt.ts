import { PDFBooleanField, PDFDictionaryField, PDFHexStringField, PDFNumberField, PDFLiteralStringField, PDFTextStringField } from "../../objects";
import { PDFTextString } from "../../objects/TextString";
import { EncryptDictionary } from "./Encrypt";

export class StandardEncryptDictionary extends EncryptDictionary {

  /**
   * A number specifying which revision of the standard security handler shall be used to interpret this dictionary:
   * 2 if the document is encrypted with a V value less than 2 (see Table 20) and does not have any of the access permissions
   * set to 0 (by means of the P entry, below) that are designated “Security handlers of revision 3 or greater” in Table 22
   * 3 if the document is encrypted with a V value of 2 or 3, or has any “Security handlers of revision 3 or greater” access permissions set to 0
   * 4 if the document is encrypted with a V value of 4
   */
  @PDFNumberField("R")
  public r!: number;

  /**
   * A 32-byte string, based on both the owner and user passwords,
   * that shall be used in computing the encryption key and in determining whether a valid owner password was entered.
   * For more information, see 7.6.3.3, "Encryption Key Algorithm," and 7.6.3.4, "Password Algorithms."
   */
  @PDFDictionaryField({
    name: "O",
    type: PDFTextString,
  })
  public o!: PDFTextString;

  /**
   * A 32-byte string, based on the user password, that shall be used in determining whether to prompt
   * the user for a password and, if so, whether a valid user or owner password was entered.
   * For more information, see 7.6.3.4, "Password Algorithms."
   */
  @PDFLiteralStringField("U")
  public u!: string;

  /**
   * A 32-byte string, based on the owner and user
   * password, that shall be used in computing the file encryption key
   */
  @PDFTextStringField("OE", true)
  public oe!: PDFTextString | null;

  /**
   * A 32-byte string, based on the user password,
   * that shall be used in computing the file encryption key.
   */
  @PDFTextStringField("UE", true)
  public ue!: PDFTextString | null;

  /**
   * A set of flags specifying which operations shall be permitted when the document is opened with user access (see Table 22).
   */
  @PDFNumberField("P")
  public p!: number;

  /**
   * A 16-byte string, encrypted with the file
   * encryption key, that contains an encrypted copy of the permissions flags.
   */
  @PDFTextStringField("Perms", true)
  public perms!: PDFTextString | null;

  /**
   * Indicates whether the document-level metadata stream (see 14.3.2, "Metadata Streams") shall be encrypted.
   * Conforming products should respect this value.
   */
  @PDFBooleanField("EncryptMetadata", true, true)
  public encryptMetadata!: boolean;

}
