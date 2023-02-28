import * as assert from "node:assert";
import { PDFDocument } from "../Document";
import { PDFBoolean, PDFNumeric, PDFObject } from "../../objects";
import { NameTree } from "./NameTree";

context("NameTree", () => {

  let nameTree: NameTree;

  before(() => {
    const doc = new PDFDocument();
    nameTree = new NameTree(doc.createDictionary( // Root node
      ["Kids", doc.createArray(
        doc.createDictionary( // Intermediate node
          ["Limits", doc.createArray(doc.createString("AAA"), doc.createString("FFF"))],
          ["Kids", doc.createArray(
            doc.createDictionary( // Leaf node
              ["Limits", doc.createArray(doc.createString("AAA"), doc.createString("CCC"))],
              ["Names", doc.createArray(
                doc.createString("AAA"), doc.createNumber(1),
                doc.createString("BBB"), doc.createNumber(2),
                doc.createString("CCC"), doc.createNumber(3),
              )],
            ).makeIndirect(),
            doc.createDictionary( // Leaf node
              ["Limits", doc.createArray(doc.createString("DDD"), doc.createString("FFF"))],
              ["Names", doc.createArray(
                doc.createString("DDD"), doc.createNumber(4),
                doc.createString("EEE"), doc.createNumber(5),
                doc.createString("FFF"), doc.createNumber(6),
              )],
            ).makeIndirect(),
          )],
        ).makeIndirect(),
        doc.createDictionary( // Intermediate node
          ["Limits", doc.createArray(doc.createString("GGG"), doc.createString("III"))],
          ["Names", doc.createArray(
            doc.createString("GGG"), doc.createNumber(7),
            doc.createString("HHH"), doc.createNumber(8),
            doc.createString("III"), doc.createNumber(9),
          )],
        ).makeIndirect(),
      )],
    ).makeIndirect());
  });

  context("findValue", () => {
    const tests: {
      name: string;
      params: string;
      want: number | null;
    }[] = [
        {
          name: "BBB",
          params: "BBB",
          want: 2,
        },
        {
          name: "FFF",
          params: "FFF",
          want: 6,
        },
        {
          name: "GGG",
          params: "GGG",
          want: 7
        },
        {
          name: "WWW (empty)",
          params: "WWW",
          want: null
        },
      ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = nameTree.findValue(t.params);
        if (t.want === null) {
          assert.strictEqual(res, t.want);
        } else {
          assert.ok(res instanceof PDFNumeric, "Incorrect type of the value");
          assert.strictEqual(res.value, t.want);
        }
      });
    }
  });

  it("keys", () => {
    const keys = nameTree.keys();
    assert.deepStrictEqual(keys, ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG", "HHH", "III"]);
  });

  it("entries", () => {
    const keys = nameTree.entries().map(o => {
      assert.ok(o instanceof PDFNumeric);

      return o.value;
    });
    assert.deepStrictEqual(keys, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  context("getValue", () => {
    const tests: {
      name: string;
      params: {
        key: string;
        type?: new () => PDFObject;
      };
      want: number | typeof Error;
    }[] = [
        {
          name: "AAA",
          params: {
            key: "AAA",
            type: PDFNumeric,
          },
          want: 1,
        },
        {
          name: "cannot be retrieved",
          params: {
            key: "WWWW",
          },
          want: Error,
        },
        {
          name: "cannot be cast",
          params: {
            key: "BBB",
            type: PDFBoolean,
          },
          want: TypeError,
        },
      ];

    for (const t of tests) {
      it(t.name, async () => {
        if (typeof t.want === "number") {
          nameTree.getValue(t.params.key, t.params.type);
        } else {
          assert.throws(() => {
            nameTree.getValue(t.params.key, t.params.type);
          }, t.want);
        }
      });
    }
  });
});
