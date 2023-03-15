import * as assert from "assert";
import { Convert } from "pvtsutils";

import { PDFDictionary } from "./Dictionary";
import { PDFDictionaryField, PDFNumberField } from "./decorators";
import { PDFLiteralString } from "./LiteralString";
import { Maybe } from "./decorators";
import { PDFName } from "./Name";
import { PDFNumeric } from "./Numeric";
import { PDFDocument } from "../structure/Document";

context("Dictionary", () => {

  context("fromPDF", () => {

    const vector: [string, number][] = [
      [
        "<< null >>",
        0,
      ],
      [
        "<< /Type /Example /Version 0.01 >>",
        2,
      ],
      [
        "<< /Type /Example \n /Dictionary << /Version 1.0 >> >>",
        2,
      ],
      [
        "<</Info 13 0 R/ID [<71d39b4fb9a237145f7abbdb515bbd11><ed92098a42c1aa6e4e086646f97d7f55>]/Root 12 0 R/Size 14>>",
        4,
      ],
      [
        "<</Subtype/Type0/Type/Font/BaseFont/WVMPXN+Roboto-Regular/Encoding/Identity-H/DescendantFonts[8 0 R]/ToUnicode 9 0 R>>",
        6,
      ],
    ];

    vector.forEach(([i, s]) => {
      it(JSON.stringify(i), () => {
        const item = new PDFDictionary();
        const index = item.fromPDF(i);

        assert.strictEqual(index, i.length);
        assert.strictEqual(item.size, s);
      });
    });

  });

  it("to/from PDF", () => {

    const item = new PDFDictionary([
      ["Item1", new PDFLiteralString("Value1")],
      [new PDFName("Item2"), new PDFLiteralString("Value2")],
    ]);

    const pdf = item.toPDF();

    assert.strictEqual(Buffer.from(pdf).toString(), "<< /Item1 (Value1) /Item2 (Value2) >>");

    const parsedItem = PDFDictionary.fromPDF(pdf);

    assert.strictEqual(parsedItem.size, 2);
  });

  context("Map functions", () => {

    const dictionary = new PDFDictionary([
      ["Item1", new PDFLiteralString("Value1")],
      [new PDFName("Item2"), new PDFLiteralString("Value2")],
      ["Item3", new PDFLiteralString("Value3")],
    ]);

    context("get", () => {
      it("exists", () => {
        const value = dictionary.get("Item1");
        assert(value instanceof PDFLiteralString);
        assert.strictEqual(value.text, "Value1");
      });
      it("not exists", () => {
        assert.throws(() => dictionary.get("wrong"), Error);
      });
    });

    context("set", () => {
      it("replace", () => {
        dictionary.set("Item3", new PDFNumeric(4));
        const value = dictionary.get("Item3");
        assert(value instanceof PDFNumeric);
        assert.strictEqual(value.value, 4);
      });
      it("append", () => {
        dictionary.set("Item4", new PDFNumeric(4));
        const value = dictionary.get("Item4");
        assert(value instanceof PDFNumeric);
        assert.strictEqual(value.value, 4);
      });
    });

    context("delete", () => {
      it("exists", () => {
        assert.strictEqual(dictionary.has("Item2"), true);

        const value = dictionary.delete("Item2");
        assert.strictEqual(value, true);

        assert.strictEqual(dictionary.has("Item2"), false);
      });
      it("not exists", () => {
        const value = dictionary.delete("wrong");
        assert.strictEqual(value, false);
      });
    });

    context("Decorator", () => {

      context("Maybe", () => {

        it("Simple", () => {

          class PointDictionary extends PDFDictionary {
            @PDFNumberField("Left", true, 0)
            public Left!: number;

            @PDFNumberField("Top", true, 0)
            public Top!: number;
          }

          class TestDictionary extends PDFDictionary {

            @PDFDictionaryField({
              name: "Point",
              type: PointDictionary,
              maybe: true,
            })
            public Point!: Maybe<PointDictionary>;

          }

          const doc = new PDFDocument();
          const test = TestDictionary.create(doc.update);
          test.Point.get().Left = 1;
          test.Point.get().Top = 2;

          const view = test.toPDF();
          assert.strictEqual(Convert.ToBinary(view), "<< /Point << /Left 1 /Top 2 >> >>");
        });

      });

    });

  });

});
