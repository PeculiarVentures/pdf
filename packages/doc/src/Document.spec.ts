import * as assert from "assert";
import * as fs from "fs";
import * as core from "@PeculiarVentures/pdf-core";
import * as path from "path";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import { PDFDocument, PDFVersion } from "./Document";
import { CheckBox, RadioButtonGroup, TextEditor } from "./Form";

export function writeFile(data: BufferSource, name = "tmp"): void {
  const filePath = path.resolve(__dirname, `../../../${name}.pdf`);
  fs.writeFileSync(filePath, Buffer.from(BufferSourceConverter.toArrayBuffer(data)), { flag: "w+" });
}

context("Document", () => {

  context("Create", () => {
    it("Create an empty PDF file", async () => {
      const doc = await PDFDocument.create({
        version: PDFVersion.v1_3,
      });

      assert.strictEqual(doc.pages.length, 0);
    });
    it("Create a PDF file with 1 page", async () => {
      const doc = await PDFDocument.create();

      const page = doc.pages.create();

      // writeFile(await doc.save());

      assert.strictEqual(doc.pages.length, 1);
    });
  });

  context("Components", () => {
    
    it("Get Checkbox by name", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const checkBox1 = page.addCheckBox({
        top: "5mm",
        left: "5mm",
        enabled: false,
      });
      const checkBox2 = page.addCheckBox({
        top: "5mm",
        left: checkBox1.left + checkBox1.width + 2,
        enabled: true,
      });

      let pdf = await doc.save();
      
      const doc2 = await PDFDocument.load(pdf);
      const components = doc2.getComponents();
      
      assert.strictEqual(components[0].name, checkBox1.name);
      assert.strictEqual(components[1].name, checkBox2.name);

      const checkBox = components[0];
      assert.ok(checkBox instanceof CheckBox);
      checkBox.checked = true;
      
      const checkBoxByName = doc2.getComponentByName(checkBox1.name);
      assert.ok(checkBoxByName instanceof CheckBox);

      pdf = await doc2.save();
      writeFile(pdf);
    });

    it("Get TextBox by name", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });
      const font = doc.addFont();

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const textBox = page.addTextEditor({
        top: "5mm",
        left: "5mm",
        text: "Hello",
        font,
        width: "2cm",
        height: "2cm",
      });

      let pdf = await doc.save();
      writeFile(pdf);
      
      const doc2 = await PDFDocument.load(pdf);
      const components = doc2.getComponents();
      
      assert.strictEqual(components[0].name, textBox.name);

      const textBoxByName = components[0];
      assert.ok(textBoxByName instanceof TextEditor);
      textBoxByName.left = "20mm";
      
      pdf = await doc2.save();
      writeFile(pdf);
    });
    
    it("Get RadioButtonGroup", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const rb1 = page.addRadioButton({
        top: "5mm",
        left: "5mm",
        value: "value1",
      });
      const rb2 = page.addRadioButton({
        group: rb1.name,
        top: "5mm",
        left: rb1.left + rb1.width + 2,
        value: "value2",
      });

      let pdf = await doc.save();
      writeFile(pdf);
      
      const doc2 = await PDFDocument.load(pdf);
      const components = doc2.getComponents();
      
      assert.strictEqual(components[0].name, rb1.name);

      const rbGroupByName = doc2.getComponentByName(rb1.name);
      assert.ok(rbGroupByName instanceof RadioButtonGroup);
      assert.strictEqual(rbGroupByName.length, 2);
      assert.strictEqual(rbGroupByName.selected, rb1.value);
      
      const item = rbGroupByName.get(1);
      item.checked = true;

      assert.strictEqual(rbGroupByName.selected, rb2.value);
      
      pdf = await doc2.save();
      writeFile(pdf);
    });

  });

});
