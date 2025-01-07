import * as assert from "assert";
import { PDFDocument } from "../Document";
import { PageObjectDictionary } from "./PageObject";
import { PageTreeNodesDictionary } from "./PageTreeNodes";

describe("PageTreeNodes", () => {
  it("create/Count", () => {
    const doc = PDFDocument.create();
    const tree = PageTreeNodesDictionary.createWithData(
      doc,
      PageObjectDictionary.create(doc),
      PageTreeNodesDictionary.createWithData(
        doc,
        PageObjectDictionary.create(doc),
        PageObjectDictionary.create(doc)
      ),
      PageTreeNodesDictionary.createWithData(
        doc,
        PageTreeNodesDictionary.createWithData(
          doc,
          PageObjectDictionary.create(doc)
        )
      )
    );

    assert.strictEqual(tree.Count, 4);
    assert.strictEqual(tree.Kids.get(1, PageTreeNodesDictionary).Count, 2);
    assert.strictEqual(tree.Kids.get(2, PageTreeNodesDictionary).Count, 1);
    assert.strictEqual(
      tree.Kids.get(2, PageTreeNodesDictionary).Kids.get(
        0,
        PageTreeNodesDictionary
      ).Count,
      1
    );

    // append
    const page = PageObjectDictionary.create(doc);
    tree.Kids.get(2, PageTreeNodesDictionary).push(page);
    assert.strictEqual(tree.Count, 5);
    assert.strictEqual(tree.Kids.get(1, PageTreeNodesDictionary).Count, 2);
    assert.strictEqual(tree.Kids.get(2, PageTreeNodesDictionary).Count, 2);
    assert.strictEqual(
      tree.Kids.get(2, PageTreeNodesDictionary).Kids.get(
        0,
        PageTreeNodesDictionary
      ).Count,
      1
    );

    // remove
    tree.Kids.get(2, PageTreeNodesDictionary).remove(page);
    assert.strictEqual(tree.Count, 4);
    assert.strictEqual(tree.Kids.get(1, PageTreeNodesDictionary).Count, 2);
    assert.strictEqual(tree.Kids.get(2, PageTreeNodesDictionary).Count, 1);
    assert.strictEqual(
      tree.Kids.get(2, PageTreeNodesDictionary).Kids.get(
        0,
        PageTreeNodesDictionary
      ).Count,
      1
    );
  });

  describe("getPages", () => {
    const doc = PDFDocument.create();

    function addPages(tree: PageTreeNodesDictionary, amount: number) {
      while (amount--) {
        const page = PageObjectDictionary.create(doc);
        tree.Kids.push(page);
      }
    }

    const pages1 = PageTreeNodesDictionary.create(doc);
    const pages1_1 = PageTreeNodesDictionary.create(doc);
    pages1.Kids.push(pages1_1);
    addPages(pages1, 1);
    const pages1_1_1 = PageTreeNodesDictionary.create(doc);
    pages1_1.Kids.push(pages1_1_1);
    addPages(pages1_1_1, 3);
    const pages1_1_2 = PageTreeNodesDictionary.create(doc);
    pages1_1.Kids.push(pages1_1_2);
    addPages(pages1_1_1, 3);
    addPages(pages1_1, 3);
    const pages1_2 = PageTreeNodesDictionary.create(doc);
    pages1.Kids.push(pages1_2);
    addPages(pages1_2, 3);
    const pages1_3 = PageTreeNodesDictionary.create(doc);
    pages1.Kids.push(pages1_3);

    const tests: {
      name: string;
      tree: PageTreeNodesDictionary;
      pages: number;
    }[] = [
      {
        name: "root",
        tree: pages1,
        pages: 13
      },
      {
        name: "tree with internal trees",
        tree: pages1_1,
        pages: 9
      },
      {
        name: "tree with pages only",
        tree: pages1_2,
        pages: 3
      },
      {
        name: "tree without pages",
        tree: pages1_3,
        pages: 0
      }
    ];

    for (const t of tests) {
      it(t.name, () => {
        const pages = t.tree.getPages();
        assert.strictEqual(pages.length, t.pages);
      });
    }
  });
});
