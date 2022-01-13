import { IFieldDictionary, PDFField } from "../../forms";
import * as objects from "../../objects";

export enum SignatureFlags {
  /**
   * If set, the document contains at least one signature field
   * 
   * This flag allows a conforming reader to enable user interface items
   * (such as menu items or pushbuttons) related to signature processing
   * without having to scan the entire document for the presence of signature
   * fields.
   */
  signaturesExist = 1,
  /**
   * If set, the document contains signatures that may be invalidated if
   * the file is saved (written) in a way that alters its previous contents,
   * as opposed to an incremental update. Merely updating the file by 
   * appending new information to the end of the previous version is safe
   */
  appendOnly = 2,
}

export class InteractiveFormDictionary extends objects.PDFDictionary {

  /**
   * An array of references to the document’s root fields (those with no ancestors in the field hierarchy).
   */
  @objects.PDFDictionaryField({
    name: "Fields",
    type: objects.PDFArray,
  })
  public Fields!: objects.PDFArray;

  /**
   * A flag specifying whether to construct appearance streams 
   * and appearance dictionaries for all widget annotations in the document
   * @remarks Deprecated in PDF 2.0
   * @note Appearance streams are required in PDF 2.0. 
   */
  @objects.PDFBooleanField("NeedAppearances", true, false)
  public needAppearances!: boolean;
  
  /**
   * A set of flags specifying various document-level characteristics related 
   * to signature fields
   * @remarks PDF 1.3
   */
  @objects.PDFNumberField("SigFlags", true, 0)
  public SigFlags!: SignatureFlags;
  
  /**
   * An array of indirect references to field dictionaries with calculation actions, 
   * defining the calculation order in which their values will be recalculated
   * when the value of any field changes
   * @remarks 
   * - Required if any fields in the document have additional-actions
   * dictionaries containing a C entry
   * - PDF 1.3
   */
  @objects.PDFArrayField("CO", true)
  public co!: objects.PDFArray | null;
  
  /**
   * A resource dictionary containing default resources (such as fonts,
   * patterns, or colour spaces) that shall be used by form field
   * appearance streams
   */
  @objects.PDFDictionaryField({
    name: "DR",
    type: objects.PDFDictionary,
    optional: true,
  })
  public dr!: objects.PDFDictionary | null;
  
  /**
   * A document-wide default value for the DA attribute of variable text fields
   */
  @objects.PDFLiteralStringField("DA", true)
  public da!: string | null;
  
  /**
   * A document-wide default value for the Q attribute 
   * of variable text fields
   */
  @objects.PDFNumberField("Q", true)
  public q!: number | null;
  
  /**
   * A stream or array containing an XFA resource, 
   * whose format shall be described by the Data Package
   * (XDP) Specification
   * @remarks Deprecated in PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "XFA",
    optional: true,
  })
  public xfa!: objects.PDFArray | objects.PDFStream | null;

  protected override onCreate(): void {
    super.onCreate();

    this.Fields = this.getDocument().createArray();
  }

  public findFieldByGroup(type: string, group: string): PDFField | null {
    const field = this.Fields.items.find(o => {
        if (o instanceof PDFField) {
          if (o.ft === type && o.t.text === group) {
            return o;
          }
        }
    });
    if (field && field instanceof PDFField) {
      return field;
    }

    return null;
  }

  public addField(field: IFieldDictionary): void {
    this.Fields.push(field.makeIndirect());
  }

}
