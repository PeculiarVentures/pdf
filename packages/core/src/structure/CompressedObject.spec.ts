import * as assert from "assert";
import { PDFDictionary, PDFNumeric } from "../objects";
import { PDFDocument } from "./Document";

context("CompressedObject", () => {

  it("encode/decode", async () => {
    const doc = new PDFDocument();

    const dict1 = new PDFDictionary([
      ["First", new PDFNumeric(1)],
      ["Second", new PDFNumeric(2)],
    ]);
    const dict2 = new PDFDictionary([
      ["Third", new PDFNumeric(3)],
      ["Fourth", new PDFNumeric(4)],
    ]);

    const objDict1 = doc.update.append(dict1, true);
    doc.update.append(dict2);
  
    const buf = await doc.toPDF();

    const doc2 = new PDFDocument();
    await doc2.fromPDF(buf);

    const dict1_2 = doc2.getObject(objDict1.id);
    assert.strictEqual(dict1_2.id, objDict1.id);
    assert.strictEqual(dict1_2.generation, objDict1.generation);
    assert.strictEqual(dict1_2.type, objDict1.type);
    assert.ok(dict1_2.value instanceof PDFDictionary);
  });

});
