import { createPdfWithPage } from "@peculiarventures/pdf-tests";
import { PDFPageOrientation } from "./Pages";

describe("Pages", () => {
  it("should create multiple pages with different sizes and orientations", async () => {
    const doc = await createPdfWithPage();
    const a4P = doc.pages.get(0); // A4 portrait
    const a4L = doc.pages.create({
      // A4 landscape
      orientation: PDFPageOrientation.landscape
    });
    expect(a4P.height).toBe(a4L.width);
    expect(a4P.width).toBe(a4L.height);

    doc.pages.create({
      // custom size
      width: "15cm",
      height: "210mm"
    });

    const page = doc.pages.get(2);
    expect(page.height).toBeCloseTo(595.28);
    expect(page.width).toBeCloseTo(425.2);
    expect(doc.pages.length).toBe(3);
  });

  it("should insert a new page before the first page", async () => {
    const doc = await createPdfWithPage();
    const page1 = doc.pages.get(0); // 1st page
    doc.pages.create(); // 2nd page

    const page3 = doc.pages.create({
      // 3rd page
      // custom size
      width: "15cm",
      height: "210mm"
    });
    expect(doc.pages.length).toBe(3);

    doc.pages.insertBefore(page3, page1);

    const page = doc.pages.get(0);
    expect(page.height).toBe(595.28);
    expect(page.width).toBe(425.2);
  });

  it("should remove a page from the document", async () => {
    const doc = await createPdfWithPage();
    doc.pages.create(); // 2nd page

    const page3 = doc.pages.create({
      // 3rd page
      // custom size
      width: "15cm",
      height: "210mm"
    });
    expect(doc.pages.length).toBe(3);

    doc.pages.remove(page3);
    expect(doc.pages.length).toBe(2);
  });

  it("should merge pages from one document into another", async () => {
    const doc1 = await createPdfWithPage();
    doc1.pages.create();
    expect(doc1.pages.length).toBe(2);

    const doc2 = await createPdfWithPage();
    doc2.pages.create();
    doc2.pages.create();
    expect(doc2.pages.length).toBe(3);

    await doc1.pages.append(doc2, {
      pages: [2, 3]
    });
    expect(doc1.pages.length).toBe(4);
  });

  describe("get content", () => {
    it("should create and manage content streams correctly", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);

      // Get initial content stream
      const content1 = page.content;
      expect(content1).toBeDefined();

      // Second call should return the same stream in same update
      const content2 = page.content;
      expect(content2).toBe(content1);
    });
  });
});
