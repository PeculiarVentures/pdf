import * as asn from "@peculiar/asn1-schema";
import { FontGlyph } from "./FontGlyph";
import { FontHead } from "./FontHead";
import { FontName } from "./FontName";
import { FontOS2 } from "./FontOS2";
import { FontPost } from "./FontPost";

@asn.AsnType({ type: asn.AsnTypeTypes.Sequence })
export class FontInfo {

  @asn.AsnProp({ type: FontName })
  public name = new FontName();

  @asn.AsnProp({ type: FontHead })
  public head = new FontHead();

  @asn.AsnProp({ type: FontOS2 })
  public os2 = new FontOS2();
  
  @asn.AsnProp({ type: FontPost })
  public post = new FontPost();

  @asn.AsnProp({ type: FontGlyph, repeated: "set" })
  public glyphs: FontGlyph[] = [];

  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public unitsPerEm = 0;
  
  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public ascent = 0;
  
  @asn.AsnProp({ type: asn.AsnPropTypes.Integer })
  public descent = 0;

  /**
   * Looks for the GLYPH by the unicode
   * @param code unicode
   * @returns 
   */
  public findGlyph(code: number): FontGlyph | null {
    for (const glyph of this.glyphs) {
      if (glyph.unicode.includes(code)) {
        return glyph;
      }
    }

    return null;
  }

  /**
   * Returns the list of GLYPH for specified string
   * @param text string
   * @returns 
   */
  public getGlyphs(text: string): FontGlyph[] {
    const res: FontGlyph[] = [];

    let unique = "";
    for (const char of text) {
      if (!unique.includes(char)) {
        unique += char;
        const code = char.charCodeAt(0);
        const glyph = this.findGlyph(code);
        if (glyph && !res.includes(glyph)) {
          // Add unique glyph to result
          res.push(glyph);
        }
      }
    }

    res.sort(FontInfo.sortByIndex);

    return res;
  }

  private static sortByIndex(a: FontGlyph, b: FontGlyph): number {
    if (a.index < b.index) {
      return -1;
    }
    if (a.index > b.index) {
      return 1;
    }

    return 0;
  }

}
