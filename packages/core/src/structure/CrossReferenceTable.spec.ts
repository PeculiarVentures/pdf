import { PDFDictionary, PDFNumeric } from "../objects";
import { PDFDocument } from "./Document";
import { XrefStructure } from "./XrefStructure";

context("CrossReferenceTable", () => {

  it("create document", async () => {
    const doc = new PDFDocument();
    doc.options = {
      xref: XrefStructure.Table,
    };

    const dict1 = new PDFDictionary([
      ["First", new PDFNumeric(1)],
      ["Second", new PDFNumeric(2)],
    ]);
    const dict2 = new PDFDictionary([
      ["Third", new PDFNumeric(3)],
      ["Fourth", new PDFNumeric(4)],
    ]);

    const objDict1 = doc.append(dict1);
    doc.append(dict2);

    const buf = await doc.toPDF();

    console.log(Buffer.from(buf).toString("binary"));

    const doc2 = new PDFDocument();
    await doc2.fromPDF(buf);

    const _dict1_2 = doc2.getObject(objDict1.id);
  });

});
