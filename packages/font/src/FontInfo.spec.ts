import { FontGlyph } from "./FontGlyph";
import { FontInfo } from "./FontInfo";

describe("FontInfo", () => {
  let fontInfo: FontInfo;

  beforeEach(() => {
    fontInfo = new FontInfo();
    // Add some test glyphs
    fontInfo.glyphs = [
      new FontGlyph({ index: 0, advanceWidth: 500, unicode: [] }), // .notdef
      new FontGlyph({ index: 1, advanceWidth: 600, unicode: [65] }), // 'A'
      new FontGlyph({ index: 2, advanceWidth: 600, unicode: [66] }), // 'B'
      new FontGlyph({ index: 3, advanceWidth: 600, unicode: [67] }), // 'C'
      new FontGlyph({ index: 4, advanceWidth: 600, unicode: [169] }), // '©'
      new FontGlyph({ index: 5, advanceWidth: 600, unicode: [8364] }) // '€'
    ];
  });

  describe("constructor", () => {
    it("should initialize with default values", () => {
      const info = new FontInfo();
      expect(info.name).toBeDefined();
      expect(info.head).toBeDefined();
      expect(info.os2).toBeDefined();
      expect(info.post).toBeDefined();
      expect(info.glyphs).toEqual([]);
      expect(info.unitsPerEm).toBe(0);
      expect(info.ascent).toBe(0);
      expect(info.descent).toBe(0);
    });
  });

  describe("findGlyph", () => {
    it("should find existing glyph by unicode", () => {
      const glyph = fontInfo.findGlyph(65); // 'A'
      expect(glyph).toBeTruthy();
      expect(glyph?.index).toBe(1);
    });

    it("should return null for non-existing unicode", () => {
      const glyph = fontInfo.findGlyph(999);
      expect(glyph).toBeNull();
    });

    it("should find special characters", () => {
      const copyright = fontInfo.findGlyph(169); // '©'
      expect(copyright).toBeTruthy();
      expect(copyright?.index).toBe(4);

      const euro = fontInfo.findGlyph(8364); // '€'
      expect(euro).toBeTruthy();
      expect(euro?.index).toBe(5);
    });
  });

  describe("getGlyphs", () => {
    it("should return glyphs for simple text", () => {
      const glyphs = fontInfo.getGlyphs("ABC");
      expect(glyphs).toHaveLength(3);
      expect(glyphs[0].index).toBe(1); // A
      expect(glyphs[1].index).toBe(2); // B
      expect(glyphs[2].index).toBe(3); // C
    });

    it("should handle repeated characters", () => {
      const glyphs = fontInfo.getGlyphs("AABBCC");
      expect(glyphs).toHaveLength(3);
    });

    it("should return empty array for non-existing characters", () => {
      const glyphs = fontInfo.getGlyphs("123");
      expect(glyphs).toHaveLength(0);
    });

    it("should handle mixed existing and non-existing characters", () => {
      const glyphs = fontInfo.getGlyphs("A1B2C3");
      expect(glyphs).toHaveLength(3);
    });

    it("should handle special characters", () => {
      const glyphs = fontInfo.getGlyphs("A©€");
      expect(glyphs).toHaveLength(3);
      expect(glyphs.map((g) => g.index)).toEqual([1, 4, 5]);
    });

    it("should return glyphs sorted by index", () => {
      const glyphs = fontInfo.getGlyphs("€A©");
      expect(glyphs.map((g) => g.index)).toEqual([1, 4, 5]);
    });

    it("should handle empty string", () => {
      const glyphs = fontInfo.getGlyphs("");
      expect(glyphs).toHaveLength(0);
    });
  });
});
