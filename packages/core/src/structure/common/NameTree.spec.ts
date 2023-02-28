import * as assert from "node:assert";
import { PDFDocument } from "../Document";
import { PDFBoolean, PDFDictionary, PDFNumeric, PDFObject, PDFTextString } from "../../objects";
import { NameTree } from "./NameTree";
import { ViewWriter } from "../../ViewWriter";

context("NameTree", () => {

  const doc = new PDFDocument();

  const rootKids = new NameTree(doc.createDictionary( // Root node
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

  const rootNames = new NameTree(doc.createDictionary( // Root node
    ["Names", doc.createArray(
      doc.createString("AAA"), doc.createNumber(1),
      doc.createString("BBB"), doc.createNumber(2),
      doc.createString("CCC"), doc.createNumber(3),
    )],
  ));

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
        const res = rootKids.findValue(t.params);
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
    const keys = rootKids.keys();
    assert.deepStrictEqual(keys, ["AAA", "BBB", "CCC", "DDD", "EEE", "FFF", "GGG", "HHH", "III"]);
  });

  it("entries", () => {
    const keys = rootKids.entries().map(o => {
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
          rootKids.getValue(t.params.key, t.params.type);
        } else {
          assert.throws(() => {
            rootKids.getValue(t.params.key, t.params.type);
          }, t.want);
        }
      });
    }
  });

  context("first", () => {
    const tests: {
      name: string;
      tree: NameTree;
      want: string | null;
    }[] = [
        {
          name: "root with Kids",
          tree: rootKids,
          want: "AAA",
        },
        {
          name: "root with Names",
          tree: rootNames,
          want: "AAA",
        },
      ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = t.tree.first();
        if (t.want === null) {
          assert.strictEqual(res, t.want);
        } else {
          assert.ok(res);
          assert.strictEqual(res[0], t.want);
        }
      });
    }
  });

  context("last", () => {
    const tests: {
      name: string;
      tree: NameTree;
      want: string | null;
    }[] = [
        {
          name: "root with Kids",
          tree: rootKids,
          want: "III",
        },
        {
          name: "root with Names",
          tree: rootNames,
          want: "CCC",
        },
      ];

    for (const t of tests) {
      it(t.name, async () => {
        const res = t.tree.last();
        if (t.want === null) {
          assert.strictEqual(res, t.want);
        } else {
          assert.ok(res);
          assert.strictEqual(res[0], t.want);
        }
      });
    }
  });

  context("setValue", () => {

    it("Root with Names", () => {
      const doc = new PDFDocument();
      const tree = NameTree.create(doc);
      tree.Names = doc.createArray();

      tree.setValue("BBB", doc.createBoolean(true));
      tree.setValue("AAA", doc.createNumber(1));
      tree.setValue("DDD", doc.createNull());
      tree.setValue("CCC", doc.createHexString());
      tree.setValue("EEE", doc.createString("text"));
      tree.setValue("FFF", doc.createName("name"));
      tree.setValue("GGG", doc.createDictionary());
      tree.setValue("HHH", doc.createArray());

      assert.strictEqual(tree.Names.length, 16);
      assert.strictEqual(tree.Names.toString(), "[ (AAA), 1, (BBB), true, (CCC), 4 0 R, (DDD), null, (EEE), 5 0 R, (FFF), /name, (GGG), 6 0 R, (HHH), 7 0 R ]");
    });

    context("Root with Kids", () => {
      let raw: ArrayBuffer;
      let doc2: PDFDocument;
      let tree: NameTree;

      before(async () => {
        const writer = new ViewWriter();
        await doc.writePDF(writer);
        raw = writer.toArrayBuffer();
      });

      beforeEach(async () => {
        doc2 = new PDFDocument();
        await doc2.fromPDF(raw);

        const treeObj = doc2.getObject(rootKids.getIndirect()).value;
        assert.ok(treeObj instanceof PDFDictionary);
        tree = treeObj.to(NameTree);
      });

      it("before AAA, first", async () => {
        tree.setValue("A", doc2.createNumber(1));

        assert.strictEqual(tree.Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text, "A");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text, "FFF");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text, "A");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text, "CCC");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Names?.length, 8);
      });

      it("inside AAA-FFF, middle", async () => {
        tree.setValue("D", doc2.createNumber(1));

        assert.strictEqual(tree.Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text, "AAA");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text, "FFF");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text, "D");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Names?.length, 8);
      });

      it("between FFF and GGG from different groups, middle", async () => {
        tree.setValue("G", doc2.createNumber(0));

        assert.strictEqual(tree.Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text, "AAA");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text, "G");
        assert.strictEqual(tree.Kids?.get(1, NameTree).Limits?.get(0, PDFTextString).text, "GGG");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(1, NameTree).Limits?.get(1, PDFTextString).text, "G");
        assert.strictEqual(tree.Kids?.get(0, NameTree).Kids?.get(1, NameTree).Names?.length, 8);
      });

      it("after III, last", async () => {
        tree.setValue("J", doc2.createNumber(0));

        assert.strictEqual(tree.Kids?.get(1, NameTree).Limits?.get(0, PDFTextString).text, "GGG");
        assert.strictEqual(tree.Kids?.get(1, NameTree).Limits?.get(1, PDFTextString).text, "J");
        assert.strictEqual(tree.Kids?.get(1, NameTree).Names?.length, 8);
      });

    });

  });

});
