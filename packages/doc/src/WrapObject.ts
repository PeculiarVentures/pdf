import type { PDFDictionary } from "@PeculiarVentures/pdf-core";
import type { PDFDocument } from "./Document";

export class WrapObject<T extends PDFDictionary> {
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
