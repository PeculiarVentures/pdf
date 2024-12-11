import { PDFDocument } from "../Document";
import {
  PDFBoolean,
  PDFDictionary,
  PDFNumeric,
  PDFObject,
  PDFTextString
} from "../../objects";
import { NameTree } from "./NameTree";
import { ViewWriter } from "../../ViewWriter";
import { XrefStructure } from "../XrefStructure";

describe("NameTree", () => {
  let doc: PDFDocument;
  let rootKids: NameTree;
  let rootNames: NameTree;

  beforeAll(async () => {
    doc = new PDFDocument();
    doc.options.xref = XrefStructure.Table;
    doc.options.disableAscii85Encoding = true;
    doc.options.disableCompressedStreams = true;
    doc.options.disableCompressedObjects = true;
    doc.update.addCatalog();

    rootKids = new NameTree(
      doc
        .createDictionary(
          // Root node
          [
            "Kids",
            doc.createArray(
              doc
                .createDictionary(
                  // Intermediate node
                  [
                    "Limits",
                    doc.createArray(
                      doc.createString("AAA"),
                      doc.createString("FFF")
                    )
                  ],
                  [
                    "Kids",
                    doc.createArray(
                      doc
                        .createDictionary(
                          // Leaf node
                          [
                            "Limits",
                            doc.createArray(
                              doc.createString("AAA"),
                              doc.createString("CCC")
                            )
                          ],
                          [
                            "Names",
                            doc.createArray(
                              doc.createString("AAA"),
                              doc.createNumber(1),
                              doc.createString("BBB"),
                              doc.createNumber(2),
                              doc.createString("CCC"),
                              doc.createNumber(3)
                            )
                          ]
                        )
                        .makeIndirect(),
                      doc
                        .createDictionary(
                          // Leaf node
                          [
                            "Limits",
                            doc.createArray(
                              doc.createString("DDD"),
                              doc.createString("FFF")
                            )
                          ],
                          [
                            "Names",
                            doc.createArray(
                              doc.createString("DDD"),
                              doc.createNumber(4),
                              doc.createString("EEE"),
                              doc.createNumber(5),
                              doc.createString("FFF"),
                              doc.createNumber(6)
                            )
                          ]
                        )
                        .makeIndirect()
                    )
                  ]
                )
                .makeIndirect(),
              doc
                .createDictionary(
                  // Intermediate node
                  [
                    "Limits",
                    doc.createArray(
                      doc.createString("GGG"),
                      doc.createString("III")
                    )
                  ],
                  [
                    "Names",
                    doc.createArray(
                      doc.createString("GGG"),
                      doc.createNumber(7),
                      doc.createString("HHH"),
                      doc.createNumber(8),
                      doc.createString("III"),
                      doc.createNumber(9)
                    )
                  ]
                )
                .makeIndirect()
            )
          ]
        )
        .makeIndirect()
    );

    rootNames = new NameTree(
      doc.createDictionary(
        // Root node
        [
          "Names",
          doc.createArray(
            doc.createString("AAA"),
            doc.createNumber(1),
            doc.createString("BBB"),
            doc.createNumber(2),
            doc.createString("CCC"),
            doc.createNumber(3)
          )
        ]
      )
    );
  });

  describe("type", () => {
    it("should return EMPTY when no Names or Kids", () => {
      const tree = new NameTree(doc.createDictionary());
      expect(tree.type).toBe(NameTree.EMPTY);
    });

    it("should return ROOT when has Names without Limits", () => {
      const tree = new NameTree(
        doc.createDictionary(["Names", doc.createArray()])
      );
      expect(tree.type).toBe(NameTree.ROOT);
    });

    it("should return LEAF when has both Names and Limits", () => {
      const tree = new NameTree(
        doc.createDictionary(
          ["Names", doc.createArray()],
          ["Limits", doc.createArray()]
        )
      );
      expect(tree.type).toBe(NameTree.LEAF);
    });

    it("should return ROOT when has Kids without Limits", () => {
      const tree = new NameTree(
        doc.createDictionary(["Kids", doc.createArray()])
      );
      expect(tree.type).toBe(NameTree.ROOT);
    });

    it("should return INTERMEDIATE when has both Kids and Limits", () => {
      const tree = new NameTree(
        doc.createDictionary(
          ["Kids", doc.createArray()],
          ["Limits", doc.createArray()]
        )
      );
      expect(tree.type).toBe(NameTree.INTERMEDIATE);
    });
  });

  describe("findValue", () => {
    const checkFindValue = (
      name: string,
      tree: NameTree,
      key: string,
      want: number | null
    ) => {
      const res = tree.findValue(key);
      if (want === null) {
        expect(res).toBe(want);
      } else {
        expect(res).toBeInstanceOf(PDFNumeric);
        expect((res as PDFNumeric).value).toBe(want);
      }
    };

    it("root with Kids - BBB", () => {
      checkFindValue("BBB", rootKids, "BBB", 2);
    });

    it("root with Kids - FFF", () => {
      checkFindValue("FFF", rootKids, "FFF", 6);
    });

    it("root with Kids - GGG", () => {
      checkFindValue("GGG", rootKids, "GGG", 7);
    });

    it("root with Kids - WWW (empty)", () => {
      checkFindValue("WWW", rootKids, "WWW", null);
    });

    it("root with Names - BBB", () => {
      checkFindValue("BBB", rootNames, "BBB", 2);
    });
  });

  it("keys", () => {
    const keys = rootKids.keys();
    expect(keys).toEqual([
      "AAA",
      "BBB",
      "CCC",
      "DDD",
      "EEE",
      "FFF",
      "GGG",
      "HHH",
      "III"
    ]);
  });

  it("entries", () => {
    const keys = rootKids.entries().map((o) => {
      expect(o).toBeInstanceOf(PDFNumeric);
      return (o as PDFNumeric).value;
    });
    expect(keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  describe("getValue", () => {
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
          type: PDFNumeric
        },
        want: 1
      },
      {
        name: "cannot be retrieved",
        params: {
          key: "WWWW"
        },
        want: Error
      },
      {
        name: "cannot be cast",
        params: {
          key: "BBB",
          type: PDFBoolean
        },
        want: TypeError
      }
    ];

    for (const t of tests) {
      it(t.name, async () => {
        if (typeof t.want === "number") {
          rootKids.getValue(t.params.key, t.params.type);
        } else {
          expect(() => {
            rootKids.getValue(t.params.key, t.params.type);
          }).toThrow(t.want);
        }
      });
    }
  });

  describe("first", () => {
    const checkFirst = (name: string, tree: NameTree, want: string | null) => {
      const res = tree.first();
      if (want === null) {
        expect(res).toBe(want);
      } else {
        expect(res).toBeTruthy();
        expect(res![0]).toBe(want);
      }
    };

    it("root with Kids", async () => {
      checkFirst("root with Kids", rootKids, "AAA");
    });

    it("root with Names", async () => {
      checkFirst("root with Names", rootNames, "AAA");
    });
  });

  describe("last", () => {
    const checkLast = (name: string, tree: NameTree, want: string | null) => {
      const res = tree.last();
      if (want === null) {
        expect(res).toBe(want);
      } else {
        expect(res).toBeTruthy();
        expect(res![0]).toBe(want);
      }
    };

    it("root with Kids", async () => {
      checkLast("root with Kids", rootKids, "III");
    });

    it("root with Names", async () => {
      checkLast("root with Names", rootNames, "CCC");
    });
  });

  describe("setValue", () => {
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

      expect(tree.Names.length).toBe(16);
      expect(tree.Names.toString()).toBe(
        "[ (AAA), 1, (BBB), true, (CCC), 3 0 R, (DDD), null, (EEE), 4 0 R, (FFF), /name, (GGG), 5 0 R, (HHH), 6 0 R ]"
      );
    });

    describe("Root with Kids", () => {
      let raw: ArrayBuffer;
      let doc2: PDFDocument;
      let tree: NameTree;

      beforeAll(async () => {
        const writer = new ViewWriter();
        await doc.writePDF(writer);
        raw = writer.toArrayBuffer();
      });

      beforeEach(async () => {
        doc2 = new PDFDocument();
        await doc2.fromPDF(raw);

        const treeObj = doc2.getObject(rootKids.getIndirect()).value;
        expect(treeObj).toBeInstanceOf(PDFDictionary);
        tree = (treeObj as PDFDictionary).to(NameTree);
      });

      it("before AAA, first", async () => {
        tree.setValue("A", doc2.createNumber(1));

        expect(
          tree.Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text
        ).toBe("A");
        expect(
          tree.Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text
        ).toBe("FFF");
        expect(
          tree.Kids?.get(0, NameTree)
            .Kids?.get(0, NameTree)
            .Limits?.get(0, PDFTextString).text
        ).toBe("A");
        expect(
          tree.Kids?.get(0, NameTree)
            .Kids?.get(0, NameTree)
            .Limits?.get(1, PDFTextString).text
        ).toBe("CCC");
        expect(
          tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Names?.length
        ).toBe(8);
      });

      it("inside AAA-FFF, middle", async () => {
        tree.setValue("D", doc2.createNumber(1));

        expect(
          tree.Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text
        ).toBe("AAA");
        expect(
          tree.Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text
        ).toBe("FFF");
        expect(
          tree.Kids?.get(0, NameTree)
            .Kids?.get(0, NameTree)
            .Limits?.get(1, PDFTextString).text
        ).toBe("D");
        expect(
          tree.Kids?.get(0, NameTree).Kids?.get(0, NameTree).Names?.length
        ).toBe(8);
      });

      it("between FFF and GGG from different groups, middle", async () => {
        tree.setValue("G", doc2.createNumber(0));

        expect(
          tree.Kids?.get(0, NameTree).Limits?.get(0, PDFTextString).text
        ).toBe("AAA");
        expect(
          tree.Kids?.get(0, NameTree).Limits?.get(1, PDFTextString).text
        ).toBe("G");
        expect(
          tree.Kids?.get(1, NameTree).Limits?.get(0, PDFTextString).text
        ).toBe("GGG");
        expect(
          tree.Kids?.get(0, NameTree)
            .Kids?.get(1, NameTree)
            .Limits?.get(1, PDFTextString).text
        ).toBe("G");
        expect(
          tree.Kids?.get(0, NameTree).Kids?.get(1, NameTree).Names?.length
        ).toBe(8);
      });

      it("after III, last", async () => {
        tree.setValue("J", doc2.createNumber(0));

        expect(
          tree.Kids?.get(1, NameTree).Limits?.get(0, PDFTextString).text
        ).toBe("GGG");
        expect(
          tree.Kids?.get(1, NameTree).Limits?.get(1, PDFTextString).text
        ).toBe("J");
        expect(tree.Kids?.get(1, NameTree).Names?.length).toBe(8);
      });
    });
  });
});
