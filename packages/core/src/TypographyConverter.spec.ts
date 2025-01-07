import { TypographyConverter } from "./TypographyConverter";
import { PDFNumeric } from "./objects/Numeric";

describe("TypographyConverter", () => {
  it("in to pt", () => {
    const pt = TypographyConverter.toPoint("8.2677in");
    expect(pt).toBe(595.27);
  });

  it("mm to pt", () => {
    const pt = TypographyConverter.toPoint("210mm");
    expect(pt).toBe(595.28);
  });

  it("cm to pt", () => {
    const pt = TypographyConverter.toPoint("29.7cm");
    expect(pt).toBe(841.89);
  });

  describe("toPDFNumeric", () => {
    it("converts inch to PDFNumeric", () => {
      const num = TypographyConverter.toPDFNumeric("8.2677in");
      expect(num).toBeInstanceOf(PDFNumeric);
      expect(num.value).toBe(595.27);
    });

    it("converts mm to PDFNumeric", () => {
      const num = TypographyConverter.toPDFNumeric("210mm");
      expect(num).toBeInstanceOf(PDFNumeric);
      expect(num.value).toBe(595.28);
    });

    it("converts cm to PDFNumeric", () => {
      const num = TypographyConverter.toPDFNumeric("29.7cm");
      expect(num).toBeInstanceOf(PDFNumeric);
      expect(num.value).toBe(841.89);
    });
  });
});
