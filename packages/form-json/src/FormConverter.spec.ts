import * as fs from "node:fs";
import { PDFDocument } from "@peculiarventures/pdf-doc";
import { writeFile } from "packages/doc/src/Document.spec";
import { globalFormConverter } from "./registry";

context("FormConverter", () => {

  it("convert file to JSON", async () => {
    const raw = fs.readFileSync("/Users/microshine/Downloads/form.pdf");
    const doc = await PDFDocument.load(raw);

    const json = globalFormConverter.export(doc);

    console.log(json);
  });

  it("set form values", async () => {
    const raw = fs.readFileSync("/Users/microshine/Downloads/form.pdf");
    const doc = await PDFDocument.load(raw);

    globalFormConverter.setValue(doc, [
      {
        name: "Text1",
        type: "text_editor",
        text: "hello world",
      },
      {
        name: "Check Box2",
        type: "check_box",
        checked: true,
      },
      {
        name: "Check Box3",
        type: "check_box",
        checked: false,
      },
      {
        name: "Group4",
        type: "radio_button_group",
        selected: "Choice2",
      },
      {
        name: "Dropdown5",
        type: "combo_box",
        selected: ["option2"],
      }
    ]);

    writeFile(await doc.save());
  });

});
