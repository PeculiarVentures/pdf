import * as fs from "fs";
import * as path from "path";
import { PDFArray, PDFDictionary, PDFNumeric, PDFStream } from "../objects";
import { PDFTextString } from "../objects/TextString";
import { PDFDocument, XrefStructure } from "./Document";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkijs = require("pkijs");
import { Crypto } from "@peculiar/webcrypto";
import { PDFCryptoEngine } from "../CryptoEngine";
import { EncryptDictionary } from "./dictionaries";
import { BufferSourceConverter, Convert } from "pvtsutils";
import * as assert from "assert";
import { PDFDocumentObjectTypes } from "./DocumentObject";
import { CrossReferenceStream } from "./CrossReferenceStream";

const filesDir = path.join(__dirname, "..", "..", "..", "..", "files");

context("Document", () => {

  async function readFile(name: string): Promise<PDFDocument> {
    const doc = new PDFDocument();

    const filesPath = path.join(__dirname, "..", "..", "..", "..", "files", `${name}.pdf`);
    const file = fs.readFileSync(filesPath);

    const crypto = new Crypto();
    pkijs.setEngine("pdfCryptoEngine", crypto, new PDFCryptoEngine({ crypto: crypto, subtle: crypto.subtle }));

    await doc.fromPDF(file);

    return doc;
  }

  context("fromPDF", () => {
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

      const doc = new PDFDocument();
      await doc.fromPDF(pdf);
    });
  });

  context("Crypto", () => {
    context("Standard", async () => {


      it("Decode string", async () => {
        const doc = await readFile("dd0004.pdf");
        const obj = doc.getObject(198, 0);
        const jsDict = obj.value as PDFDictionary;
        const jsText = await (jsDict.get("JS") as PDFTextString).decode();
        assert.strictEqual(jsText, "AFNumber_Format(0, 1, 0, 0, \"\", false);");
      });

      it("Decode string repeat", async () => {
        const doc = await readFile("dd0004.pdf");
        const obj = doc.getObject(198, 0);
        const jsDict = obj.value as PDFDictionary;

        await (jsDict.get("JS") as PDFTextString).decode();
        const jsTextRepeat = await (jsDict.get("JS") as PDFTextString).decode();
        assert.strictEqual(jsTextRepeat, "AFNumber_Format(0, 1, 0, 0, \"\", false);");
      });

      it("Get Encrypt Dictionary params", async () => {
        const doc = await readFile("dd0004.pdf");
        const obj2 = doc.getObject(208, 0);
        const encryptDictionary = obj2.value as EncryptDictionary;
        const paramO = await (encryptDictionary.get("O") as PDFTextString).decode();
        assert.strictEqual(paramO, "ÛÕ©ReùíÕbôÏ2_nqóéÁ+ÜLÇsÞlTW");
      });

      it("Encode", async () => {
        const doc = await readFile("dd0004.pdf");
        const obj = doc.getObject(198, 0);
        const jsDict = obj.value as PDFDictionary;
        const jsString = jsDict.get("JS") as PDFTextString;

        const expected = await jsString.decode();
        await jsString.encode();
        await jsString.encode();
        const result = await jsString.decode();
        assert.strictEqual(result, expected);
      });

    });

    context("Password", async () => {
      it("Decode stream", async () => {
        const doc = await readFile("test_1-protected-12345.pdf");
        doc.options = {
          password: {
            user: "12345"
          }
        };

        const obj6 = doc.getObject(6, 0);
        const stream = obj6.value as PDFStream;
        const decodedStream = await stream.decode();
        const text = Convert.ToBinary(decodedStream);
        assert.strictEqual("57.6", text.substr(13545, 4));
      });
    });
  });

  context("Read files", () => {
    const filesPath = path.join(__dirname, "..", "..", "..", "..", "files");
    if (fs.existsSync(filesPath)) {

      const files = fs.readdirSync(filesPath);
      for (const file of files) {
        const filePath = path.join(filesPath, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isFile() && path.extname(file) === ".pdf"
          && path.basename(file) === "212241.pdf"
        ) {
          it(file, async () => {
            const fileData = fs.readFileSync(filePath);
            console.log("File:", file);
            console.log("File (Mb):", fileData.length / (1024 * 1024));

            console.time("Time");
            const doc = new PDFDocument();
            await doc.fromPDF(fileData);

            // console.log(await doc.toString());

            doc.update.catalog?.Pages;
            // console.log();
            // if (doc.update.xrefStructure && !doc.update.xrefStructure.prev) {
            // debugger;
            // }

            // if (doc.update.xrefTable && doc.update.xrefTable.trailer.dictionary.has("Encrypt")) {
            // debugger;
            // }

            // const objects = await doc.update.getObjects();
            // for (const obj of objects) {
            //   if (obj.value instanceof PDFDictionary) {
            //     if (obj.value.has("Type") && (obj.value.get("Type") as PDFName).text === "Sig") {
            //       console.log("Signature");
            //     }
            //   }
            // }
            // console.log("Objects:", objects.length);
            console.timeEnd("Time");
          });
        }
      }
    }
  });

  context("toPDF", () => {
    it("Simple", async () => {
      const doc = new PDFDocument();

      const objNum = doc.append(new PDFNumeric(142));
      const pdf = await doc.toPDF();

      const doc2 = new PDFDocument();
      await doc2.fromPDF(BufferSourceConverter.toUint8Array(pdf));

      const obj = doc.getObject(objNum.id);
      const num = obj.value as PDFNumeric;
      assert.strictEqual(num.value, 142);
    });

    it("Few updates with toPDF", async () => {
      const doc = new PDFDocument();

      const obj142 = doc.append(new PDFNumeric(142));
      await doc.toPDF();

      await doc.createUpdate();
      const obj143 = doc.append(new PDFNumeric(143));

      const pdf = await doc.toPDF();

      const doc2 = new PDFDocument();
      await doc2.fromPDF(BufferSourceConverter.toUint8Array(pdf));

      const obj = doc2.getObject(obj142.id);
      assert(obj.value instanceof PDFNumeric);
      assert.strictEqual(obj.value.value, 142);
      const obj2 = doc2.getObject(obj143.id);
      assert(obj2.value instanceof PDFNumeric);
      assert.strictEqual(obj2.value.value, 143);
    });

    it("Create AcroForms in update using Maybe class", async () => {
      const doc = new PDFDocument();
      doc.options.xref = XrefStructure.Table;
      doc.update.addCatalog();

      let pdf = await doc.toPDF();

      await doc.createUpdate();
      console.log(Convert.ToBinary(pdf));

      const forms = doc.update.catalog!.AcroForm.get();

      pdf = await doc.toPDF();
      console.log(Convert.ToBinary(pdf));
    });

    it("Few updates without toPDF", async () => {
      const doc = new PDFDocument();

      const obj142 = doc.append(new PDFNumeric(142));

      await doc.createUpdate();
      const obj143 = doc.append(new PDFNumeric(143));

      const pdf = await doc.toPDF();

      const doc2 = new PDFDocument();
      await doc2.fromPDF(BufferSourceConverter.toUint8Array(pdf));

      const obj = doc2.getObject(obj142.id);
      assert(obj.value instanceof PDFNumeric);
      assert.strictEqual(obj.value.value, 142);
      const obj2 = doc2.getObject(obj143.id);
      assert(obj2.value instanceof PDFNumeric);
      assert.strictEqual(obj2.value.value, 143);
    });

    it("Delete obj", async () => {
      const doc = new PDFDocument();

      const obj142 = doc.append(new PDFNumeric(142));

      await doc.createUpdate();
      const obj143 = doc.append(new PDFNumeric(143));
      doc.delete(obj142);

      const pdf = await doc.toPDF();

      const doc2 = new PDFDocument();
      await doc2.fromPDF(BufferSourceConverter.toUint8Array(pdf));

      const obj = doc2.getObject(obj142.id);
      assert.strictEqual(obj.type, PDFDocumentObjectTypes.free);
      const obj2 = doc2.getObject(obj143.id);
      assert(obj2.value instanceof PDFNumeric);
      assert.strictEqual(obj2.type, PDFDocumentObjectTypes.inUse);
    });
    // const page = doc.append(new PDFDictionary());
    // const catalog = new CatalogDictionary();
    // const pageRef = new PDFIndirectReference(page.id, page.generation);
    // pageRef.documentUpdate = page.documentUpdate;
    // catalog.set("Pages", pageRef);
    // doc.append(catalog);
    it("XRef Stream", async () => {
      const doc = new PDFDocument();

      doc.append(new PDFNumeric(142));
      doc.append(new PDFNumeric(143));
      const pdf = await doc.toPDF();

      const doc2 = new PDFDocument();
      await doc2.fromPDF(BufferSourceConverter.toUint8Array(pdf));

      assert.ok(doc.update.xref);
      assert.ok(doc2.update.xref);
      assert(doc.update.xref instanceof CrossReferenceStream);
      assert(doc2.update.xref instanceof CrossReferenceStream);
      assert.strictEqual(doc2.update.xref.size, doc.update.xref.size);
      assert.strictEqual(doc2.update.xref.Type, doc.update.xref.Type);

      assert.ok(doc.update.xref.Index);
      assert.ok(doc2.update.xref.Index);
      for (let index = 0; index < doc2.update.xref.Index.length; index++) {
        assert.strictEqual(doc2.update.xref.Index[index].start, doc.update.xref.Index[index].start);
        assert.strictEqual(doc2.update.xref.Index[index].size, doc.update.xref.Index[index].size);
      }

      for (let index = 0; index < doc2.update.xref.W.length; index++) {
        assert.strictEqual(doc2.update.xref.W[index], doc.update.xref.W[index]);
        assert.strictEqual(doc2.update.xref.W[index], doc.update.xref.W[index]);
      }

      assert.strictEqual(doc2.update.xref.length.value, doc.update.xref.length.value);
    });
  });

  context("Pages", () => {
    it("addPage empty", async () => {
      const doc = new PDFDocument();
      doc.options = { xref: XrefStructure.Table };

      await doc.addPage();
      await doc.addPage();

      const docRaw = await doc.toPDF();
      fs.writeFileSync(path.join(filesDir, "..", "new.pdf"), Buffer.from(docRaw), { flag: "w+" });
    });

    it("addPage copy", async () => {
      const doc = await readFile("blank_with_sensitive");
      doc.options = { xref: XrefStructure.Table };
      const page = doc.getObject(8);
      await doc.createUpdate();
      await doc.addPage(page);

      const docRaw = await doc.toPDF();
      fs.writeFileSync(path.join(filesDir, "..", "new.pdf"), Buffer.from(docRaw), { flag: "w+" });
    });

    it("addPage from other doc", async () => {
      const doc = await readFile("dd0004");

      const page = doc.getObject(4);

      const doc2 = await readFile("blank_with_sensitive");
      await doc2.addPage(page);

      const docRaw = await doc2.toPDF();
      fs.writeFileSync(path.join(filesDir, "..", "new.pdf"), Buffer.from(docRaw), { flag: "w+" });
    });
  });

  it("Create empty PDF", async () => {
    const doc = new PDFDocument();
    const page = await doc.addPage();

    const raw = await doc.toPDF();
    fs.writeFileSync(path.join(filesDir, "..", "new.pdf"), Buffer.from(raw), { flag: "w+" });

    console.log(await doc.toString());
  });

  context("indirect", () => {

    it("set direct and indirect object to dictionary", async () => {
      const doc = new PDFDocument();

      const dict = doc.createDictionary().makeIndirect();
      const direct = doc.createNumber(9);
      const indirect = doc.createNumber(10).makeIndirect();
      dict.set("Direct", direct);
      dict.set("Indirect", indirect);

      const pdf = await doc.toPDF();
      // console.log(Convert.ToBinary(pdf));

      const doc2 = await PDFDocument.fromPDF(pdf);

      const dict2 = doc2.getObject(dict.getIndirect()).value;
      assert.ok(dict2 instanceof PDFDictionary);
      const direct2 = dict2.get("Direct");
      assert.ok(!direct2.isIndirect());
      const indirect2 = dict2.get("Indirect");
      assert.ok(indirect2.isIndirect());
    });

    it("set direct and indirect objects to array", async () => {
      const doc = new PDFDocument();

      const array = doc.createArray(
        doc.createNumber(9), // direct
        doc.createNumber(10).makeIndirect(), // indirect
      ).makeIndirect();

      const pdf = await doc.toPDF();
      // console.log(Convert.ToBinary(pdf));

      const doc2 = await PDFDocument.fromPDF(pdf);

      const array2 = doc2.getObject(array.getIndirect()).value;
      assert.ok(array2 instanceof PDFArray);
      const directNumber = array2.get(0, PDFNumeric);
      assert.ok(!directNumber.isIndirect());
      assert.strictEqual(directNumber.value, 9);
      assert.ok(array2.get(1).isIndirect());
    });

  });

  context("modify", () => {
    it("new update", async () => {
      const doc = new PDFDocument();
      const num = doc.createNumber(1).makeIndirect();

      await doc.createUpdate();

      num.modify();
      num.value = 2;

      const pdf = await doc.toPDF();

      const doc2 = await PDFDocument.fromPDF(pdf);

      const numLast = doc2.getObject(4).value;
      assert.ok(numLast instanceof PDFNumeric);
      assert.strictEqual(numLast.value, 2);
      const numPrev = doc2.update.previous!.getObject(4).value;
      assert.ok(numPrev instanceof PDFNumeric);
      assert.strictEqual(numPrev.value, 1);
    });
  });

});
