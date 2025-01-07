import * as fs from "fs";
import * as path from "path";
import { DefaultFonts } from "./DefaultFonts";
import { FontFactory } from "./FontFactory";

describe("FontFactory", () => {
  const fontPath = path.join(__dirname, "../fonts/Helvetica.ttf");
  const fontBuffer = fs.readFileSync(fontPath);

  describe("create", () => {
    it("should create font from buffer source", () => {
      const font = FontFactory.create(fontBuffer);
      expect(font).toBeTruthy();
      expect(font.name.fontFamily).toBe("Helvetica");
    });

    it("should create font from default fonts", () => {
      const font = FontFactory.create(DefaultFonts.Helvetica);
      expect(font).toBeTruthy();
      expect(font.name.fontFamily).toBe("Helvetica");
    });
  });

  describe("createDefault", () => {
    it("should create default font", () => {
      const font = FontFactory.createDefault(DefaultFonts.Helvetica);
      expect(font).toBeTruthy();
      expect(font.name.fontFamily).toBe("Helvetica");
    });

    it("should return cached font on second call", () => {
      const font1 = FontFactory.createDefault(DefaultFonts.Helvetica);
      const font2 = FontFactory.createDefault(DefaultFonts.Helvetica);
      expect(font1).toBe(font2);
    });

    it("should throw error for invalid default font", () => {
      expect(() => {
        FontFactory.createDefault("InvalidFont" as DefaultFonts);
      }).toThrow();
    });
  });

  describe("createFile", () => {
    it("should create font from file buffer", () => {
      const font = FontFactory.createFile(fontBuffer);
      expect(font).toBeTruthy();
      expect(font.name.fontFamily).toBe("Helvetica");
      expect(font.name.fontSubfamily).toBe("Regular");
      expect(font.name.fullName).toBe("Helvetica");
      expect(font.name.postScriptName).toBe("Helvetica");
    });

    it("should set font metrics correctly", () => {
      const font = FontFactory.createFile(fontBuffer);
      expect(font.unitsPerEm).toBeGreaterThan(0);
      expect(font.ascent).toBeGreaterThan(0);
      expect(font.descent).toBeLessThan(0);
      expect(font.head.xMin).toBeDefined();
      expect(font.head.xMax).toBeDefined();
      expect(font.head.yMin).toBeDefined();
      expect(font.head.yMax).toBeDefined();
    });

    it("should parse OS/2 table", () => {
      const font = FontFactory.createFile(fontBuffer);
      expect(font.os2.sCapHeight).toBeGreaterThanOrEqual(0);
      expect(font.os2.sxHeight).toBeGreaterThanOrEqual(0);
      expect(font.os2.usWeightClass).toBeGreaterThan(0);
    });

    it("should parse POST table", () => {
      const font = FontFactory.createFile(fontBuffer);
      expect(font.post.italicAngle).toBeDefined();
    });

    it("should parse glyphs", () => {
      const font = FontFactory.createFile(fontBuffer);
      expect(font.glyphs.length).toBeGreaterThan(0);
      expect(font.glyphs[0]).toBeTruthy();
      expect(font.glyphs[0].advanceWidth).toBeGreaterThanOrEqual(0);
    });
  });

  describe("subsetFont", () => {
    it("should create subset font with specified characters", () => {
      const text = "Hello, World!";
      const subset = FontFactory.subsetFont(fontBuffer, text);

      expect(subset).toBeInstanceOf(ArrayBuffer);
      expect(subset.byteLength).toBeLessThan(fontBuffer.length);

      // Create font from subset to verify it's valid
      const subsetFont = FontFactory.createFile(subset);
      expect(subsetFont).toBeTruthy();
      expect(subsetFont.name.fontFamily).toBe("Helvetica");
    });

    it("should handle empty text", () => {
      const subset = FontFactory.subsetFont(fontBuffer, "");
      expect(subset).toBeInstanceOf(ArrayBuffer);
    });

    it("should handle special characters", () => {
      const text = "Hello, World! ©®™€£¥";
      const subset = FontFactory.subsetFont(fontBuffer, text);
      expect(subset).toBeInstanceOf(ArrayBuffer);
    });
  });
});
