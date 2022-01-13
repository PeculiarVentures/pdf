import { AsnConvert } from "@peculiar/asn1-schema";
import * as bsjs from "bytestreamjs";
import * as fontjs from "fontjs";
import * as pako from "pako";
import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import { DefaultFonts, DefaultFontsZip } from "./DefaultFonts";
import { FontGlyph } from "./FontGlyph";
import { FontInfo } from "./FontInfo";


export abstract class FontFactory {
  private static readonly cache = new Map<DefaultFonts, FontInfo>();

  public static create(source: DefaultFonts | BufferSource): FontInfo {
    if (BufferSourceConverter.isBufferSource(source)) {
      return this.createFile(source);
    }

    return this.createDefault(source);
  }

  public static createDefault(source: DefaultFonts): FontInfo {
    let font = this.cache.get(source);

    if (font) {
      return font;
    }

    const fontZip = DefaultFontsZip.get(source);
    if (!fontZip) {
      throw new Error(`Cannot get default font '${DefaultFonts}. ZIP cached value doesn't exist'`);
    }
    font = AsnConvert.parse(pako.ungzip(new Uint8Array(Convert.FromBase64(fontZip))), FontInfo);

    // Add font to cache
    this.cache.set(source, font);

    return font;
  }

  public static createFile(source: BufferSource): FontInfo {
    const buffer = BufferSourceConverter.toArrayBuffer(source);
    const font = fontjs.Font.fromStream(new bsjs.SeqStream({ stream: new bsjs.ByteStream({ buffer }) }));

    const fontInfo = new FontInfo();

    // NAME
    const name = font.tables.get(fontjs.Tables.NAME.tag) as fontjs.Tables.NAME;
    if (name) {
      fontInfo.name.fontFamily = name.getName(fontjs.Tables.NameIDs.fontFamilyName) || "";
      fontInfo.name.fontSubfamily = name.getName(fontjs.Tables.NameIDs.fontSubFamilyName) || "";
      fontInfo.name.fullName = name.getName(fontjs.Tables.NameIDs.fullFontName) || "";
      fontInfo.name.postScriptName = name.getName(fontjs.Tables.NameIDs.postScriptFontName) || "";
    }

    // HEAD
    const head = font.tables.get(fontjs.Tables.HEAD.tag) as fontjs.Tables.HEAD;
    fontInfo.head.xMin = head.xMin;
    fontInfo.head.xMax = head.xMax;
    fontInfo.head.yMin = head.yMin;
    fontInfo.head.yMax = head.yMax;
    fontInfo.unitsPerEm = font.unitsPerEm;

    // OS2
    const os2 = font.tables.get(fontjs.Tables.OS2.tag) as fontjs.Tables.OS2;
    fontInfo.os2.sCapHeight = os2.sCapHeight || 0;
    fontInfo.os2.sxHeight = os2.sxHeight || 0;
    fontInfo.os2.usWeightClass = os2.usWeightClass || 0;

    // POST
    const post = font.tables.get(fontjs.Tables.POST.tag) as fontjs.Tables.POST;
    if (post) {
      fontInfo.post.italicAngle = post.italicAngle;
    }

    // HHEA
    const hhea = font.tables.get(fontjs.Tables.HHEA.tag) as fontjs.Tables.HHEA;
    fontInfo.ascent = hhea.ascent;
    fontInfo.descent = hhea.descent;

    // GLYPH
    for (let i = 0; i < font.glyphs.length; i++) {
      const item = font.glyphs[i];
      const glyph = new FontGlyph({
        index: i,
        advanceWidth: item.hAdvanceWidth || 0,
        unicode: item.unicodes || [],
      });

      fontInfo.glyphs.push(glyph);
    }

    return fontInfo;
  }

  private static getIndexes(fontjs: fontjs.Font, text: string): number[] {
    const indexes: number[] = [0, 0];
    for (const char of text) {
      const glyph = fontjs.findUnicodeGlyph(char);
      if (glyph && glyph.index) {
        if (!glyph.unicodes) {
          glyph.unicodes = [];
        }
        glyph.unicodes.push(char.charCodeAt(0));
        if (!indexes.includes(glyph.index)) {
          indexes.push(glyph.index);
        }
      }
    }

    return indexes;
  }

  public static subsetFont(source: BufferSource, text: string): ArrayBuffer {
    const buffer = BufferSourceConverter.toArrayBuffer(source);
    const font = fontjs.Font.fromStream(new bsjs.SeqStream({ stream: new bsjs.ByteStream({ buffer }) }));

    const gids = this.getIndexes(font, text);

    //#region Prepare correct values for "ascent" and "descent"
    const glyphs = font.glyphs;

    const yMax = [];
    const yMin = [];

    for (const element of gids) {
      const glyph = glyphs[element];
      yMax.push(glyph.yMax);
      yMin.push(glyph.yMin);
    }
    //#endregion

    const post = font.tables.get(fontjs.Tables.POST.tag);
    post.glyphNameIndex = [];
    post.names = [];

    const hhea = font.tables.get(fontjs.Tables.HHEA.tag) as fontjs.Tables.HHEA;
    const head = font.tables.get(fontjs.Tables.HEAD.tag) as fontjs.Tables.HEAD;

    const newFont = font.subset({
      tables: new Map([
        [
          fontjs.Tables.OS2.tag,
          font.tables.get(fontjs.Tables.OS2.tag)
        ],
        [
          fontjs.Tables.POST.tag,
          post
        ],
      ]),
      glyphIndexes: gids,
      fontValues: {
        unitsPerEm: head.unitsPerEm,
        ascent: hhea.ascent,
        descent: hhea.descent,
        lineGap: hhea.lineGap,
      },
      cmaps: [
        {
          format: 4,
          language: 0,
          platformID: 3,
          platformSpecificID: 1
        }
      ],
      cmapLanguage: 0
    });

    const newFontStream = new bsjs.SeqStream();
    newFont.toStream(newFontStream);

    return newFontStream.buffer;
  }

}
