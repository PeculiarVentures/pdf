import * as core from "@peculiarventures/pdf-core";
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

  public get length(): number {
    return this.target.count;
  }

  /**
   * Returns page by page number
   * @param pageNumber Page. Should be from 1 to N
   */
  public get(pageNumber: number): PDFPage {
    const page = this.target.kids.get(pageNumber, core.PageObjectDictionary);

    return new PDFPage(page, this.document);
  }

  public create({
    orientation = PDFPageOrientation.portrait,
    width = "210mm",
    height = "297mm",
  }: PDFPagesCreateParameters = {}): PDFPage {
    const page = core.PageObjectDictionary.create(this.target.documentUpdate!);

    page.mediaBox = orientation === PDFPageOrientation.portrait
      ? page.createMediaBox(width, height)
      : page.createMediaBox(height, width);

    this.target.addPage(page);

    return new PDFPage(page, this.document);
  }

  public indexOf(page: PDFPage): number {
    return this.target.indexOf(page.target);
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
    return (this.length)
      ? this.get(0)
      : null;
  }

  public last(): PDFPage | null {
    return (this.length)
      ? this.get(this.length - 1)
      : null;
  }

}
