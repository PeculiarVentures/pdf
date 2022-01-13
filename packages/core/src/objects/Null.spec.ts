import * as assert from "assert";

import { PDFNull } from "./Null";
import { ParsingError } from "../ParsingError";

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
