import * as core from "@peculiar/pdf-core";
import {
  FormComponentHandler,
  IFormComponentCreateParameters,
  IFormComponentHandler,
  IFormComponentParameters
} from "./FormComponent.Handler";
import { FormObject } from "../FormObject";

export interface ICheckBoxCreateParameters
  extends IFormComponentCreateParameters {
  enabled?: boolean;
  value?: string;
}

export interface ICheckBoxParameters extends IFormComponentParameters {
  enabled: boolean;
  value: string;
}

export interface ICheckBoxHandler extends IFormComponentHandler {
  create(params: ICheckBoxCreateParameters): core.WidgetDictionary;
  drawOn(content: FormObject, params: IFormComponentParameters): void;
  drawOff(content: FormObject, params: IFormComponentParameters): void;
}

export class CheckBoxHandler
  extends FormComponentHandler
  implements ICheckBoxHandler
{
  public ON_STATE_NAME = "Yes";
  public OFF_STATE_NAME = "Off";

  public drawBox(object: FormObject, params: IFormComponentParameters): void {
    const borderHalf = params.borderWidth / 2;
    const xPt = borderHalf;
    const yPt = borderHalf;
    const widthPt = params.width - params.borderWidth;
    const heightPt = params.height - params.borderWidth;

    const graphics = object.graphics();

    // Draw background
    graphics
      .fillColor(params.backgroundColor)
      .rect(xPt, yPt, widthPt, heightPt)
      .fill();

    if (params.borderWidth) {
      // Draw border
      graphics
        .strokeColor(params.borderColor)
        .lineWidth(params.borderWidth)
        .rect(xPt, yPt, widthPt, heightPt)
        .stroke();
    }
  }

  public override getParameters(
    params: ICheckBoxCreateParameters
  ): ICheckBoxParameters {
    return {
      ...super.getParameters(params),
      enabled: params.enabled || false,
      value: params.value || this.ON_STATE_NAME
    };
  }

  public drawCheck(object: FormObject, params: IFormComponentParameters): void {
    const size =
      params.width - params.height > 0
        ? params.height - params.borderWidth * 2
        : params.width - params.borderWidth * 2;
    const x = (params.width - size) / 2;
    const y = (params.height - size) / 2;
    const lineWidth = params.borderWidth || 1;

    object
      .graphics()
      .strokeColor(params.foreColor)
      .lineWidth(lineWidth)
      .pathTo(x + size / 4, y + size / 2)
      .pathLine(x + size / 2, y + size * 0.8)
      .pathLine(x + size / 1.3, y + size * 0.13)
      .stroke();
  }

  protected createWidget(params: ICheckBoxParameters): core.WidgetDictionary {
    const update = this.document.target.update;

    const widget = core.SingleWidgetDictionary.create(update);
    this.fillField(widget, params);
    this.fillWidget(widget, params);

    update.catalog!.AcroForm.get().addField(widget);

    return widget;
  }

  protected fillField(
    field: core.IFieldDictionary,
    params: ICheckBoxParameters
  ): void {
    field.ft = "Btn";
    field.t = this.document.target.createString(params.name);
    const stateName = params.enabled ? params.value : this.OFF_STATE_NAME;
    field.V = this.document.target.createName(stateName);
  }

  protected fillWidget(
    widget: core.WidgetDictionary,
    params: ICheckBoxParameters
  ): void {
    const x = params.left;
    const y = params.top - params.height;

    // holds a name object representing the check box’s appearance state, which shall be used to select the
    // appropriate appearance from the appearance dictionary. The value of the V key shall also be the value
    // of the AS key. If they are not equal, then the value of the AS key shall be used instead of the V key to
    // determine which appearance to use
    widget.as = this.OFF_STATE_NAME;
    widget.rect.llX = x;
    widget.rect.llY = y;
    widget.rect.urX = x + params.width;
    widget.rect.urY = y + params.height;

    this.setStyle(widget, params);

    const on = this.createOnState(params);
    const off = this.createOffState(params);

    widget.AP.get().N = this.document.target.createDictionary(
      [params.value, on.target.makeIndirect()],
      [this.OFF_STATE_NAME, off.target.makeIndirect()]
    );
  }

  public create(params: ICheckBoxCreateParameters): core.WidgetDictionary {
    const p = this.getParameters(params);
    const widget = this.createWidget(p);

    return widget;
  }

  public createOnState(params: IFormComponentParameters): FormObject {
    const obj = FormObject.create(this.document, params.width, params.height);

    // Draw
    this.drawOn(obj, params);

    return obj;
  }

  public createOffState(params: IFormComponentParameters): FormObject {
    const obj = FormObject.create(this.document, params.width, params.height);

    // Draw
    this.drawOff(obj, params);

    return obj;
  }

  public drawOff(object: FormObject, params: IFormComponentParameters): void {
    this.drawBox(object, params);
  }

  public drawOn(object: FormObject, params: IFormComponentParameters): void {
    this.drawBox(object, params);
    this.drawCheck(object, params);
  }

  protected override setFontStyle(
    widget: core.WidgetDictionary,
    params: IFormComponentParameters
  ): void {
    const mk = widget.MK.get();
    // PDF doesn't have field for the fore color annotation. For variable text use DA.
    // If set DA for graphics Acrobat doesn't show images
    const content = new core.PDFContent();
    content.setColor(params.foreColor);
    mk.set("PV_FC", this.document.target.createString(content.toString()));
  }
}
