import type * as core from "@peculiarventures/pdf-core";
import type { PDFDocument } from "./Document";

export class WrapObject<T extends core.PDFDictionary> {
  public readonly target: T;
  public readonly document: PDFDocument;

  constructor(target: T, document: PDFDocument) {
    this.target = target;
    this.document = document;
  }

  public get id(): number {
    return this.target.getIndirect().id;
  }
}
