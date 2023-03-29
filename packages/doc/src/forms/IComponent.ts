import type { PDFDocument } from "../Document";


export interface IComponent {
  readonly name: string;
  delete(): void;
}

export type IComponentConstructor<T extends IComponent> = new (target: any, document: PDFDocument) => T;
