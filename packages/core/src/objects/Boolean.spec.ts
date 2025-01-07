import { PDFBoolean } from "./Boolean";

describe("Boolean", () => {
  describe("to/from PDF", () => {
    const check = (v: boolean, h: string) => {
      const item = new PDFBoolean(v);

      const view = item.toPDF();
      expect(Buffer.from(view).toString()).toBe(h);

      const parsedItem = PDFBoolean.fromPDF(view);
      expect(parsedItem.value).toBe(item.value);
    };

    const checkReadError = (input: string, error: typeof Error) => {
      expect(() => PDFBoolean.fromPDF(Buffer.from(input))).toThrow(error);
    };

    it("false", () => {
      check(false, "false");
    });

    it("true", () => {
      check(true, "true");
    });

    it("should throw error on incomplete 'false'", () => {
      checkReadError("fals", Error);
    });

    it("should throw error on extra characters in 'true'", () => {
      checkReadError("template", Error);
    });

    it("should throw error on capitalized 'true'", () => {
      checkReadError("True", Error);
    });
  });

  describe("equal", () => {
    it("should return true for equal boolean values", () => {
      const bool1 = new PDFBoolean(true);
      const bool2 = new PDFBoolean(true);
      expect(bool1.equal(bool2)).toBe(true);
    });

    it("should return false for different boolean values", () => {
      const bool1 = new PDFBoolean(true);
      const bool2 = new PDFBoolean(false);
      expect(bool1.equal(bool2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return 'true' for true value", () => {
      const bool = new PDFBoolean(true);
      expect(bool.toString()).toBe("true");
    });

    it("should return 'false' for false value", () => {
      const bool = new PDFBoolean(false);
      expect(bool.toString()).toBe("false");
    });
  });

  describe("copy", () => {
    it("should create a copy with the same value", () => {
      const bool = new PDFBoolean(true);
      const copy = bool.copy();
      expect(copy.value).toBe(true);
      expect(copy).not.toBe(bool);
    });
  });
});
