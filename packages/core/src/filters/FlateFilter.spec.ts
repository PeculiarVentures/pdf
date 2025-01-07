import { FlateFilter } from "./FlateFilter";
import * as pako from "pako";
import { PDFDictionary } from "../objects/Dictionary";
import { PDFNumeric } from "../objects/Numeric";

describe("FlateFilter", () => {
  let filter: FlateFilter;

  beforeEach(() => {
    filter = new FlateFilter();
  });

  it("should have correct name", () => {
    expect(filter.name).toBe("FlateDecode");
  });

  describe("decode", () => {
    it("should decode data asynchronously", async () => {
      const input = new Uint8Array([120, 156, 75, 76, 28, 5, 200, 0, 0, 0]);
      const result = await filter.decode(input);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it("should handle empty input", async () => {
      const input = new Uint8Array([]);
      const result = await filter.decode(input);
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(0);
    });
  });

  describe("decodeSync", () => {
    it("should decode data with default parameters", () => {
      const original = new Uint8Array([1, 2, 3, 4]);
      const compressed = pako.deflate(original);
      const result = new Uint8Array(filter.decodeSync(compressed));
      expect(result).toEqual(original);
    });

    it("should handle TIFF predictor", () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const compressed = pako.deflate(original);
      filter.decodeParams = new PDFDictionary();
      filter.decodeParams.set("Predictor", new PDFNumeric(2));
      filter.decodeParams.set("Columns", new PDFNumeric(3));

      const result = new Uint8Array(filter.decodeSync(compressed));
      expect(result).toBeDefined();
    });

    it("should handle PNG predictor", () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const compressed = pako.deflate(original);
      filter.decodeParams = new PDFDictionary();
      filter.decodeParams.set("Predictor", new PDFNumeric(10));
      filter.decodeParams.set("Columns", new PDFNumeric(2));
      filter.decodeParams.set("Colors", new PDFNumeric(3));
      filter.decodeParams.set("BitsPerComponent", new PDFNumeric(8));

      const result = new Uint8Array(filter.decodeSync(compressed));
      expect(result).toBeDefined();
    });

    it("should throw error on invalid compressed data", () => {
      const invalidData = new Uint8Array([1, 2, 3, 4]);
      expect(() => filter.decodeSync(invalidData)).toThrow();
    });
  });

  describe("encode", () => {
    it("should encode data asynchronously", async () => {
      const input = new Uint8Array([1, 2, 3, 4]);
      const result = await filter.encode(input);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe("encodeSync", () => {
    it("should encode data", () => {
      const input = new Uint8Array([1, 2, 3, 4]);
      const encoded = filter.encodeSync(input);
      const decoded = new Uint8Array(
        filter.decodeSync(new Uint8Array(encoded))
      );
      expect(decoded).toEqual(input);
    });
  });
});
