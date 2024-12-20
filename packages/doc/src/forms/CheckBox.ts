import * as core from "@peculiarventures/pdf-core";
import { ICheckBoxHandler } from "./CheckBox.Handler";
import { IFormComponentParameters } from "./FormComponent.Handler";
import { FormObject } from "../FormObject";
import { FormComponent } from "./FormComponent";

export class CheckBox extends FormComponent {
  public get checked(): boolean {
    return this.target.as !== "Off";
  }

  public set checked(v: boolean) {
    if (this.checked !== v) {
      const stateName = v ? this.getYesStateName() : "Off";
      const field = this.getField();
      if (field.has("V")) {
        field.set("V", this.document.target.createString(stateName));
      }
      this.target.as = stateName;
    }

    this.paint();
  }

  public get value(): string {
    return this.getYesStateName();
  }

  protected override onWidthChanged(): void {
    this.paint();
  }

  protected override onHeightChanged(): void {
    this.paint();
  }

  protected override onBorderWidthChanged(): void {
    this.paint();
  }

  protected override onBorderColorChanged(): void {
    this.paint();
  }

  protected override onBackgroundColorChanged(): void {
    this.paint();
  }

  protected override onForeColorChanged(): void {
    this.paint();
  }

  protected getHandler(): ICheckBoxHandler {
    return this.document.checkBoxHandler;
  }

  public override paint(): void {
    const ap = this.target.AP.get(true);
    if (ap.N instanceof core.PDFDictionary) {
      for (const [key] of ap.N.items) {
        const state = ap.N.get(key);
        if (state instanceof core.PDFStream) {
          const formDict = state.to(core.FormDictionary, true);
          const form = new FormObject(formDict, this.document);

          // change BBox
          form.width = this.width;
          form.height = this.height;

          // draw content
          const params: IFormComponentParameters = {
            name: this.name,
            left: this.left,
            top: this.top,
            height: this.height,
            width: this.width,
            foreColor: this.foreColor,
            backgroundColor: this.backgroundColor,
            borderColor: this.borderColor,
            borderWidth: this.borderWidth
          };
          const handler = this.getHandler();
          form.clear();
          if (key === "Off") {
            // TODO stream setting must refresh encoding and cached view
            handler.drawOff(form, params);
          } else {
            handler.drawOn(form, params);
          }
        }
      }
    }
  }

  /**
   * Gets name of the Yes state from Appearance dictionary
   */
  protected getYesStateName(): string {
    const ap = this.target.AP.get(true);
    if (ap.N instanceof core.PDFDictionary) {
      for (const [key] of ap.N.items) {
        if (key !== "Off") {
          return key;
        }
      }
      throw new Error("Cannot get Yes state");
    } else {
      throw new Error("Unsupported type of N field");
    }
  }
}
