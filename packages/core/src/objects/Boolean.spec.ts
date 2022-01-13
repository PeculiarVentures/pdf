import * as assert from "assert";
import { PDFBoolean } from "./Boolean";


context("Boolean", () => {

  context("to/from PDF", () => {

    const vector: [boolean, string][] = [
      [true, "true"],
      [false, "false"],
    ];
    vector.forEach(([v, h]) => {
      it(v.toString(), () => {
        const item = new PDFBoolean(v);

        const view = item.toPDF();
        assert.strictEqual(Buffer.from(view).toString(), h);

        const parsedItem = PDFBoolean.fromPDF(view);
        assert.strictEqual(parsedItem.value, item.value);
      });
    });

  });

});
