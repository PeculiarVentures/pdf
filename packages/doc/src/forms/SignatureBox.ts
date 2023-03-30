import * as core from "@peculiarventures/pdf-core";
import { FormObject } from "../FormObject";
import { FormComponent } from "./FormComponent";
import { IFormGroupedComponent } from "./FormComponent.Group";
import { SignatureBoxSignParameters, SignatureBoxGroupVerifyParams, SignatureVerifyResult } from "./SignatureBox.Types";
import { SignatureBoxGroup } from "./SignatureBox.Group";


export class SignatureBox extends FormComponent implements IFormGroupedComponent {

  public get groupName(): string | null {
    const group = this.findGroup();

    return group
      ? group.name
      : null;
  }

  public set groupName(v: string | null) {
    if (v) {
      const group = this.document.signatureBoxHandler.getOrCreateGroup(v);
      group.attach(this);
    }
  }

  public findGroup(): SignatureBoxGroup | null {
    const field = this.target.Parent as core.SignatureFiled;
    if (field) {
      return new SignatureBoxGroup(field, this.document);
    } else if (this.target.has("FT")) {
      // Filed + Widget
      return new SignatureBoxGroup(this.target.to(core.SignatureFiled), this.document);
    }



    return null;
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
    const n = this.target.AP.get().N;
    const formDict = (n instanceof core.PDFStream)
      ? n.to(core.FormDictionary, true)
      : core.FormDictionary.create(this.target.documentUpdate!).makeIndirect();

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

}
