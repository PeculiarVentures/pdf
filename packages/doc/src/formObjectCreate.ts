import * as core from "@peculiar/pdf-core";
import type { PDFDocument } from "./Document";
import type { FormObject } from "./FormObject";

type FormObjectCtor = typeof FormObject;

let FormObjectClass: FormObjectCtor | undefined;

export function registerFormObjectClass(ctor: FormObjectCtor): void {
  FormObjectClass = ctor;
}

export function createFormObject(document: PDFDocument, width: core.TypographySize = 0, height: core.TypographySize = 0): FormObject {
  if (!FormObjectClass) {
    throw new Error("FormObject is not registered yet");
  }

  const formDict = core.FormDictionary.create(document.target.update).makeIndirect();

  formDict.bBox.llX = 0;
  formDict.bBox.llY = 0;
  formDict.bBox.urX = core.TypographyConverter.toPoint(width);
  formDict.bBox.urY = -core.TypographyConverter.toPoint(height);

  return new FormObjectClass(formDict, document);
}
