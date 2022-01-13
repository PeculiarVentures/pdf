import * as core from "@PeculiarVentures/pdf-core";
import { SignatureBoxGroup } from "./Form";
import { PDFDocument } from "./Document";
import { FormComponentHandler, IFormComponentCreateParameters, IFormComponentHandler, IFormComponentParameters } from "./FormComponentHandler";

export interface ISignatureBoxCreateParameters extends IFormComponentCreateParameters {
  groupName?: string;
}

export interface ISignatureBoxParameters extends IFormComponentParameters {}

export interface ISignatureBoxHandler extends IFormComponentHandler {
  document: PDFDocument;
  createGroup(name: string): SignatureBoxGroup;
  getOrCreateGroup(name: string): SignatureBoxGroup;
  create(params: ISignatureBoxCreateParameters): core.WidgetDictionary;
}

export class SignatureBoxHandler extends FormComponentHandler implements ISignatureBoxHandler {

  public override DEFAULT_WIDTH = 0;
  public override DEFAULT_HEIGHT = 0;

  public createGroup(name: string): SignatureBoxGroup {
    const field = core.SignatureFiled.create(this.document.target.update);
    field.t = this.document.target.createString(name);

    this.document.target.update.catalog!.AcroForm.get().Fields.push(field.makeIndirect());

    return new SignatureBoxGroup(field, this.document);
  }

  public getOrCreateGroup(name: string): SignatureBoxGroup {
    let group = this.document.getComponentByName(name);
    if (!group) {
      // Create new group
      group = this.createGroup(name);
    }
    
    if (!(group instanceof SignatureBoxGroup)) {
      throw new TypeError(`Component group already exists '${name}'. It doesn't match to SignatureBoxGroup type.`);
    }

    return group;
  }

  public override create(params: ISignatureBoxCreateParameters): core.WidgetDictionary {
    const update = this.document.target.update;

    const p = this.getParameters(params);
    
    const x = p.left;
    const y = p.top - p.height;

    const groupName = params.groupName || core.UUID.generate();
    const group = this.getOrCreateGroup(groupName);

    const widget = core.WidgetDictionary.create(update);
    widget.f = core.AnnotationFlags.print;
    widget.rect.llX = x;
    widget.rect.llY = y;
    widget.rect.urX = x + p.width;
    widget.rect.urY = y + p.height;

    // Assign widget to field
    group.target.Kids.get().push(widget.makeIndirect());
    widget.Parent = group.target.makeIndirect();
    
    const xObj = core.FormDictionary.create(update);
    xObj.bBox.urX = p.width;
    xObj.bBox.urY = -p.height;
    widget.AP.get().N = xObj.makeIndirect();

    return widget;
  }

}
