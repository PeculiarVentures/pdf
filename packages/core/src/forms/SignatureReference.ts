import * as objects from "../objects";

export enum TransformMethod {
  /**
   * Used to detect modifications to a document relative 
   * to a signature field that is signed by the originator 
   * of a document
   */
  docMDP = "DocMDP",
  /**
   * Used to detect modifications to a document that would 
   * invalidate a signature in a right-enabled document
   */
  ur = "UR",
  /**
   * Used to detect modifications to a list of form fields 
   * specified in TransformParams
   */
  fieldMDP = "FieldMDP",
}

export class SignatureReferenceDictionary extends objects.PDFDictionary {

  /**
   * The type of PDF object that this dictionary describes
   */
  @objects.PDFDictionaryField({
    type: objects.PDFName,
    name: "Type",
    get: o => o.text,
  })
  public type!: string;
  
  /**
   * The name of the transform method that shall guide the
   * modification analysis that takes place when the signature is
   * validated
   */
  @objects.PDFDictionaryField({
    type: objects.PDFName,
    name: "TransformMethod",
    get: o => o.text,
  })
  transformMethod!: TransformMethod;
  
  /**
   * A dictionary specifying transform parameters (variable data) 
   * for the transform method specified by TransformMethod
   */
  @objects.PDFDictionaryField({
    type: objects.PDFDictionary,
    name: "TransformParams",
    optional: true,
  })
  transformParams!: objects.PDFDictionary | null;
  
  /**
   * An indirect reference to the object in the document upon which the object
   * modification analysis should be performed. For transform
   * methods other than FieldMDP, this object is implicitly defined
   */
  @objects.PDFDictionaryField({
    name: "Data",
    optional: true,
  })
  data!: objects.PDFObjectTypes | null;
  
  /**
   * A name identifying the algorithm that 
   * shall be used when computing the digest
   */
  @objects.PDFDictionaryField({
    name: "Digest",
    type: objects.PDFName,
    optional: true,
    get: o => o.text,
    defaultValue: "MD5"
  })
  digest!: string | null;

}
