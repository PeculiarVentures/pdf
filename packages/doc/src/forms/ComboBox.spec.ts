import * as assert from "node:assert";
import { PDFDocument, PDFDocumentCreateParameters } from "../Document";
import { writeFile } from "../Document.spec";
import { ComboBox } from "./ComboBox";

context("ComboBox", () => {

  const options: PDFDocumentCreateParameters = {
    disableAscii85Encoding: true,
    disableCompressedStreams: true,
    useXrefTable: true,
  };

  it("create", async () => {
    const doc = await PDFDocument.create(options);

    const page = doc.pages.create();
    page.addComboBox({
      height: 20,
      width: 140,
      left: 10,
      top: 10,
      name: "Dropdown 1",
      options: {
        item1: "Item 1",
        item2: "Item 2",
        item3: "Item 3",
      },
      selected: "item3",
    });

    writeFile(await doc.save());
  });

  it("update value", async () => {
    const doc = await PDFDocument.create(options);

    const page = doc.pages.create();
    const comboBox = page.addComboBox({
      height: 20,
      width: 140,
      left: 10,
      top: 10,
      name: "Dropdown 1",
      options: {
        item1: "Item 1",
        item2: "Item 2",
        item3: "Item 3",
      },
      selected: "item3",
    });

    const raw = await doc.save();

    const doc2 = await PDFDocument.load(raw);
    const comboBox2 = doc2.getComponentById(comboBox.id, 0, ComboBox);
    assert.ok(comboBox2);

    comboBox2.selected = ["item1"];

    writeFile(await doc2.save());
  });

});
