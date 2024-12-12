import { BufferSourceConverter } from "pvtsutils";
import { PDFArray, PDFDictionary, PDFNumeric } from "../objects";
import { PDFDocument } from "./Document";
import { XrefStructure } from "./XrefStructure";
import { PDFDocumentObjectTypes } from "./DocumentObject";
import { CrossReferenceStream } from "./CrossReferenceStream";
import { PageObjectDictionary } from "./dictionaries";

describe("Document", () => {
  describe("fromPDF", () => {
    it("Simple", async () => {
      const pdf = [
        "%PDF-1.2",
        "% comment",
        "1 0 obj",
        "3",
        "endobj",
        "xref",
        "0 2",
        "0000000000 65535 f ",
        "0000000019 00000 n ",
        "trailer",
        "<<>>",
        "startxref",
        "36",
        "%%EOF",
        ""
      ].join("\n");

      const _doc = await PDFDocument.fromPDF(pdf);
    });
  });

  describe("toPDF", () => {
    it("should create with xref table", async () => {
      const doc = PDFDocument.create();

      const objNum = doc.append(new PDFNumeric(142));
      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(
        BufferSourceConverter.toUint8Array(pdf)
      );

      const obj = doc2.getObject(objNum.id);
      const num = obj.value as PDFNumeric;
      expect(num.value).toBe(142);
    });

    it("should create with 2 xref trailer sections", async () => {
      const doc = PDFDocument.create();

      doc.createNumber(142).makeIndirect();
      await doc.createUpdate();

      doc.createNumber(143).makeIndirect();

      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(pdf);
      expect(doc2.update.previous).toBeTruthy();
      expect(doc2.update.previous!.previous).toBeFalsy();
    });

    it("should create with 2 xref stream sections", async () => {
      const doc = PDFDocument.create({
        xref: XrefStructure.Stream
      });

      doc.createNumber(142).makeIndirect();
      await doc.createUpdate();

      doc.createNumber(143).makeIndirect();

      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(pdf);
      expect(doc2.update.previous).toBeTruthy();
      expect(doc2.update.previous!.previous).toBeFalsy();
    });

    it("Create AcroForms in update using Maybe class", async () => {
      const doc = PDFDocument.create();
      doc.update.catalog!.AcroForm.get();
      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(pdf);
      expect(doc2.update.catalog!.AcroForm).toBeTruthy();
    });

    it("Delete obj", async () => {
      const doc = PDFDocument.create();

      const obj142 = doc.append(new PDFNumeric(142));

      await doc.createUpdate();
      const obj143 = doc.append(new PDFNumeric(143));
      doc.delete(obj142);

      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(
        BufferSourceConverter.toUint8Array(pdf)
      );

      const obj = doc2.getObject(obj142.id);
      expect(obj.type).toBe(PDFDocumentObjectTypes.free);
      const obj2 = doc2.getObject(obj143.id);
      expect(obj2.value).toBeInstanceOf(PDFNumeric);
      expect(obj2.type).toBe(PDFDocumentObjectTypes.inUse);
    });

    it("XRef Stream", async () => {
      const doc = PDFDocument.create({
        xref: XrefStructure.Stream
      });

      doc.append(new PDFNumeric(142));
      doc.append(new PDFNumeric(143));
      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(
        BufferSourceConverter.toUint8Array(pdf)
      );

      expect(doc.update.xref).toBeTruthy();
      expect(doc2.update.xref).toBeTruthy();
      expect(doc.update.xref).toBeInstanceOf(CrossReferenceStream);
      const xref = doc.update.xref as CrossReferenceStream;
      expect(doc2.update.xref).toBeInstanceOf(CrossReferenceStream);
      const xref2 = doc.update.xref as CrossReferenceStream;
      expect(xref2.size).toBe(xref.size);
      expect(xref2.Type).toBe(xref.Type);
      expect(xref.Index).toBeTruthy();
      expect(xref2.Index).toBeTruthy();
      for (let index = 0; index < xref2.Index!.length; index++) {
        expect(xref2.Index![index].start).toBe(xref.Index![index].start);
        expect(xref2.Index![index].size).toBe(xref.Index![index].size);
      }

      for (let index = 0; index < xref2.W.length; index++) {
        expect(xref2.W[index]).toBe(xref.W[index]);
        expect(xref2.W[index]).toBe(xref.W[index]);
      }

      expect(xref2.length.value).toBe(xref.length.value);
    });
  });

  describe("Pages", () => {
    it("addPage empty", async () => {
      const doc = PDFDocument.create();

      await doc.addPage();
      await doc.addPage();

      const docRaw = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(docRaw);
      expect(doc2.update.catalog).toBeTruthy();
      const catalog = doc2.update.catalog!;
      expect(catalog.Pages).toBeTruthy();
      const pages = catalog.Pages;
      expect(pages.Kids).toBeTruthy();
      expect(pages.Count).toBe(2);
      expect(pages.Kids!.length).toBe(2);

      const firstPage = pages.Kids.get(0, PageObjectDictionary);
      expect(firstPage.type).toBe("Page");
      const secondPage = pages.Kids.get(1, PageObjectDictionary);
      expect(secondPage.type).toBe("Page");
    });
  });

  describe("indirect", () => {
    it("set direct and indirect object to dictionary", async () => {
      const doc = PDFDocument.create();

      const dict = doc.createDictionary().makeIndirect();
      const direct = doc.createNumber(9);
      const indirect = doc.createNumber(10).makeIndirect();
      dict.set("Direct", direct);
      dict.set("Indirect", indirect);

      const pdf = await doc.toPDF();
      // console.log(Convert.ToBinary(pdf));

      const doc2 = await PDFDocument.fromPDF(pdf);

      const dict2 = doc2.getObject(dict.getIndirect()).value;
      expect(dict2).toBeInstanceOf(PDFDictionary);
      const dict2_dict = dict2 as PDFDictionary;
      const direct2 = dict2_dict.get("Direct");
      expect(direct2.isIndirect()).toBe(false);
      const indirect2 = dict2_dict.get("Indirect");
      expect(indirect2.isIndirect()).toBe(true);
    });

    it("set direct and indirect objects to array", async () => {
      const doc = PDFDocument.create();

      const array = doc
        .createArray(
          doc.createNumber(9), // direct
          doc.createNumber(10).makeIndirect() // indirect
        )
        .makeIndirect();

      const pdf = await doc.toPDF();
      // console.log(Convert.ToBinary(pdf));

      const doc2 = await PDFDocument.fromPDF(pdf);

      const array2 = doc2.getObject(array.getIndirect()).value;
      expect(array2).toBeInstanceOf(PDFArray);
      const array2_array = array2 as PDFArray;
      const directNumber = array2_array.get(0, PDFNumeric);
      expect(directNumber.isIndirect()).toBe(false);
      expect(directNumber.value).toBe(9);
      expect(array2_array.get(1).isIndirect()).toBe(true);
    });
  });

  describe("modify", () => {
    it("new update", async () => {
      const doc = PDFDocument.create({
        xref: XrefStructure.Table
      });

      // create indirect object
      const num = doc.createNumber(1).makeIndirect();
      const numRef = num.getIndirect();

      // save update
      await doc.createUpdate();

      // modify object
      num.modify();
      num.value = 2;

      // save update
      const pdf = await doc.toPDF();

      // read PDF
      const doc2 = await PDFDocument.fromPDF(pdf);

      // check object last value
      const numLast = doc2.getObject(numRef.id).value;
      expect(numLast).toBeInstanceOf(PDFNumeric);
      const numLast_num = numLast as PDFNumeric;
      expect(numLast_num.value).toBe(2);

      // check object previous value
      const numPrev = doc2.update.previous!.getObject(numRef.id).value;
      expect(numPrev).toBeInstanceOf(PDFNumeric);
      const numPrev_num = numPrev as PDFNumeric;
      expect(numPrev_num.value).toBe(1);
    });
  });
});
