import * as objects from "../objects";
import { PDFDictionary } from "../objects";
import type { WidgetDictionary } from "../structure/dictionaries/Widget";
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
  noExport = 1 << 2
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

export class PDFField
  extends objects.PDFDictionary
  implements IFieldDictionary
{
  /**
   * The type of field that this dictionary describes
   *
   * - Btn Button (see 12.7.5.2, "Button fields")
   * - Tx Text (see 12.7.5.3, "Text fields")
   * - Ch Choice (see 12.7.5.4, "Choice fields")
   * - Sig (PDF 1.3) Signature (see 12.7.5.5, "Signature fields")
   */
  @objects.PDFNameField("FT")
  public ft!: string;

  /**
   * The field that is the immediate parent of this one
   *
   * Required if this field is the child of another in the field hierarchy; absent otherwise
   */
  @objects.PDFDictionaryField({
    name: "Parent",
    type: PDFField,
    optional: true,
    indirect: true
  })
  public Parent!: PDFField | null;

  /**
   * An array of indirect references to the immediate children of this field
   */
  @objects.PDFMaybeField("Kids", objects.PDFArray)
  public Kids!: objects.Maybe<objects.PDFArray>;

  /**
   * The partial field name
   */
  @objects.PDFTextStringField("T")
  public t!: objects.PDFTextString;

  /**
   * An alternative field name that shall be used in place of the actual field name wherever the field shall be identified in the user interface
   */
  @objects.PDFDictionaryField({
    name: "TU",
    type: objects.PDFLiteralString,
    optional: true
  })
  public TU!: objects.PDFLiteralString | null;

  /**
   * The mapping name that shall be used when exporting interactive form field data from the document
   */
  @objects.PDFDictionaryField({
    name: "TM",
    type: objects.PDFLiteralString,
    optional: true
  })
  public tm!: objects.PDFLiteralString | null;

  /**
   * A set of flags specifying various characteristics of the field. Default is 0
   */
  @objects.PDFNumberField("Ff", true, 0)
  public ff!: FieldFlags | number;

  /**
   * The field’s value, whose format varies depending on the field type
   */
  @objects.PDFDictionaryField({
    name: "V",
    optional: true
  })
  public V!: objects.PDFObjectTypes | null;

  /**
   * The default value to which the field reverts when a reset-form action is executed
   */
  @objects.PDFDictionaryField({
    name: "DV",
    optional: true
  })
  public dv!: objects.PDFObjectTypes | null;

  /**
   * An additional-actions dictionary defining the field’s behavior in response to various trigger events
   */
  @objects.PDFDictionaryField({
    name: "AA",
    type: AdditionalActionsDictionary,
    optional: true
  })
  public aa!: AdditionalActionsDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();
    this.ft = "";
    this.t = document.createString(UUID.generate());
  }

  /**
   * Adds a new kid to this field. This operation can only be performed if this
   * field is a non-terminal node in the field hierarchy (e.g. a non-terminal
   * widget annotation).
   * @param kid
   */
  public addKid(kid: IFieldDictionary | WidgetDictionary): boolean {
    // check if kid is already a kid of this field
    if (this.Kids.has() && this.Kids.get().includes(kid)) {
      return false;
    }

    // kid must be indirect
    kid.makeIndirect();

    // check if kid already has a parent
    if (kid.Parent) {
      // if kid already has a parent, remove it from that parent
      kid.Parent.to(PDFField).removeKid(kid);
    } else {
      const acroForm = this.getDocumentUpdate().catalog!.AcroForm.get();
      const index = acroForm.Fields.indexOf(kid);
      if (index >= 0) {
        // if kid is already part of AcroForm.Fields, remove it
        acroForm.Fields.splice(index, 1);
      }
    }

    // add kid to Kids array
    this.Kids.get().push(kid);

    // set kid's Parent to this field
    kid.Parent = this.makeIndirect();

    return true;
  }

  public removeKid(kid: IFieldDictionary | WidgetDictionary): boolean {
    if (!this.Kids.has()) return false;

    const kids = this.Kids.get();
    const index = kids.indexOf(kid);
    if (index >= 0) {
      // remove kid from Kids array
      kids.splice(index, 1);

      // remove kid's Parent
      kid.delete("Parent");

      return true;
    }

    return false;
  }

  /**
   * Returns the full name of this field.
   * @returns The full name of this field.
   */
  public getFullName(): string {
    const parts = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let field: PDFField | null = this;
    while (field) {
      parts.unshift(field.t.text);
      field = field.Parent;
    }

    return parts.join(".");
  }

  /**
   * Remove this field from its parent. This operation can only be performed if
   * this field has a parent.
   */
  public removeFromParent(): boolean {
    const parent = this.Parent;
    if (parent) {
      parent.modify();
      const kids = parent.Kids.get();
      const index = kids.indexOf(this);
      if (index >= 0) {
        kids.splice(index, 1);
        this.delete("Parent");

        return true;
      }
    } else {
      const acroForm = this.getDocumentUpdate().catalog!.AcroForm.get();
      const index = acroForm.Fields.indexOf(this);
      if (index >= 0) {
        acroForm.Fields.splice(index, 1);

        return true;
      }
    }

    return false;
  }
}
