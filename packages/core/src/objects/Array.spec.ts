import * as assert from "assert";

import { PDFArray } from "./Array";
import { PDFBoolean } from "./Boolean";
import { PDFDictionary } from "./Dictionary";
import { PDFLiteralString } from "./LiteralString";
import { PDFName } from "./Name";
import { PDFNumeric } from "./Numeric";
import { PDFObjectTypes } from "./ObjectReader";

context("PDFArray", () => {
  context("fromPDF", () => {
    const vector: [string, number][] = [
      [
        "[549 false /SomeName]",
        3,
      ],
      [
        "[[549] false /SomeName]",
        3,
      ],
      [
        "[ 14920 44632]",
        2,
      ],
    ];
    vector.forEach(([i, o]) => {
      it(i, () => {
        const parsedItem = PDFArray.fromPDF(i);
        assert.strictEqual(parsedItem.length, o);
      });
    });
  });

  context("toPDF", () => {
    const vector: [PDFObjectTypes[], string][] = [
      [
        [new PDFNumeric(549), new PDFBoolean(false), new PDFName("SomeName")],
        "[ 549 false /SomeName ]",
      ],
      [
        [new PDFArray(new PDFNumeric(549)), new PDFBoolean(false), new PDFName("SomeName")],
        "[ [ 549 ] false /SomeName ]",
      ],

    ];
    vector.forEach(([i, o]) => {
      it(i.toString(), () => {
        const parsedItem = new PDFArray(...i);
        const view = parsedItem.toPDF();
        assert.strictEqual(Buffer.from(view).toString(), o);
      });
    });

  });

  context("get", () => {
    it("out of range", () => {
      const array = new PDFArray();
      assert.throws(() => array.get(1));
    });

    it("with default type", () => {
      const array = new PDFArray(
        new PDFNumeric(1),
        new PDFNumeric(2),
      );
      const item = array.get(0);
      assert.ok(item instanceof PDFNumeric);
    });

    it("with correct type", () => {
      const array = new PDFArray(
        new PDFNumeric(1),
        new PDFNumeric(2),
      );
      const item = array.get(0, PDFNumeric);
      assert.strictEqual(item.value, 1);
    });

    it("with incorrect type", () => {
      const array = new PDFArray(
        new PDFNumeric(1),
        new PDFNumeric(2),
      );
      assert.throws(() => array.get(0, PDFLiteralString));
    });

    it("with extended type", () => {
      class Test extends PDFDictionary {}

      const array = new PDFArray(
        new Test(),
        new PDFNumeric(2),
      );

      const dict = array.get(0);
      assert.ok(dict instanceof PDFDictionary);
      const test = array.get(0, Test);
      assert.ok(test instanceof Test);
    });
  });

});
