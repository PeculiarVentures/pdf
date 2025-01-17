import * as core from "@peculiar/pdf-core";
import { WrapObject } from "../WrapObject";
import { IComponent } from "./IComponent";
import { FormComponent } from "./FormComponent";
import { FormComponentFactory } from "./FormComponent.Factory";

export interface IFormGroupedComponent extends IComponent {
  target: core.WidgetDictionary;
  groupName: string | null;
  findGroup(): FormComponentGroup | null;
}

export class FormComponentGroup<
    TTarget extends core.PDFField = core.PDFField,
    TItem extends IFormGroupedComponent = IFormGroupedComponent
  >
  extends WrapObject<TTarget>
  implements IComponent, Iterable<TItem>
{
  private get acroFormFields(): core.PDFArray {
    const fields = this.target.documentUpdate?.catalog?.AcroForm.get().Fields;
    if (!fields) {
      throw new Error("Cannot find AcroForm.Fields");
    }

    return fields;
  }

  [Symbol.iterator](): Iterator<TItem, unknown, undefined> {
    let pointer = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    const items = this.target.Kids.has()
      ? this.target.Kids.get()
      : this.document.target.createArray(this.target);

    return {
      next(): IteratorResult<TItem> {
        if (pointer < items.length) {
          return {
            done: false,
            value: _this.get(pointer++)
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }

  public delete(): void {
    // Remove this Field from Parent or AcroForm
    const parent = this.target.Parent;
    if (parent) {
      // Remove from parent
      if (parent.Kids.has()) {
        const kids = parent.Kids.get();
        const index = kids.indexOf(this.target);
        if (index > -1) {
          kids.splice(index, 1);
        }
      }
    } else {
      // Remove from AcroForm
      const fields = this.acroFormFields;
      const index = fields.indexOf(this.target);
      if (index > -1) {
        fields.splice(index, 1);
      }
    }
  }

  public get(index: number): TItem {
    if (this.target.Kids.has()) {
      const kids = this.target.Kids.get();

      const component = FormComponentFactory.create(
        kids.get(index, core.WidgetDictionary, true),
        this.document
      );
      if (component instanceof FormComponent) {
        return component as unknown as TItem;
      }

      throw new Error("Cannot load form component from PDF Widget.");
    } else {
      // convert this target to WidgetDictionary
      const widget = this.target.to(core.WidgetDictionary);
      const component = FormComponentFactory.create(widget, this.document);
      if (component instanceof FormComponent) {
        return component as unknown as TItem;
      }

      throw new Error("Cannot load form component from PDF Widget.");
    }
  }

  public attach(item: TItem): void {
    if (item.groupName === this.name) {
      // item is already in the group
      return;
    }

    if (item.groupName && item.groupName !== this.name) {
      // Detach item from the another group
      const prevGroup = item.findGroup();
      if (prevGroup) {
        prevGroup.detach(item);
      }
    }

    // Attach to the current group
    const kids = this.target.Kids.get();
    kids.push(item.target.makeIndirect());
    item.target.Parent = this.target;

    // Add to AcroForm if needed
    if (!this.target.Parent) {
      const fields = this.acroFormFields;
      if (fields.indexOf(this.target) === -1) {
        fields.push(this.target.makeIndirect());
      }
    }
  }

  public indexOf(item: TItem): number {
    if (item.groupName === this.name) {
      const kids = this.target.Kids.get();
      for (let i = 0; i < kids.length; i++) {
        const kid = kids.get(i);
        if (item.target.equal(kid)) {
          return i;
        }
      }
    }

    return -1;
  }

  public detach(item: TItem): boolean {
    const index = this.indexOf(item);

    if (index > -1) {
      const itemComponent = this.get(index);

      this.onDetach(itemComponent);

      this.target.Kids.get().splice(index, 1);
      item.target.Parent = null;

      if (!this.length) {
        // Remove empty Filed from AcroForm
        this.delete();
      }

      return true;
    }

    return false;
  }

  protected onDetach(_item: TItem): void {
    // nothing
  }

  public get length(): number {
    if (this.target.Kids.has()) {
      return this.target.Kids.get().length;
    }

    return 0;
  }

  public get name(): string {
    return this.target.getFullName();
  }
}
