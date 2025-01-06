import { PDFDocument } from "../structure";
import { ViewWriter } from "../ViewWriter";
import { PDFArray } from "./Array";
import { PDFBoolean } from "./Boolean";
import { PDFDictionary } from "./Dictionary";
import { PDFLiteralString } from "./LiteralString";
import { PDFName } from "./Name";
import { PDFNumeric } from "./Numeric";
import { PDFObjectTypes } from "./ObjectTypes";
import "./register";

describe("PDFArray", () => {
  describe("fromPDF", () => {
    const checkFromPDF = (input: string, expectedLength: number) => {
      const array = PDFArray.fromPDF(input);
      expect(array.length).toBe(expectedLength);
    };

    it("should parse simple array", () => {
      checkFromPDF("[549 false /SomeName]", 3);
    });

    it("should parse nested array", () => {
      checkFromPDF("[[549] false /SomeName]", 3);
    });

    it("should parse array with spaces", () => {
      checkFromPDF("[ 14920 44632]", 2);
    });
  });

  describe("toPDF", () => {
    const vector: [PDFObjectTypes[], string][] = [
      [
        [new PDFNumeric(549), new PDFBoolean(false), new PDFName("SomeName")],
        "[ 549 false /SomeName ]"
      ],
      [
        [
          new PDFArray(new PDFNumeric(549)),
          new PDFBoolean(false),
          new PDFName("SomeName")
        ],
        "[ [ 549 ] false /SomeName ]"
      ]
    ];
    vector.forEach(([i, o]) => {
      it(i.toString(), () => {
        const parsedItem = new PDFArray(...i);
        const view = parsedItem.toPDF();
        expect(Buffer.from(view).toString()).toBe(o);
      });
    });
  });

  describe("get", () => {
    it("out of range", () => {
      const array = new PDFArray();
      expect(() => array.get(1)).toThrow();
    });

    it("with default type", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFNumeric(2));
      const item = array.get(0);
      expect(item).toBeInstanceOf(PDFNumeric);
    });

    it("with correct type", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFNumeric(2));
      const item = array.get(0, PDFNumeric);
      expect(item.value).toBe(1);
    });

    it("with incorrect type", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFNumeric(2));
      expect(() => array.get(0, PDFLiteralString)).toThrow();
    });

    it("with extended type", () => {
      class Test extends PDFDictionary {}

      const array = new PDFArray(new Test(), new PDFNumeric(2));

      const dict = array.get(0);
      expect(dict).toBeInstanceOf(PDFDictionary);
      const test = array.get(0, Test);
      expect(test).toBeInstanceOf(Test);
    });
  });

  describe("push", () => {
    it("should add items to the array", () => {
      const array = new PDFArray();
      array.push(new PDFNumeric(1), new PDFBoolean(true));
      expect(array.length).toBe(2);
      expect(array.get(0)).toBeInstanceOf(PDFNumeric);
      expect(array.get(1)).toBeInstanceOf(PDFBoolean);
    });
  });

  describe("indexOf", () => {
    it("should return the index of an item", () => {
      const item1 = new PDFNumeric(1);
      const item2 = new PDFBoolean(true);
      const array = new PDFArray(item1, item2);
      expect(array.indexOf(item1)).toBe(0);
      expect(array.indexOf(item2)).toBe(1);
    });

    it("should return -1 if the item is not found", () => {
      const item1 = new PDFNumeric(1);
      const item2 = new PDFBoolean(true);
      const array = new PDFArray(item1);
      expect(array.indexOf(item2)).toBe(-1);
    });
  });

  describe("includes", () => {
    it("should return true if the item is in the array", () => {
      const item = new PDFNumeric(1);
      const array = new PDFArray(item);
      expect(array.includes(item)).toBe(true);
    });

    it("should return false if the item is not in the array", () => {
      const item = new PDFNumeric(1);
      const array = new PDFArray();
      expect(array.includes(item)).toBe(false);
    });
  });

  describe("splice", () => {
    it("should remove items from the array", () => {
      const item1 = new PDFNumeric(1);
      const item2 = new PDFBoolean(true);
      const array = new PDFArray(item1, item2);
      const removedItems = array.splice(0, 1);
      expect(array.length).toBe(1);
      expect(array.get(0)).toBeInstanceOf(PDFBoolean);
      expect(removedItems.length).toBe(1);
      expect(removedItems[0]).toBeInstanceOf(PDFNumeric);
    });
  });

  describe("clear", () => {
    it("should remove all items from the array", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      array.clear();
      expect(array.length).toBe(0);
    });
  });

  describe("toString", () => {
    it("should return a string representation of the array", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      expect(array.toString()).toBe("[ 1, true ]");
    });
  });

  describe("find", () => {
    it("should find an item by index", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      const item = array.find(0);
      expect(item).toBeInstanceOf(PDFNumeric);
    });

    it("should find an item by index and type", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      const item = array.find(0, PDFNumeric);
      expect(item).toBeInstanceOf(PDFNumeric);
    });

    it("should return null if item is not found", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      const item = array.find(2);
      expect(item).toBeNull();
    });
  });

  describe("onEqual", () => {
    it("should return true if arrays are equal", () => {
      const array1 = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      const array2 = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      expect(array1["onEqual"](array2)).toBe(true);
    });

    it("should return false if arrays are not equal", () => {
      const array1 = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      const array2 = new PDFArray(new PDFNumeric(2), new PDFBoolean(false));
      expect(array1["onEqual"](array2)).toBe(false);
    });

    it("should return false if arrays are not equal in length", () => {
      const array1 = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      const array2 = new PDFArray(new PDFNumeric(1));
      expect(array1["onEqual"](array2)).toBe(false);
    });
  });

  describe("writePDF", () => {
    let doc: PDFDocument;

    beforeEach(() => {
      doc = PDFDocument.create();
    });

    it("should write a simple array", () => {
      const array = doc.createArray(
        doc.createNumber(1),
        doc.createBoolean(true),
        doc.createName("SomeName"),
        doc.createString("SomeString"),
        doc.createHexString(new Uint8Array([0x01, 0x02, 0x03])),
        doc.createNull(),
        doc.createDictionary(
          ["SomeKey", doc.createNumber(1)],
          ["AnotherKey", doc.createBoolean(true)]
        ),
        doc.createStream(new Uint8Array([0x01, 0x02, 0x03])) // ref
      );
      const writer = new ViewWriter();
      array.writePDF(writer);
      const refId = array.get(7).getIndirect().id;
      expect(writer.toString()).toBe(
        `[ 1 true /SomeName (SomeString) <010203> null <<\n/SomeKey 1\n/AnotherKey true\n>> ${refId} 0 R ]`
      );
    });
  });

  describe("iterator", () => {
    it("should iterate over the array", () => {
      const array = new PDFArray(new PDFNumeric(1), new PDFBoolean(true));
      let result = "";
      for (const item of array) {
        result += item.toString();
      }
      expect(result).toBe("1true");
    });
  });
});
