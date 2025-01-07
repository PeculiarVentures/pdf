import * as objects from "../../objects";
import { EmbeddedFileParams } from "./EmbeddedFileParams";

export class EmbeddedFileStream extends objects.PDFStream {
  public static TYPE = "EmbeddedFile";

  /**
   * The type of PDF object that this dictionary describes.
   *
   * @remarks
   * If present, shall be EmbeddedFile for an embedded file stream.
   */
  @objects.PDFNameField("Type", true, EmbeddedFileStream.TYPE)
  public Type!: typeof EmbeddedFileStream.TYPE;

  /**
   * The subtype of the embedded file.
   *
   * The value of this entry shall conform to the MIME media type names defined in Internet RFC2046,
   * Multipurpose Internet Mail Extensions (MIME), Part Two: MediaTypes, with the provision
   * that characters not permitted in names shall use the 2-character hexadecimal code format
   * described in 7.3.5, "Name objects".
   *
   * @remarks
   * Required in the case of an embedded file stream used as as associated file
   */
  @objects.PDFNameField("Subtype", true)
  public Subtype!: string | null;

  /**
   * An embedded file parameter dictionary that shall contain additional file-specific information.
   *
   * @remarks
   * Required in the case of an embedded file stream used as an associated file
   */
  @objects.PDFMaybeField("Params", EmbeddedFileParams)
  public Params!: objects.Maybe<EmbeddedFileParams>;
}
