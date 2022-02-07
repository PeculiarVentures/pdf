import * as core from "@peculiarventures/pdf-core";
import { RadioButtonGroup } from "./Form";
import { CheckBoxHandler, ICheckBoxCreateParameters, ICheckBoxHandler, ICheckBoxParameters } from "./CheckBoxHandler";
import { IFormComponentParameters } from "./FormComponentHandler";
import { FormObject } from "./FormObject";

export interface IRadioButtonCreateParameters extends ICheckBoxCreateParameters {
  value: string;
  group?: string;
}

export interface IRadioButtonParameters extends ICheckBoxParameters {
  value: string;
  group: string;
}

export interface IRadioButtonHandler extends ICheckBoxHandler {
  create(params: IRadioButtonCreateParameters): core.WidgetDictionary
}

export class RadioButtonHandler extends CheckBoxHandler implements IRadioButtonHandler {

  /**
   * Point size in percents. Should be from 0 to 1
   */
  public POINT_SIZE = 0.5;

  public override getParameters(params: IRadioButtonCreateParameters): IRadioButtonParameters {
    return {
      ...super.getParameters(params),
      value: params.value,
      group: params.group || core.UUID.generate(),
    };
  }

  public createGroup(name: string): RadioButtonGroup {
    const field = core.ButtonDictionary.create(this.document.target.update);
    field.ft = "Btn";
    field.ff = core.ButtonFlags.radio;
    field.t = this.document.target.createString(name);

    this.document.target.update.catalog!.AcroForm.get().Fields.push(field.makeIndirect());

    return new RadioButtonGroup(field, this.document);
  }

  public getOrCreateGroup(name: string): RadioButtonGroup {
    let group = this.document.getComponentByName(name);
    if (!group) {
      // Create new group
      group = this.createGroup(name);
    }
    
    if (!(group instanceof RadioButtonGroup)) {
      throw new TypeError(`Cannot set RadioBaton to the group '${name}'. Group is not a RadioButtonGroup component.`);
    }

    return group;
  }

  protected override createWidget(params: IRadioButtonParameters): core.WidgetDictionary {
    const update = this.document.target.update;

    // Create radio button widget
    const widget = core.WidgetDictionary.create(update);
    this.fillWidget(widget, params);

    return widget;
  }

  protected override fillField(field: core.IFieldDictionary, params: IRadioButtonParameters): void {
    if (params.enabled) {
      field.V = this.document.target.createName(params.value);
    }
  }

  public override drawCheck(object: FormObject, params: IFormComponentParameters): void {
    const size = (((params.width - params.height) > 0 ? params.height : params.width) - params.borderWidth * 2) * this.POINT_SIZE;

    object.graphics()
      .fillColor(params.foreColor)
      .circle(params.width / 2, params.height / 2, size / 2)
      .fill();
  }

  public override drawBox(object: FormObject, params: IFormComponentParameters): void {
    const size = (params.width - params.height) > 0 ? params.height : params.width;

    object.graphics()
      // draw background
      .fillColor(params.backgroundColor)
      .circle(params.width / 2, params.height / 2, size / 2)
      .fill()
      // draw border
      .strokeColor(params.borderColor)
      .lineWidth(params.borderWidth)
      .circle(params.width / 2, params.height / 2, (size - params.borderWidth) / 2)
      .stroke(true);
  }

  public override create(params: IRadioButtonCreateParameters): core.WidgetDictionary {
    return super.create(params);
  }

}
