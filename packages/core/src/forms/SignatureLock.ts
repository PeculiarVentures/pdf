import * as objects from "../objects";

export enum SignatureLockAction {
  /**
   * All fields in the document
   */
  all = "All",
  /**
   * All fields specified in Fields
   */
  include = "Include",
  /**
   * All fields except those specified in Fields
   */
  exclude = "Exclude",
}

/**
 * The signature field lock dictionary contains the names of form fields 
 * whose values shall no longer be changed after this signature has been signed
 */
export class SignatureLockDictionary extends objects.PDFDictionary {

  public static readonly TYPE = "SigFieldLock";

  /**
   * The type of PDF object that this dictionary describes; if present,
   * shall be SigFieldLock for a signature field lock dictionary
   */
  @objects.PDFNameField("Type", true, SignatureLockDictionary.TYPE)
  public Type!: string | null;

  /**
   * A name which, in conjunction with Fields, indicates the set of fields
   * that should be locked. 
   * 
   * The value shall be one of the following:
   * - `All` All fields in the document 
   * - `Include` All fields specified in Fields 
   * - `Exclude` All fields except those specified in Fields
   */
  @objects.PDFNameField("Action")
  public Action!: SignatureLockAction;

  /**
   * An array of text strings containing field names
   * 
   * @remarks Required if the value of Action is Include or Exclude
   */
  @objects.PDFMaybeField("Fields", objects.PDFArray)
  public Fields!: objects.Maybe<objects.PDFArray>;

  /**
   * The access permissions granted for this document. 
   * 
   * Valid values shall be:
   * 1. No changes to the document are permitted; any change to the document shall invalidate the signature.
   * 2. Permitted changes shall be filling in forms, instantiating page templates, and signing; other changes shall invalidate the signature. 
   * 3. Permitted changes are the same as for 2, as well as annotation creation, deletion, and modification; other changes shall invalidate the signature.
   * 
   * @remarks PDF 2.0
   */
  @objects.PDFNumberField("P", true)
  public P!: number | null;

}
