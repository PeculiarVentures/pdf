import { PDFDictionary, PDFNumeric } from "../objects";
import { PDFDocument } from "./Document";

describe("CrossReferenceTable", () => {
  it("create document", async () => {
    const doc = PDFDocument.create();

    const dict1 = new PDFDictionary([
      ["First", new PDFNumeric(1)],
      ["Second", new PDFNumeric(2)]
    ]);
    const dict2 = new PDFDictionary([
      ["Third", new PDFNumeric(3)],
      ["Fourth", new PDFNumeric(4)]
    ]);

    const objDict1 = doc.append(dict1);
    doc.append(dict2);

    const buf = await doc.toPDF();

    const doc2 = await PDFDocument.fromPDF(buf);

    const obj = doc2.getObject(objDict1.id);
    expect(obj.id).toBe(objDict1.id);
    expect(obj.generation).toBe(objDict1.generation);
    expect(obj.type).toBe(objDict1.type);
    const objValue = obj.value;
    expect(objValue).toBeInstanceOf(PDFDictionary);
    const dict = objValue as PDFDictionary;
    expect(dict.equal(dict1)).toBe(true);
  });
});
