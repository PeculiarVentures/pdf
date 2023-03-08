import { IFontGlyph } from "./IFontGlyph";

/**
 * Information about a font.
 */
export interface IFontInfo {
  /**
   * The number of font units per em square.
   */
  unitsPerEm: number;
  /**
   * The font's ascent value, defined as the vertical distance from the baseline to the top of the font.
   */
  ascent: number;
  /**
   * The font's descent value, defined as the vertical distance from the baseline to the bottom of the font.
   */
  descent: number;

  /**
   * Looks for the GLYPH by the unicode
   * @param code unicode
   * @returns
   */
  findGlyph(code: number): IFontGlyph | null;
}
