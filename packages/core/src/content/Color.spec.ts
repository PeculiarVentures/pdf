import { ColorConverter } from "./Color";
import { PDFArray, PDFNumeric } from "../objects";

describe("ColorConverter", () => {
  describe("fromPDFNumberArray", () => {
    it("converts grayscale color", () => {
      const input = [new PDFNumeric(0.5)];
      const result = ColorConverter.fromPDFNumberArray(input);
      expect(result).toEqual([0.5]);
    });

    it("converts RGB color", () => {
      const input = [new PDFNumeric(1), new PDFNumeric(0), new PDFNumeric(0)];
      const result = ColorConverter.fromPDFNumberArray(input);
      expect(result).toEqual([1, 0, 0]);
    });

    it("converts CMYK color", () => {
      const input = [
        new PDFNumeric(0),
        new PDFNumeric(1),
        new PDFNumeric(1),
        new PDFNumeric(0)
      ];
      const result = ColorConverter.fromPDFNumberArray(input);
      expect(result).toEqual([0, 1, 1, 0]);
    });
  });

  describe("fromPDFArray", () => {
    it("converts empty array to white grayscale", () => {
      const input = new PDFArray();
      const result = ColorConverter.fromPDFArray(input);
      expect(result).toBe(1);
    });

    it("converts array with numeric values", () => {
      const input = new PDFArray(
        new PDFNumeric(1),
        new PDFNumeric(0),
        new PDFNumeric(0)
      );
      const result = ColorConverter.fromPDFArray(input);
      expect(result).toEqual([1, 0, 0]);
    });

    it("skips non-numeric values", () => {
      const input = new PDFArray(
        new PDFNumeric(1),
        {} as unknown as PDFNumeric,
        new PDFNumeric(0)
      );
      const result = ColorConverter.fromPDFArray(input);
      expect(result).toEqual([1, 0]);
    });
  });

  describe("toPDFNumberArray", () => {
    it("converts grayscale number", () => {
      const result = ColorConverter.toPDFNumberArray(0.5);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PDFNumeric);
      expect(result[0].value).toBe(0.5);
    });

    it("converts color array", () => {
      const result = ColorConverter.toPDFNumberArray([1, 0, 0]);
      expect(result).toHaveLength(3);
      result.forEach((item) => expect(item).toBeInstanceOf(PDFNumeric));
      expect(result.map((n) => n.value)).toEqual([1, 0, 0]);
    });
  });

  describe("toPDFArray", () => {
    it("converts grayscale to PDFArray", () => {
      const result = ColorConverter.toPDFArray(0.5);
      expect(result).toBeInstanceOf(PDFArray);
      expect(result.length).toBe(1);
      expect((result.get(0) as PDFNumeric).value).toBe(0.5);
    });

    it("converts color array to PDFArray", () => {
      const result = ColorConverter.toPDFArray([1, 0, 0]);
      expect(result).toBeInstanceOf(PDFArray);
      expect(result.length).toBe(3);
      const numbers = [];
      for (const item of result) {
        numbers.push((item as PDFNumeric).value);
      }
      expect(numbers).toEqual([1, 0, 0]);
    });
  });
});
