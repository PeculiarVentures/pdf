import * as assert from "assert";

import { ParsingError } from "../errors";
import { PDFNull } from "./Null";

context("Null", () => {

  context("from/to PDF", () => {

    it("\"null\"", () => {
      const parsedItem = PDFNull.fromPDF("null");

      const view = parsedItem.toPDF();
      assert.strictEqual(Buffer.from(view).toString(), "null");
    });

    it("not found", () => {
      assert.throws(() => PDFNull.fromPDF("Null not found"), ParsingError);
    });

  });

});
