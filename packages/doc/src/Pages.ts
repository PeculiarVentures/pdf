import * as copy from "@peculiarventures/pdf-copy";
import * as core from "@peculiarventures/pdf-core";
import { type PDFDocument } from "./Document";
import { PDFPage } from "./Page";
import { WrapObject } from "./WrapObject";

export enum PDFPageOrientation {
  portrait,
  landscape,
}

export interface PDFPagesCreateParameters {
  orientation?: PDFPageOrientation;
  width?: core.TypographySize;
  height?: core.TypographySize;
}

export class PDFPages extends WrapObject<core.PageTreeNodesDictionary> {

  [Symbol.iterator](): Iterator<PDFPage, unknown, undefined> {
    let pointer = 0;
    const pages = this.target.getPages();
    const doc = this.document;

    return {
      next(): IteratorResult<PDFPage> {
        if (pointer < pages.length) {
          return {
            done: false,
            value: new PDFPage(pages[pointer++], doc),
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

  public get length(): number {
    return this.target.getPages().length;
  }

  public find(index: number): PDFPage | null {
    const page = this.target.getPages()[index];
    if (page) {
      return new PDFPage(page, this.document);
    }

    return null;
  }

  /**
   * Returns page by index
   * @param index Page index
   */
  public get(index: number): PDFPage {
    const page = this.find(index);
    if (!page) {
      throw new Error(`Page by index ${index} not found`);
    }

    return page;
  }

  public create({
    orientation = PDFPageOrientation.portrait,
    width = "210mm",
    height = "297mm",
  }: PDFPagesCreateParameters = {}): PDFPage {
    const page = core.PageObjectDictionary.create(this.target.documentUpdate!);

    page.MediaBox = orientation === PDFPageOrientation.portrait
      ? page.createMediaBox(width, height)
      : page.createMediaBox(height, width);

    this.target.addPage(page);

    return new PDFPage(page, this.document);
  }

  public indexOf(page: PDFPage): number {
    return this.target.getPages().indexOf(page.target);
  }

  public insertBefore(newPage: PDFPage, refPage = this.last()): void {
    this.target.insertBefore(newPage.target, refPage?.target);
  }

  public remove(page: PDFPage | number): void {
    this.target.remove((typeof page === "number")
      ? page
      : page.target);
  }

  public first(): PDFPage | null {
    return this.find(0);
  }

  public last(): PDFPage | null {
    const pages = this.target.getPages();
    const last = pages[pages.length - 1];

    return last
      ? new PDFPage(last, this.document)
      : null;
  }

  /**
   * Appends the pages from the specified PDF document into this document.
   *
   * @remarks
   * This method will add all pages from the specified document, or a subset of pages
   * depending on the parameters provided. It adds the pages to the end of the
   * document.
   *
   * @param doc The PDF document from which to copy the pages.
   * @param params An object specifying options for the merge operation.
   * @returns A Promise that resolves when the merge operation is complete.
   */
  public async append(doc: PDFDocument, params?: copy.PDFCopierAppendParams): Promise<void> {
    const copier = await copy.PDFCopier.create(this.document.target);

    copier.append(doc.target, params);
  }

}
