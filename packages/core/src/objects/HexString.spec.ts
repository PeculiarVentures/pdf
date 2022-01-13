import * as assert from "assert";

import { PDFHexString } from "./HexString";

context("HexString", () => {

  context("to/from PDF", () => {
    [
      [
        "<901FA3>",
        "901FA3",
      ],
      [
        "<901FA>",
        "901FA0",
      ],
    ].forEach(([i, o]) => {
      it(i, () => {
        const parsedItem = PDFHexString.fromPDF(i);
        const valueLength = parsedItem.text.length;
        assert.strictEqual(parsedItem.text.padEnd(valueLength + (valueLength % 2), "0"), o);

        const out = parsedItem.toPDF();
        assert.strictEqual(Buffer.from(out).toString(), i);
      });
    });

  });

});

