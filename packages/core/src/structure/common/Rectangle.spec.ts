import { PDFDocument } from "../Document";
import { PDFRectangle } from "./Rectangle";
import { PDFNumeric } from "../../objects/Numeric";
import { XrefStructure } from "../XrefStructure";

describe("PDFRectangle", () => {
  let doc: PDFDocument;

  beforeAll(() => {
    doc = PDFDocument.create({
      xref: XrefStructure.Table,
      disableAscii85Encoding: true,
      disableCompressedStreams: true,
      disableCompressedObjects: true
    });
  });

  describe("creation", () => {
    it("should create empty rectangle with default values", () => {
      const rect = PDFRectangle.create(doc.update);
      expect(rect.llX).toBe(0);
      expect(rect.llY).toBe(0);
      expect(rect.urX).toBe(0);
      expect(rect.urY).toBe(0);
    });

    it("should create rectangle with specified values", () => {
      const rect = PDFRectangle.createWithData(doc.update, 10, 20, 30, 40);
      expect(rect.llX).toBe(10);
      expect(rect.llY).toBe(20);
      expect(rect.urX).toBe(30);
      expect(rect.urY).toBe(40);
    });
  });

  describe("getters and setters", () => {
    let rect: PDFRectangle;

    beforeEach(() => {
      rect = PDFRectangle.create(doc.update);
    });

    it("should set and get llX", () => {
      rect.llX = 10;
      expect(rect.llX).toBe(10);
      expect(rect.get(0, PDFNumeric).value).toBe(10);
    });

    it("should set and get llY", () => {
      rect.llY = 20;
      expect(rect.llY).toBe(20);
      expect(rect.get(1, PDFNumeric).value).toBe(20);
    });

    it("should set and get urX", () => {
      rect.urX = 30;
      expect(rect.urX).toBe(30);
      expect(rect.get(2, PDFNumeric).value).toBe(30);
    });

    it("should set and get urY", () => {
      rect.urY = 40;
      expect(rect.urY).toBe(40);
      expect(rect.get(3, PDFNumeric).value).toBe(40);
    });
  });

  describe("toArray", () => {
    it("should convert rectangle to array", () => {
      const rect = PDFRectangle.createWithData(doc.update, 10, 20, 30, 40);
      const array = rect.toArray();
      expect(array).toEqual([10, 20, 30, 40]);
    });

    it("should throw error if rectangle does not have 4 coordinates", () => {
      const rect = PDFRectangle.create(doc.update);
      rect.items.pop(); // Remove one coordinate
      expect(() => rect.toArray()).toThrow(
        "The rectangle must have 4 coordinates"
      );
    });

    it("should throw error if coordinates are not numbers", () => {
      const rect = PDFRectangle.create(doc.update);
      rect.items[0] = doc.createString("not a number");
      expect(() => rect.toArray()).toThrow(
        "All rectangle coordinates must be numbers"
      );
    });
  });
});
