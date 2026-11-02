import { describe, it, expect } from "vitest";
import { PDFHexString } from "./HexString";

describe("HexString", () => {
  describe("to/from PDF", () => {
    [
      ["<901FA3>", "901FA3"],
      ["<901FA>", "901FA0"],
    ].forEach(([i, o]) => {
      it(i, () => {
        const parsedItem = PDFHexString.fromPDF(i);
        expect(Buffer.from(parsedItem.text, "binary").toString("hex")).toBe(o.toLowerCase());

        // check data field
        expect(Buffer.from(parsedItem.data).toString("hex")).toBe(o.toLowerCase());

        const out = parsedItem.toPDF();
        expect(Buffer.from(out).toString("binary").toUpperCase()).toBe(`<${o}>`);

        // check toString
        expect(parsedItem.toString()).toBe(`<${o.toLowerCase()}>`);
      });
    });
  });

  describe("hex digits", () => {
    it("should ignore white space and write lowercase digits", () => {
      const item = PDFHexString.fromPDF("<AB C\n0 1>");
      expect(Buffer.from(item.data).toString("hex")).toBe("abc010");
      expect(item.toString()).toBe("<abc010>");
    });

    it("should pad an odd number of digits with a trailing zero", () => {
      expect(Buffer.from(PDFHexString.fromPDF("<ABC>").data).toString("hex")).toBe("abc0");
    });

    it("should reject characters that are not hex digits", () => {
      expect(() => PDFHexString.fromPDF("<ABXZ>")).toThrow();
    });
  });
});
