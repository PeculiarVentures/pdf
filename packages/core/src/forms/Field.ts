import * as objects from "../objects";
import { PDFDictionary } from "../objects";
import { AdditionalActionsDictionary } from "../structure/dictionaries/AdditionalActionsDictionary";
import { UUID } from "../UUID";

export enum FieldFlags {
  /**
   * If set, an interactive PDF processor shall not allow a user to change the 
   * value of the field. Additionally, any associated widget annotations should
   * not interact with the user; that is, they should not respond to mouse clicks
   * nor change their appearance in response to mouse motions. 
   */
  readOnly = 1 << 0,
  /**
   * If set, the field shall have a value at the time it is exported by a submit-form action
   */
  required = 1 << 1,
  /**
   * If set, the field shall not be exported by a submit-form action
   */
  noExport = 1 << 2,
}

export interface IFieldDictionary extends PDFDictionary {
  /**
   * The type of field that this dictionary describes
   */
  ft: string;

  /**
   * The field that is the immediate parent of this one
   */
  Parent: PDFDictionary | null;

  /**
   * An array of indirect references to the immediate children of this field
   */
  Kids: objects.Maybe<objects.PDFArray>;

  /**
   * The partial field name
   */
  t: objects.PDFTextString;

  /**
   * An alternate field name that shall be used in place 
   * of the actual field name wherever the field shall be identified in the
   * user interface (such as in error or status messages referring to the
   * field). This text is also useful when extracting the document’s contents
   * in support of accessibility to users with disabilities or for other
   * purposes
   */
  TU: objects.PDFLiteralString | null;

  /**
   * The mapping name that shall be used when
   * exporting interactive form field data from the document
   */
  tm: objects.PDFLiteralString | null;

  /**
   * A set of flags specifying various characteristics
   * of the field
   */
  ff: FieldFlags | number;

  /**
   * The field’s value, whose format varies depending on the field type
   */
  V: objects.PDFObjectTypes | null;

  /**
   * The default value to which the field reverts when
   * a reset-form action is executed
   */
  dv: objects.PDFObjectTypes | null;

  /**
   * An additional-actions dictionary defining the field’s
   * behavior in response to various trigger events
   */
  aa: AdditionalActionsDictionary | null;
}

export class PDFField extends objects.PDFDictionary implements IFieldDictionary {

  @objects.PDFNameField("FT")
  public ft!: string;

  @objects.PDFDictionaryField({
    name: "Parent",
    type: PDFField,
    optional: true,
    indirect: true,
  })
  public Parent!: PDFField | null;

  @objects.PDFMaybeField("Kids", objects.PDFArray)
  public Kids!: objects.Maybe<objects.PDFArray>;

  @objects.PDFTextStringField("T")
  public t!: objects.PDFTextString;

  @objects.PDFDictionaryField({
    name: "TU",
    type: objects.PDFLiteralString,
    optional: true,
  })
  public TU!: objects.PDFLiteralString | null;

  @objects.PDFDictionaryField({
    name: "TM",
    type: objects.PDFLiteralString,
    optional: true,
  })
  public tm!: objects.PDFLiteralString | null;

  @objects.PDFNumberField("Ff", true, 0)
  public ff!: FieldFlags | number;

  @objects.PDFDictionaryField({
    name: "V",
    optional: true,
  })
  public V!: objects.PDFObjectTypes | null;

  @objects.PDFDictionaryField({
    name: "DV",
    optional: true,
  })
  public dv!: objects.PDFObjectTypes | null;

  @objects.PDFDictionaryField({
    name: "AA",
    type: AdditionalActionsDictionary,
    optional: true,
  })
  public aa!: AdditionalActionsDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();
    this.ft = "";
    this.t = document.createString(UUID.generate());
  }

  public addKid(kid: IFieldDictionary): void {
    this.modify().Kids.get().push(kid.makeIndirect());
    kid.Parent = this.makeIndirect();
  }

}
