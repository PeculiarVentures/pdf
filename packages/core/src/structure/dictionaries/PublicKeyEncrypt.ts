import { PDFArray, PDFNumberField, PDFArrayField } from "../../objects";
import { EncryptDictionary } from "./Encrypt";

export enum PublicKeyPermissionFlags {
  /**
   * When set permits change of encryption and enables all other permissions.
   */
  enableAll = 1 << 1,
  /**
   * Print the document (possibly not at the highest quality level, depending on whether bit 12 is also set). 
   */
  printDocument = 1 << 2,
  /**
   * Copy or otherwise extract text and graphics from the document.
   * However, for the limited purpose of providing this content to assistive
   * technology, a PDF reader shall behave as if this bit was set to 1.
   * 
   * @remarks ISO 32000-1 had this option restricted by bit 10, for
   * accessibility, but that exception has been deprecated in
   * PDF 2.0. 
   */
  copy = 1 << 4,
  /**
   * Add or modify text annotations, fill in interactive form fields, and, if
   * bit 4 is also set, create or modify interactive form fields (including
   * signature fields).
   */
  modify = 1 << 5,
  /**
   * Fill in existing interactive form fields (including signature fields), even
   * if bit 6 is clear. 
   */
  fillForms = 1 << 8,
  /**
   * Assemble the document (insert, rotate, or delete pages and create
   * document outline items or thumbnail images), even if bit 4 is clear. 
   */
  assembleDocument = 1 << 10,
  /**
   * Print the document to a representation from which a faithful digital
   * copy of the PDF content could be generated, based on an
   * implementation-dependent algorithm. When this bit is clear (and bit 3
   * is set), printing shall be limited to a low-level representation of the
   * appearance, possibly of degraded quality. 
   */
  printRepresentation = 1 << 11,
}

export class PublicKeyEncryptDictionary extends EncryptDictionary {

  /**
   * An array of byte-strings, where each string is a PKCS#7 object listing recipients
   * who have been granted equal access rights to the document.
   * 
   * @remarks Required when SubFilter is `adbe.pkcs7.s3` or `adbe.pkcs7.s4`
   * @since PDF 1.3
   */
  @PDFArrayField("Recipients", true)
  public Recipients!: PDFArray;

  /**
   * A set of flags specifying which operations shall be permitted when the document is opened with user access.
   * If bit 2 is set to 1, all other bits are ignored and all operations are permitted.
   * If bit 2 is set to 0, permission for operations are based on the values of the remaining flags defined in Table 24.
   */
  @PDFNumberField("P")
  public P!: PublicKeyPermissionFlags;

}
