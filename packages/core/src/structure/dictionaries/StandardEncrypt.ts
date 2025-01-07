import {
  PDFBooleanField,
  PDFNumberField,
  PDFTextStringField
} from "../../objects";
import { PDFTextString } from "../../objects/TextString";
import { EncryptDictionary } from "./Encrypt";

export enum UserAccessPermissionFlags {
  /**
   * Print the document.
   * @remarks Security handlers of revision 2
   */
  printDocument = 1 << 2,
  /**
   * Modify the contents of the document by operations other than
   * those controlled by bits {@link annots}, {@link fillForms}, and {@link assembleDocument}.
   */
  modifyContent = 1 << 3,
  /**
   * Copy or otherwise extract text and graphics from the document.
   * However, for the limited purpose of providing this content to
   * assistive technology, a PDF reader should behave as if this bit
   * was set to {@link printDocument}.
   */
  copy = 1 << 4,
  /**
   * Add or modify text annotations, fill in interactive form fields,
   * and, if bit {@link modifyContent} is also set, create or modify interactive form fields
   * (including signature fields).
   */
  annots = 1 << 5,
  /**
   * Fill in existing interactive form fields (including signature fields),
   * even if bit {@link annots} is clear.
   * @remarks Security handlers of revision 3 or greater
   */
  fillForms = 1 << 8,
  /**
   * Not used. This bit was previously used to determine whether
   * content could be extracted for the purposes of accessibility,
   * however, that restriction has been deprecated in PDF 2.0. PDF
   * readers shall ignore this bit and PDF writers shall always set this
   * bit to 1 to ensure compatibility with PDF readers following
   * earlier specifications.
   */
  notUsed = 1 << 9,
  /**
   * Assemble the document (insert, rotate, or delete pages and create document
   * outline items or thumbnail images), even if bit {@link modifyContent} is clear.
   * @remarks Security handlers of revision 3 or greater
   */
  assembleDocument = 1 << 10,
  /**
   * Print the document to a representation from which a faithful digital copy of the PDF
   * content could be generated, based on an implementation
   * dependent algorithm. When this bit is clear (and bit {@link printDocument} is set),
   * printing shall be limited to a low-level representation of the
   * appearance, possibly of degraded quality.
   * @remarks Security handlers of revision 3 or greater
   */
  printRepresentation = 1 << 11
}

export class StandardEncryptDictionary extends EncryptDictionary {
  /**
   * A number specifying which revision of the standard security handler shall be used to interpret this dictionary:
   * 2 if the document is encrypted with a V value less than 2 (see Table 20) and does not have any of the access permissions
   * set to 0 (by means of the P entry, below) that are designated “Security handlers of revision 3 or greater” in Table 22
   * 3 if the document is encrypted with a V value of 2 or 3, or has any “Security handlers of revision 3 or greater” access permissions set to 0
   * 4 if the document is encrypted with a V value of 4
   */
  @PDFNumberField("R")
  public R!: number;

  /**
   * A 32-byte string, based on both the owner and user passwords,
   * that shall be used in computing the encryption key and in determining whether a valid owner password was entered.
   * For more information, see 7.6.3.3, "Encryption Key Algorithm," and 7.6.3.4, "Password Algorithms."
   */
  @PDFTextStringField("O")
  public O!: PDFTextString;

  /**
   * A 32-byte string, based on the user password, that shall be used in determining whether to prompt
   * the user for a password and, if so, whether a valid user or owner password was entered.
   * For more information, see 7.6.3.4, "Password Algorithms."
   */
  @PDFTextStringField("U")
  public U!: PDFTextString;

  /**
   * A 32-byte string, based on the owner and user
   * password, that shall be used in computing the file encryption key
   */
  @PDFTextStringField("OE", true)
  public OE!: PDFTextString | null;

  /**
   * A 32-byte string, based on the user password,
   * that shall be used in computing the file encryption key.
   */
  @PDFTextStringField("UE", true)
  public UE!: PDFTextString | null;

  /**
   * A set of flags specifying which operations shall be permitted when the document is opened with user access (see Table 22).
   */
  @PDFNumberField("P")
  public P!: UserAccessPermissionFlags;

  /**
   * A 16-byte string, encrypted with the file
   * encryption key, that contains an encrypted copy of the permissions flags.
   */
  @PDFTextStringField("Perms", true)
  public Perms!: PDFTextString | null;

  /**
   * Indicates whether the document-level metadata stream (see 14.3.2, "Metadata Streams") shall be encrypted.
   * Conforming products should respect this value.
   */
  @PDFBooleanField("EncryptMetadata", true, true)
  public EncryptMetadata!: boolean;
}
