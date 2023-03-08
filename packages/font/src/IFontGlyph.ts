/**
 * Interface representing a font glyph
 * @remarks
 * A font glyph is a specific graphical representation of a character in a font.
 */
export interface IFontGlyph {
  /**
   * Index of the glyph in the font
   */
  index: number;
  /**
   * The glyph's advance width, in font units.
   */
  advanceWidth: number;
  /**
   * Unicode scalar value(s) associated with the glyph
   */
  unicode: number[];
}
