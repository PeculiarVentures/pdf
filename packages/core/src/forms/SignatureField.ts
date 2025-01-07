import * as objects from "../objects";
import { Maybe } from "../objects";
import { PDFField } from "./Field";
import { SignatureDictionary } from "./Signature";
import { SignatureLockDictionary } from "./SignatureLock";

export class SignatureField extends PDFField {
  public static readonly FIELD_TYPE = "Sig";

  /**
   * The minimum required capability of the signature field seed value
   * dictionary parser. A value of 1 specifies that the parser shall be able to recognize
   * all seed value dictionary entries in a PDF 1.5 file. A value of 2 specifies that it
   * shall be able to recognize all seed value dictionary entries specified. A value of 3
   * specifies that it shall be able to recognize all seed value dictionary entries
   * specified in PDF 2.0 and earlier.
   *
   * The Ff entry indicates whether this shall be treated as a required constraint.
   */
  @objects.PDFDictionaryField({
    name: "V",
    type: SignatureDictionary,
    optional: true
  })
  public override V!: SignatureDictionary | null;

  /**
   * A signature field lock dictionary that specifies
   * a set of form fields that shall be locked when this
   * signature field is signed
   *
   * @remarks PDF 1.5
   */
  @objects.PDFMaybeField("Lock", SignatureLockDictionary, true)
  public Lock!: Maybe<SignatureLockDictionary>;

  /**
   * A seed value dictionary containing information
   * that constrains the properties of a signature
   * that is applied to this field
   */
  @objects.PDFDictionaryField({
    name: "SV",
    type: objects.PDFDictionary,
    optional: true
  })
  public SV!: objects.PDFDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    this.ft = SignatureField.FIELD_TYPE;
  }
}
