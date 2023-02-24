import * as assert from "assert";
import { PDFDocument } from "./Document";
import { writeFile } from "./Document.spec";
import { PDFPageOrientation } from "./Pages";

context("Pages", () => {

  it("Add 3 pages of different sizes", async () => {
    const doc = await PDFDocument.create({
      version: 1.3,
    });

    assert.strictEqual(doc.pages.length, 0);

    const a4P = doc.pages.create(); // A4 portrait

    const a4L = doc.pages.create({ // A4 landscape
      orientation: PDFPageOrientation.landscape
    });
    assert.strictEqual(a4P.height, a4L.width);
    assert.strictEqual(a4P.width, a4L.height);

    doc.pages.create({ // custom size
      width: "15cm",
      height: "210mm",
    });

    const page = doc.pages.get(2);
    assert.strictEqual(page.height, 595.28);
    assert.strictEqual(page.width, 425.2);

    assert.strictEqual(doc.pages.length, 3);
  });

  it("Insert page before first", async () => {
    const doc = await PDFDocument.create({
      version: 1.3,
    });

    assert.strictEqual(doc.pages.length, 0);

    const page1 = doc.pages.create();

    doc.pages.create();

    const page3 = doc.pages.create({ // custom size
      width: "15cm",
      height: "210mm",
    });

    assert.strictEqual(doc.pages.length, 3);

    doc.pages.insertBefore(page3, page1);

    const page = doc.pages.get(0);
    assert.strictEqual(page.height, 595.28);
    assert.strictEqual(page.width, 425.2);
  });

  it("Remove page", async () => {
    const doc = await PDFDocument.create({
      version: 1.3,
    });

    assert.strictEqual(doc.pages.length, 0);

    doc.pages.create();
    doc.pages.create();

    const page3 = doc.pages.create({ // custom size
      width: "15cm",
      height: "210mm",
    });

    assert.strictEqual(doc.pages.length, 3);

    doc.pages.remove(page3);

    assert.strictEqual(doc.pages.length, 2);

    writeFile(await doc.save());
  });

  it("merge", async () => {
    const doc1 = await PDFDocument.create();
    doc1.pages.create();
    doc1.pages.create();
    assert.equal(doc1.pages.length, 2);

    const doc2 = await PDFDocument.create();
    doc2.pages.create();
    doc2.pages.create();
    doc2.pages.create();
    assert.equal(doc2.pages.length, 3);

    await doc1.pages.append(doc2, {
      pages: [2, 3],
    });

    assert.equal(doc1.pages.length, 4);
  });

});
