import * as core from "@peculiarventures/pdf-core";
import type { PDFDocument } from "../Document";

export interface IComponent {
  readonly target: core.PDFDictionary;
  readonly name: string;
  delete(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IComponentConstructor<T extends IComponent> = new (
  target: any,
  document: PDFDocument
) => T;
