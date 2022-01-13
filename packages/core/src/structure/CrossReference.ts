import type { PDFDocumentUpdate } from "./DocumentUpdate";
import type { PDFTextString } from "../objects/TextString";
import type { CatalogDictionary } from "./dictionaries/Catalog";
import type { EncryptDictionary } from "./dictionaries/Encrypt";
import type { PDFDocumentObject } from "./DocumentObject";

export interface CrossReference {
  addObject(obj: PDFDocumentObject): void;
  objects: ReadonlyArray<PDFDocumentObject>;
  Encrypt: EncryptDictionary | null;
  ID: PDFTextString[] | null;
  Root: CatalogDictionary | null;
  Prev: number | null;
  Size: number
  documentUpdate: PDFDocumentUpdate | null;
}
