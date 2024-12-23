import * as objects from "../../objects";
import * as common from "../common";

export class EmbeddedFileParams extends objects.PDFDictionary {
  /**
   * The size of the uncompressed embedded file, in bytes.
   */
  @objects.PDFNumberField("Size", true)
  public Size!: number | null;

  /**
   * The date and time when the embedded file was created.
   */
  @objects.PDFDateField("CreationDate", true)
  public CreationDate!: common.PDFDate | null;

  /**
   * The date and time when the embedded file was last modified.
   *
   * @remarks
   * Required in the case of an embedded file stream used as an associated file
   */
  @objects.PDFDateField("ModDate", true)
  public ModDate!: common.PDFDate | null;

  /**
   * A sub dictionary containing additional information specific to Mac OS files.
   *
   * @deprecated PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "Mac",
    type: objects.PDFDictionary,
    optional: true
  })
  public Mac!: objects.PDFDictionary | null;

  /**
   * A 16-byte string that is the checksum of the bytes of the uncompressed embedded file.
   *
   * The checksum shall be calculated by applying the standard MD5 message-digest algorithm
   * (described in Internet RFC 1321, The MD5 Message-Digest Algorithm) to the bytes of the
   * embedded file stream.
   *
   * @note This is strictly a checksum, and is not used for security purposes.
   */
  @objects.PDFTextStringField("CheckSum")
  public CheckSum!: objects.PDFTextString | null;
}
