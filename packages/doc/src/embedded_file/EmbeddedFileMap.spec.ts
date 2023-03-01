import * as assert from "node:assert";
import { PDFDocument } from "../Document";

context("EmbeddedFileMap", () => {

  it("set/get", async () => {
    const doc = await PDFDocument.create();
    assert.strictEqual(doc.embeddedFiles.size, 0);

    const file1 = "file1.txt";
    const file2 = "file2.txt";
    doc.embeddedFiles
      .attach({
        name: file1,
        id: file1,
        data: Buffer.from(file1),
      })
      .attach({
        name: file2,
        id: file2,
        data: Buffer.from(file2),
      });
    assert.strictEqual(doc.embeddedFiles.size, 2);

    // save the document
    const raw = await doc.save();

    const doc2 = await PDFDocument.load(raw);
    assert.strictEqual(doc2.embeddedFiles.size, 2);
    const embedded1 = doc2.embeddedFiles.find(file1);
    assert.ok(embedded1);
    assert.strictEqual(embedded1.name, file1);
    const embedded2 = doc2.embeddedFiles.find(file2);
    assert.ok(embedded2);
    assert.strictEqual(embedded2.name, file2);
  });

});
