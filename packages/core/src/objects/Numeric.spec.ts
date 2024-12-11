import { PDFNull } from "./Null";
import { PDFNumeric } from "./Numeric";

describe("Numeric", () => {
  describe("fromPDF", () => {
    const vector: [string, number][] = [
      //#region Integer
      ["123", 123],
      ["43445", 43445],
      ["+17", 17],
      ["-98", -98],
      ["0", 0],
      //#endregion
      //#region Real
      ["34.5", 34.5],
      ["-3.62", -3.62],
      ["+123.6", 123.6],
      ["4.", 4],
      ["-.002", -0.002],
      ["0.0", 0]
      //#endregion
    ];
    vector.forEach(([i, o]) => {
      it(`should parse ${i} correctly`, () => {
        const parsedItem = PDFNumeric.fromPDF(i);
        expect(parsedItem.value).toBe(o);
      });
    });
  });

  describe("toPDF", () => {
    const vector: [number, string][] = [
      //#region Integer
      [123, "123"],
      [43445, "43445"],
      [-98, "-98"],
      [0, "0"],
      //#endregion
      //#region Real
      [34.5, "34.5"]
      //#endregion
    ];
    vector.forEach(([i, o]) => {
      it(`should convert ${i} to PDF correctly`, () => {
        const parsedItem = new PDFNumeric(i);
        const view = parsedItem.toPDF();
        expect(Buffer.from(view).toString()).toBe(o);
      });
    });
  });

  describe("toString", () => {
    const vector: [number, string][] = [
      [123, "123"],
      [34.5, "34.5"],
      [34.567, "34.567"],
      [34.5678, "34.568"], // rounds to 3 decimal places
      [0.12345, "0.123"]
    ];
    vector.forEach(([input, expected]) => {
      it(`should convert ${input} to string correctly`, () => {
        const num = new PDFNumeric(input);
        expect(num.toString()).toBe(expected);
      });
    });
  });

  describe("copy", () => {
    it("should create an exact copy", () => {
      const original = new PDFNumeric(123.456);
      const copy = original.copy();
      expect(copy).toBeInstanceOf(PDFNumeric);
      expect(copy.value).toBe(original.value);
      expect(copy).not.toBe(original);
    });
  });

  describe("equal", () => {
    it("should return true for equal numbers", () => {
      const num1 = new PDFNumeric(123.456);
      const num2 = new PDFNumeric(123.456);
      expect(num1.equal(num2)).toBe(true);
    });

    it("should return false for different numbers", () => {
      const num1 = new PDFNumeric(123.456);
      const num2 = new PDFNumeric(123.457);
      expect(num1.equal(num2)).toBe(false);
    });

    it("should return false for different types", () => {
      const num = new PDFNumeric(123);
      const other = new PDFNull();
      expect(num.equal(other)).toBe(false);
    });
  });

  describe("assertPositiveInteger", () => {
    it("should not throw for positive integers", () => {
      const num = new PDFNumeric(123);
      expect(() => PDFNumeric.assertPositiveInteger(num)).not.toThrow();
    });

    it("should throw for negative numbers", () => {
      const num = new PDFNumeric(-123);
      expect(() => PDFNumeric.assertPositiveInteger(num)).toThrow(
        "Number is not a positive integer"
      );
    });

    it("should throw for decimals", () => {
      const num = new PDFNumeric(123.456);
      expect(() => PDFNumeric.assertPositiveInteger(num)).toThrow(
        "Number is not a positive integer"
      );
    });
  });

  describe("fromPDF error cases", () => {
    it("should throw for empty input", () => {
      expect(() => PDFNumeric.fromPDF("")).toThrow(
        "Numeric sequence not found"
      );
    });

    it("should throw for non-numeric input", () => {
      expect(() => PDFNumeric.fromPDF("abc")).toThrow(
        "Numeric sequence not found at position 0 at position 0"
      );
    });
  });
});
