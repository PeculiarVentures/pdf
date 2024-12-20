import * as core from "@peculiarventures/pdf-core";
import { IRadioButtonHandler } from "./RadioButton.Handler";
import { CheckBox } from "./CheckBox";
import { RadioButtonGroup } from "./RadioButton.Group";
import { IFormGroupedComponent } from "./FormComponent.Group";

export class RadioButton extends CheckBox implements IFormGroupedComponent {
  public override get checked(): boolean {
    return super.checked;
  }

  public override set checked(v: boolean) {
    if (v !== this.checked) {
      const group = this.findGroup();

      // Change Widget appearance state
      const stateName = v ? this.getYesStateName() : "Off";
      this.target.as = stateName;

      // Update filed
      if (group && group.selected && group.selected !== stateName) {
        // disable prev selected
        try {
          const selected = group.get(group.selected);
          selected.checked = false;
        } catch {
          // ignore: sometimes the selected value of the group does not correspond to a real element
        }
      }

      if (group) {
        // change value
        group.target.V = v ? this.document.target.createName(stateName) : null;
      }
    }
  }

  protected override getHandler(): IRadioButtonHandler {
    return this.document.radioButtonHandler;
  }

  public get groupName(): string | null {
    const group = this.findGroup();

    return group ? group.name : null;
  }

  public set groupName(v: string | null) {
    if (v) {
      const group = this.document.radioButtonHandler.getOrCreateGroup(v);
      group.attach(this);
    }
  }

  public findGroup(): RadioButtonGroup | null {
    const field = this.target.Parent as core.ButtonDictionary;

    if (field) {
      return new RadioButtonGroup(field, this.document);
    }

    return null;
  }
}
