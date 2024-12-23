import { IFieldDictionary, PDFField } from "../../forms";
import * as objects from "../../objects";
import { ResourceDictionary } from "./ResourceDictionary";

/**
 * Finds a field in this form by its fully qualified name.
 * @param fields - A list of fields to search through.
 * @param name - The fully qualified name of the field to find.
 * @returns The field with the fully qualified name, or `null`
 */
function findFieldInList(
  fields: objects.PDFArray,
  name: string
): PDFField | null {
  for (const item of fields) {
    if (!(item instanceof objects.PDFDictionary)) {
      continue;
    }

    const field = item.to(PDFField);
    if (!field.has("T")) {
      continue;
    }

    const fullName = field.getFullName();
    if (fullName === name) {
      return field;
    }

    if (name.startsWith(fullName) && field.has("Kids")) {
      const kids = field.get("Kids", objects.PDFArray);
      const result = findFieldInList(kids, name);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

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
  appendOnly = 2
}

export class InteractiveFormDictionary extends objects.PDFDictionary {
  /**
   * An array of references to the document’s root fields (those with no ancestors in the field hierarchy).
   */
  @objects.PDFDictionaryField({
    name: "Fields",
    type: objects.PDFArray
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
   * patterns, or color spaces) that shall be used by form field
   * appearance streams
   */
  @objects.PDFMaybeField("DR", ResourceDictionary)
  public DR!: objects.Maybe<ResourceDictionary>;

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
    optional: true
  })
  public xfa!: objects.PDFArray | objects.PDFStream | null;

  protected override onCreate(): void {
    super.onCreate();

    this.Fields = this.getDocument().createArray();
  }

  public findFieldByGroup(type: string, group: string): PDFField | null {
    const field = this.Fields.items.find((o) => {
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

  /**
   * Adds a field to this form.
   * @param field - The field to be added.
   * @remarks The field is added to the form's `Fields` array. If the field is
   * not already indirect, this method will make it indirect. If the field is
   * already part of a form, this method will skip adding it.
   * @returns Whether or not the field was added to the form.
   */
  public addField(field: IFieldDictionary): boolean {
    // make sure the field is indirect
    field.makeIndirect();

    if (field.Parent) {
      // if the field is already part of another field, don't add it
      return false;
    }

    // check if the field is already part of this form
    if (this.Fields.includes(field)) {
      // if so, don't add it again
      return false;
    }

    // add the field to the form
    this.Fields.push(field);

    return true;
  }

  /**
   * Removes a field from this form.
   * @param field - The field to be removed.
   * @returns Whether or not the field was removed from the form.
   */
  public removeField(field: IFieldDictionary): boolean {
    if (!this.Fields.includes(field)) {
      return false;
    }

    const index = this.Fields.indexOf(field);
    this.Fields.splice(index, 1);

    return true;
  }

  /**
   * Finds or creates a field with the given fully qualified name.
   * @param name - The fully qualified name of the field to be found or created.
   * @returns The field with the given name.
   * @remarks If a field already exists with the given name, this method will
   * return that field. Otherwise it will create a new field with that name and
   * add it to the form's `Fields` array. If the name is qualified, intermediate
   * fields will be created as necessary.
   */
  public findOrCreateField(name: string): PDFField {
    // Check if the field already exists.
    const existingField = this.findField(name);
    if (existingField) return existingField;

    const doc = this.getDocument();

    // Split the name into segments.
    const segments = name.split(".");

    // If the name is qualified, we'll potentially need to recurse.
    let parent: PDFField | null = null;
    if (segments.length > 1) {
      const parentName = segments.slice(0, -1).join(".");
      parent = this.findOrCreateField(parentName);
    }

    // Now, create the new field.
    const newField = new PDFField(
      doc.createDictionary([
        "T",
        doc.createString(segments[segments.length - 1])
      ])
    ).makeIndirect();

    // If there's a parent, add the new field to its children.
    if (parent) {
      parent.addKid(newField);
    } else {
      // If there's no parent, then it's a root field, so add it to AcroForm.Fields.
      this.Fields.push(newField);
    }

    return newField;
  }

  /**
   * Finds a field in this form by its fully qualified name.
   * @param name - The fully qualified name of the field to find.
   * @returns The field with the fully qualified name, or `null`
   */
  public findField(name: string): PDFField | null {
    return findFieldInList(this.Fields, name);
  }
}
