import { Convert } from "pvtsutils";
import { PDFDictionary } from "./Dictionary";
import { PDFDictionaryField, PDFNumberField } from "./decorators";
import { PDFLiteralString } from "./LiteralString";
import { Maybe } from "./decorators";
import { PDFName } from "./Name";
import { PDFNumeric } from "./Numeric";
import { PDFDocument } from "../structure/Document";

describe("Dictionary", () => {
  describe("fromPDF", () => {
    const vectors: [string, number][] = [
      ["<< null >>", 0],
      ["<< /Type /Example /Version 0.01 >>", 2],
      ["<< /Type /Example \n /Dictionary << /Version 1.0 >> >>", 2],
      [
        "<</Info 13 0 R/ID [<71d39b4fb9a237145f7abbdb515bbd11><ed92098a42c1aa6e4e086646f97d7f55>]/Root 12 0 R/Size 14>>",
        4
      ],
      [
        "<</Subtype/Type0/Type/Font/BaseFont/WVMPXN+Roboto-Regular/Encoding/Identity-H/DescendantFonts[8 0 R]/ToUnicode 9 0 R>>",
        6
      ]
    ];

    test.each(vectors)("should parse %s correctly", (input, expectedSize) => {
      const item = new PDFDictionary();
      const index = item.fromPDF(input);

      expect(index).toBe(input.length);
      expect(item.size).toBe(expectedSize);
    });

    it("should throw on invalid dictionary start", () => {
      const item = new PDFDictionary();
      expect(() => item.fromPDF("<X>>")).toThrow();
    });

    it("should throw on invalid key type", () => {
      const item = new PDFDictionary();
      expect(() => item.fromPDF("<< 123 /Value >>")).toThrow();
    });
  });

  describe("toPDF and fromPDF", () => {
    it("should correctly serialize and deserialize dictionary", () => {
      const item = new PDFDictionary([
        ["Item1", new PDFLiteralString("Value1")],
        [new PDFName("Item2"), new PDFLiteralString("Value2")]
      ]);

      const pdf = item.toPDF();
      expect(Buffer.from(pdf).toString()).toBe(
        "<<\n/Item1 (Value1)\n/Item2 (Value2)\n>>"
      );

      const parsedItem = PDFDictionary.fromPDF(pdf);
      expect(parsedItem.size).toBe(2);
    });
  });

  describe("Map operations", () => {
    let dictionary: PDFDictionary;

    beforeEach(() => {
      dictionary = new PDFDictionary([
        ["Item1", new PDFLiteralString("Value1")],
        [new PDFName("Item2"), new PDFLiteralString("Value2")],
        ["Item3", new PDFLiteralString("Value3")]
      ]);
    });

    describe("get", () => {
      it("should return existing value", () => {
        const value = dictionary.get("Item1");
        expect(value).toBeInstanceOf(PDFLiteralString);
        expect((value as PDFLiteralString).text).toBe("Value1");
      });

      it("should throw for non-existing key", () => {
        expect(() => dictionary.get("wrong")).toThrow();
      });
    });

    describe("set", () => {
      it("should replace existing value", () => {
        dictionary.set("Item3", new PDFNumeric(4));
        const value = dictionary.get("Item3");
        expect(value).toBeInstanceOf(PDFNumeric);
        expect((value as PDFNumeric).value).toBe(4);
      });

      it("should add new value", () => {
        dictionary.set("Item4", new PDFNumeric(4));
        const value = dictionary.get("Item4");
        expect(value).toBeInstanceOf(PDFNumeric);
        expect((value as PDFNumeric).value).toBe(4);
      });
    });

    describe("delete", () => {
      it("should remove existing key", () => {
        expect(dictionary.has("Item2")).toBe(true);
        expect(dictionary.delete("Item2")).toBe(true);
        expect(dictionary.has("Item2")).toBe(false);
      });

      it("should return false for non-existing key", () => {
        expect(dictionary.delete("wrong")).toBe(false);
      });
    });

    describe("clear", () => {
      it("should remove all items", () => {
        dictionary.clear();
        expect(dictionary.size).toBe(0);
      });
    });

    describe("copy", () => {
      it("should create deep copy", () => {
        const copy = dictionary.copy();
        expect(copy.size).toBe(dictionary.size);
        expect(copy).not.toBe(dictionary);
      });
    });

    describe("equal", () => {
      it("should return true for equal dictionaries", () => {
        const copy = dictionary.copy();
        expect(dictionary.equal(copy)).toBe(true);
      });

      it("should return false for different dictionaries", () => {
        const other = new PDFDictionary([
          ["Different", new PDFLiteralString("Value")]
        ]);
        expect(dictionary.equal(other)).toBe(false);
      });
    });
  });

  describe("Decorators", () => {
    describe("Maybe", () => {
      it("should handle optional dictionary fields", () => {
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
            maybe: true
          })
          public Point!: Maybe<PointDictionary>;
        }

        const doc = PDFDocument.create();
        const test = TestDictionary.create(doc.update);
        test.Point.get().Left = 1;
        test.Point.get().Top = 2;

        const view = test.toPDF();
        expect(Convert.ToBinary(view)).toBe(
          "<<\n/Point <<\n/Left 1\n/Top 2\n>>\n>>"
        );
      });
    });
  });

  describe("toString", () => {
    it("should convert dictionary to string", () => {
      const item = new PDFDictionary([
        ["Item1", new PDFLiteralString("Value1")],
        [new PDFName("Item2"), new PDFLiteralString("Value2")]
      ]);

      const result = item.toString();
      expect(result).toBe("<<\n  /Item1 (Value1)\n  /Item2 (Value2)\n>>");
    });
  });
});
