import * as core from "@peculiarventures/pdf-core";
import { FormObject } from "../FormObject";
import { FormComponent } from "./FormComponent";
import { IFormGroupedComponent } from "./FormComponent.Group";
import { SignatureBoxSignParameters, SignatureBoxGroupVerifyParams, SignatureVerifyResult } from "./SignatureBox.Types";
import { SignatureBoxGroup } from "./SignatureBox.Group";


export class SignatureBox extends FormComponent implements IFormGroupedComponent {

  public get groupName(): string | null {
    return this.getField().getFullName();
  }

  public set groupName(v: string | null) {
    if (v && v !== this.groupName) {
      this.split();

      const group = this.document.signatureBoxHandler.getOrCreateGroup(v);
      group.attach(this);
    }
  }

  public findGroup(): SignatureBoxGroup | null {
    try {
      const field = this.getField();

      return new SignatureBoxGroup(field.to(core.SignatureFiled), this.document);
    } catch (e) {
      return null;
    }
  }

  public getGroup(): SignatureBoxGroup {
    const group = this.findGroup();
    if (!group) {
      throw Error("Cannot sign document. SignatureBox is not assigned to the Signature field.");
    }

    return group;
  }

  public draw(object: FormObject): this {
    const nForm = this.getAppearance();

    nForm.target.modify();
    const gr = nForm
      .clear()
      .graphics();

    const widthScale = this.width / object.width;
    const heightScale = this.height / object.height;
    const scale = Math.min(widthScale, heightScale);
    if (widthScale < heightScale) {
      gr.translate(0, (this.height - (object.height * scale)) / 2);
    } else {
      gr.translate((this.width - (object.width * scale)) / 2, 0);
    }
    gr
      .scale(scale, scale)
      .drawObject(object);

    return this;
  }

  public async sign(params: SignatureBoxSignParameters): Promise<SignatureBoxGroup> {
    const group = this.getGroup();

    return group.sign(params);
  }

  public async verify(params?: SignatureBoxGroupVerifyParams): Promise<SignatureVerifyResult> {
    const group = this.getGroup();

    return group.verify(params);
  }

  protected getAppearance(): FormObject {
    const update = this.target.documentUpdate!;
    const ap = this.target.AP.get();
    if (!ap.has("N")) {
      // If AP created by get() function it doesn't have a required filed N
      const formDict = core.FormDictionary.create(update);

      // Update BBox to match widget size
      formDict.bBox = core.PDFRectangle.createWithData(update, 0, 0, this.width, this.height);

      ap.N = formDict.makeIndirect();
    }
    const formDict = (ap.N instanceof core.PDFStream)
      ? ap.N.to(core.FormDictionary, true)
      : core.FormDictionary.create(update).makeIndirect();

    return new FormObject(formDict, this.document);
  }

  protected override onWidthChanged(): void {
    this.onSizeChange();
  }

  protected override onHeightChanged(): void {
    this.onSizeChange();
  }

  protected onSizeChange(): void {
    const n = this.getAppearance();
    n.width = this.width;
    n.height = -this.height;
  }

  /**
   * Check if the widget is single widget (Field + Widget)
   * @returns true if the widget is single widget
   */
  public isSingleWidget(): boolean {
    return this.target.has("FT");
  }

  /**
   * Split single widget (Field + Widget) into Widget and Field with Kids
   * @returns new group
   * @remarks
   * This function is used to split single widget (Field + Widget) into Widget and Field with Kids,
   * if the widget is already a part of the group, it will return the group.
   */
  public split(): SignatureBoxGroup {
    if (!this.isSingleWidget()) {
      return this.getGroup();
    }

    const singleWidget = this.target.to(core.SingleWidgetDictionary);

    // The group already exists, and it is Field + Widget
    // Split it by creating new group and moving widget to it
    const doc = this.document.target;
    const newField = core.SignatureFiled.create(doc.update)
      .makeIndirect();

    // remove previous widget from Kids
    if (!singleWidget.Parent) {
      throw new Error("SingleWidgetDictionary.Parent should be defined");
    }
    const kids = singleWidget.Parent.Kids.get();
    const index = kids.indexOf(singleWidget);
    kids.splice(index, 1);

    // Move fields from old to new and remove from old
    const fieldNames = [
      "FT", "Parent", "Kids", "T", "TU", "TM", "Ff", "V", "DV", "AA", // Field
      "V", "Lock", "SV", // SigField
    ];
    for (const [key, value] of singleWidget.items) {
      if (fieldNames.includes(key)) {
        newField.items.set(key, value);
        singleWidget.delete(key);
      }
    }

    kids.push(newField);
    newField.addKid(singleWidget);

    return new SignatureBoxGroup(newField, this.document);
  }

  public override delete(): void {
    super.delete();

    // if field has no kids, delete it
    const field = this.getField();
    if (!field.Kids.has() || field.Kids.get().length === 0) {
      field.remove();
    }

    // if document doesn't have any signature fields, remove remove SigFlags
    const signatures = this.document.getSignatures();
    if (signatures.length === 0) {
      const maybeAcroForm = this.document.target.update.catalog!.AcroForm;
      if (maybeAcroForm.has()) {
        const acroForm = maybeAcroForm.get();
        acroForm.delete("SigFlags");
      }
    }
  }

}
