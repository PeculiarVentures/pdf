import { ParsingError } from "../errors";
import { PDFNull } from "./Null";
import { PDFNumeric } from "./Numeric";

describe("Null", () => {
  describe("from/to PDF", () => {
    it('"null"', () => {
      const parsedItem = PDFNull.fromPDF("null");

      const view = parsedItem.toPDF();
      expect(Buffer.from(view).toString()).toBe("null");
    });

    it("not found", () => {
      expect(() => PDFNull.fromPDF("Null not found")).toThrow(ParsingError);
    });
  });

  describe("toString", () => {
    it("returns 'null'", () => {
      const nullObj = new PDFNull();
      expect(nullObj.toString()).toBe("null");
    });
  });

  describe("equal", () => {
    it("returns true for same type", () => {
      const null1 = new PDFNull();
      const null2 = new PDFNull();
      expect(null1.equal(null2)).toBe(true);
    });

    it("returns false for different type", () => {
      const nullObj = new PDFNull();
      const nonNullObj = new PDFNumeric(1);
      expect(nullObj.equal(nonNullObj)).toBe(false);
    });
  });
});
