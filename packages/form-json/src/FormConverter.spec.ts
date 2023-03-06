import * as fs from "node:fs";
import { PDFDocument } from "@peculiarventures/pdf-doc";
import { FormConverter } from "./FormConverter";
import { ComponentConverterFactory } from "./ComponentConverterFactory";
import { CheckBoxConverter, InputImageBoxConverter, RadioButtonConverter, TextEditorConverter } from ".";

context("FormConverter", () => {

  it("convert file to JSON", async () => {
    // const raw = fs.readFileSync("/Users/microshine/Downloads/OoPdfFormExample.pdf");
    const raw = fs.readFileSync("/Users/microshine/Downloads/pdf_form_maker_new.pdf");
    const doc = await PDFDocument.load(raw);

    const registry = new ComponentConverterFactory(
      new CheckBoxConverter(),
      new RadioButtonConverter,
      new TextEditorConverter,
      new InputImageBoxConverter(),
    );
    const converter = new FormConverter(registry);

    const json = converter.export(doc);

    console.log(json);
  });

});
