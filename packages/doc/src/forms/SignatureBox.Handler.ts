import * as core from "@peculiarventures/pdf-core";
import { SignatureBoxGroup } from "./SignatureBox.Group";
import { PDFDocument } from "../Document";
import {
  FormComponentHandler,
  IFormComponentCreateParameters,
  IFormComponentHandler,
  IFormComponentParameters
} from "./FormComponent.Handler";
import { SignatureBox } from "./SignatureBox";

export interface ISignatureBoxCreateParameters
  extends IFormComponentCreateParameters {
  groupName?: string;
}

export type ISignatureBoxParameters = IFormComponentParameters;

export interface ISignatureBoxHandler extends IFormComponentHandler {
  document: PDFDocument;
  /**
   * Gets or creates a signature box group.
   * @param name - The name of the group.
   * @returns The group.
   */
  getOrCreateGroup(name: string): SignatureBoxGroup;
  create(params: ISignatureBoxCreateParameters): core.WidgetDictionary;
}

export class SignatureBoxHandler
  extends FormComponentHandler
  implements ISignatureBoxHandler
{
  public override DEFAULT_WIDTH = 0;
  public override DEFAULT_HEIGHT = 0;

  private createGroup(name: string): SignatureBoxGroup {
    const field = this.getAcroForm().findOrCreateField(name);

    if (field.has("FT")) {
      if (field.t.text !== "Sig") {
        throw new TypeError(
          `Field '${name}' already exists and it's not a signature field.`
        );
      }
    } else {
      // Create signature field
      field.set("FT", this.document.target.createName("Sig"));
    }

    return new SignatureBoxGroup(field.to(core.SignatureField), this.document);
  }

  public getOrCreateGroup(name: string): SignatureBoxGroup {
    let group = this.document.getComponentByName(name);
    if (!group) {
      // Create new group
      group = this.createGroup(name);
    } else if (group instanceof SignatureBox) {
      group = group.split();
    }

    if (!(group instanceof SignatureBoxGroup)) {
      throw new TypeError(
        `Component group already exists '${name}'. It doesn't match to SignatureBoxGroup type.`
      );
    }

    return group;
  }

  public override create(
    params: ISignatureBoxCreateParameters
  ): core.WidgetDictionary {
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

    if (
      widget.rect.llX === 0 &&
      widget.rect.llY === 0 &&
      widget.rect.urX === 0 &&
      widget.rect.urY === 0
    ) {
      // invisible signature
      return widget;
    }

    const xObj = core.FormDictionary.create(update);
    xObj.bBox.urX = p.width;
    xObj.bBox.urY = -p.height;
    widget.AP.get().N = xObj.makeIndirect();

    return widget;
  }
}
