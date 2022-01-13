import * as assert from "assert";

import { PDFNumeric } from "./Numeric";

context("Numeric", () => {

  context("fromPDF", () => {
    const vector: [string, number][] = [
      //#region Integer
      [
        "123",
        123,
      ],
      [
        "43445",
        43445,
      ],
      [
        "+17",
        17,
      ],
      [
        "-98",
        -98,
      ],
      [
        "0",
        0,
      ],
      //#endregion
      //#region Real
      [
        "34.5",
        34.5,
      ],
      [
        "-3.62",
        -3.62,
      ],
      [
        "+123.6",
        123.6,
      ],
      [
        "4.",
        4,
      ],
      [
        "-.002",
        -0.002,
      ],
      [
        "0.0",
        0,
      ],
      //#endregion
    ];
    vector.forEach(([i, o]) => {
      it(i, () => {
        const parsedItem = PDFNumeric.fromPDF(i);
        assert.strictEqual(parsedItem.value, o);
      });
    });

  });

  context("toPDF", () => {
    const vector: [number, string][] = [
      //#region Integer
      [
        123,
        "123",
      ],
      [
        43445,
        "43445",
      ],
      [
        -98,
        "-98",
      ],
      [
        0,
        "0",
      ],
      //#endregion
      //#region Real
      [
        34.5,
        "34.5",
      ],
      //#endregion
    ];
    vector.forEach(([i, o]) => {
      it(i.toString(), () => {
        const parsedItem = new PDFNumeric(i);
        const view = parsedItem.toPDF();
        assert.strictEqual(Buffer.from(view).toString(), o);
      });
    });

  });

});
