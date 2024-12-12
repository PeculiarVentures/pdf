import { PDFDictionary, PDFNumeric } from "../objects";
import { PDFDocument } from "./Document";

describe("CompressedObject", () => {
  it("encode/decode", async () => {
    const doc = PDFDocument.create();

    const dict1 = new PDFDictionary([
      ["First", new PDFNumeric(1)],
      ["Second", new PDFNumeric(2)]
    ]);
    const dict2 = new PDFDictionary([
      ["Third", new PDFNumeric(3)],
      ["Fourth", new PDFNumeric(4)]
    ]);

    const objDict1 = doc.update.append(dict1, true);
    doc.update.append(dict2);

    const buf = await doc.toPDF();

    const doc2 = await PDFDocument.fromPDF(buf);

    const dict1_2 = doc2.getObject(objDict1.id);
    expect(dict1_2.id).toBe(objDict1.id);
    expect(dict1_2.generation).toBe(objDict1.generation);
    expect(dict1_2.type).toBe(objDict1.type);
    expect(dict1_2.value).toBeInstanceOf(PDFDictionary);
  });
});
