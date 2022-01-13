import * as objects from "../objects";

export enum SignatureLockActions {
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

export class SignatureLockDictionary extends objects.PDFDictionary {

  /**
   * The type of PDF object that this dictionary describes
   * 
   * if present, shall be SigFieldLock for a signature field lock dictionary
   */
  @objects.PDFDictionaryField({
    name: "Type",
    type: objects.PDFName,
    optional: true,
    get: o => o.text
  })
  public type!: objects.PDFName | null;

  /**
   * A name which, in conjunction with Fields, indicates the set 
   * of fields that should be locked
   */
  @objects.PDFDictionaryField({
    name: "Action",
    type: objects.PDFName,
    optional: true,
    get: o => o.text
  })
  public action!: SignatureLockActions | null;

  /**
   * An array of text strings containing field names
   * 
   * Required if the value of Action is Include or Exclude
   */
  @objects.PDFDictionaryField({
    name: "Fields",
    type: objects.PDFArray,
    optional: true,
  })
  public fields!: objects.PDFArray | null;

}
