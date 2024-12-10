import { PDFArray, PDFBooleanField, PDFDictionaryField, PDFTextString } from "../../objects";
import { CryptoFilterDictionary } from "./CryptoFilter";

export class PublicKeyCryptoFilterDictionary extends CryptoFilterDictionary {

  /**
   * If the crypt filter is referenced from StmF or StrF in the
   * encryption dictionary, this entry shall be an array of byte strings, where
   * each string shall be a binary-encoded CMS object that shall list recipients
   * that have been granted equal access rights to the document
   */
  @PDFDictionaryField({ name: "Recipients" })
  public Recipients!: PDFArray | PDFTextString;

  /**
   * Indicates whether the document-level metadata stream shall be encrypted. PDF
   * processors shall respect this value when determining whether metadata
   * shall be encrypted
   *
   * @remarks Used only by crypt filters that are referenced from StmF in an encryption dictionary
   */
  @PDFBooleanField("EncryptMetadata", true, true)
  public EncryptMetadata!: boolean;

}
