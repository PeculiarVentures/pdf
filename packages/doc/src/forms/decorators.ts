import * as core from "@peculiar/pdf-core";
import { type FormComponent } from "./FormComponent";

function flag(
  f: core.AnnotationFlags,
  fieldFlag = false,
  repaint = false
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Object.defineProperty(target, propertyKey, {
      get: function (this: FormComponent): boolean {
        let flags = 0;
        if (fieldFlag) {
          const filed = FormComponentFactory.getField(this.target);
          flags = filed.ff;
        } else {
          flags = this.target.f;
        }

        return !!((flags & f) === f);
      },
      set: function (this: FormComponent, v: boolean): void {
        const value = (this as unknown as Record<string | symbol, unknown>)[
          propertyKey
        ];
        if (value === v) {
          return;
        }
        if (v) {
          if (fieldFlag) {
            FormComponentFactory.getField(this.target).ff |= f;
          } else {
            this.target.f |= f;
          }
        } else {
          if (fieldFlag) {
            FormComponentFactory.getField(this.target).ff ^= f;
          } else {
            this.target.f ^= f;
          }
        }
        if (repaint) {
          this.paint();
        }
      }
    });
  };
}

export function fieldFlag(value: number, repaint = false): PropertyDecorator {
  return flag(value, true, repaint);
}
export function annotFlag(value: number, repaint = false): PropertyDecorator {
  return flag(value, false, repaint);
}

import { FormComponentFactory } from "./FormComponent.Factory";
