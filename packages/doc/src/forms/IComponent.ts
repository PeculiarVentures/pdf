import * as core from "@peculiar/pdf-core";
import type { PDFDocument } from "../Document";

export interface IComponent {
  readonly target: core.PDFDictionary;
  readonly name: string;
  delete(): void;
}

export type IComponentConstructor<T extends IComponent> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  document: PDFDocument
) => T;
