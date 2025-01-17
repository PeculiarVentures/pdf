import * as core from "@peculiar/pdf-core";
import { RadioButton } from "./RadioButton";
import { FormComponentGroup } from "./FormComponent.Group";

export class RadioButtonGroup extends FormComponentGroup<
  core.ButtonDictionary,
  RadioButton
> {
  public override get(index: number): RadioButton;
  public override get(name: string): RadioButton;
  public override get(id: number | string): RadioButton {
    if (this.length) {
      if (typeof id === "number") {
        return super.get(id);
      } else {
        for (const item of this) {
          if (id === item.value) {
            return item;
          }
        }
      }

      throw new Error("Cannot load RadioButton component from PDF Widget.");
    }

    throw new RangeError("PDF Array is empty");
  }

  protected override onDetach(item: RadioButton): void {
    item.checked = false;
  }

  public get selected(): string | null {
    if (this.target.V instanceof core.PDFName) {
      return this.target.V.text;
    }

    return null;
  }

  public set selected(v: string | null) {
    if (v !== this.selected) {
      if (v === null) {
        if (this.selected) {
          try {
            const selected = this.get(this.selected);
            selected.checked = false;
          } catch {
            // ignore: sometimes the selected value of the group does not correspond to a real element
          }
        }
        this.target.V = null;
      } else {
        const selected = this.get(v);
        selected.checked = true;
      }
    }
  }
}
