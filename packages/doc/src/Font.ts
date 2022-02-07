import * as core from "@peculiarventures/pdf-core";
import * as pdfFont from "@peculiarventures/pdf-font";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import { PDFDocument } from "./Document";
import { WrapObject } from "./WrapObject";
import { PDFLiteralString, Type1FontDictionary } from "@peculiarventures/pdf-core";

export interface FontComponentParams {
  fontDictionary: core.FontDictionary;
  document: PDFDocument;
  fontInfo?: pdfFont.FontInfo;
  name: string;
}

export interface CMapsParams {
  name: string;
  cidSystemInfo: {
    registry: string;
    ordering: string;
  }
  glyphs: pdfFont.FontGlyph[];
}
export class FontComponent extends WrapObject<core.FontDictionary> {
  public static readonly DEFAULT_FONT = pdfFont.DefaultFonts.Helvetica;
  public static readonly DEFAULT_SIZE = 12;

  public fontInfo: pdfFont.FontInfo;
  public name: string;
  public fontFile?: BufferSource;

  public static toFontDictionary(dict: core.PDFDictionary): core.FontDictionary {
    if (dict instanceof core.FontDictionary) {
      return dict;
    }

    const type = dict.get("Type", core.PDFName);
    if (type.text !== "Font") {
      throw new Error("Incorrect PDF Dictionary type.");
    }
    const subtype = dict.get("Subtype", core.PDFName);
    switch (subtype.text) {
      case core.Type0FontDictionary.SUBTYPE:
        return dict.to(core.Type0FontDictionary, true);
        break;
      case core.Type1FontDictionary.SUBTYPE:
        return dict.to(core.Type1FontDictionary, true);
      default:
        throw new Error("Incorrect PDF Dictionary type.");
    }
  }

  constructor(params: FontComponentParams) {
    super(params.fontDictionary, params.document);
    if (params.fontInfo) {
      this.fontInfo = params.fontInfo;
    } else {
      if (params.fontDictionary instanceof core.Type1FontDictionary) {
        if (Object.values<string>(pdfFont.DefaultFonts).includes(params.fontDictionary.BaseFont)) {
          this.fontInfo = pdfFont.FontFactory.createDefault(params.fontDictionary.BaseFont as pdfFont.DefaultFonts);
        } else {
          throw new Error(`Cannot create fontInfo by ${params.fontDictionary.BaseFont}`);
        }
      } else if (params.fontDictionary instanceof core.Type0FontDictionary) {
        const cid = params.fontDictionary.DescendantFonts.get(0, core.CIDFontDictionary);

        const fontFile = cid.FontDescriptor.fontFile || cid.FontDescriptor.fontFile2 || cid.FontDescriptor.fontFile3;
        if (!fontFile) {
          throw new Error(`Not found fontfile for '${params.name}'`);
        }
        this.fontInfo = pdfFont.FontFactory.create(fontFile.decodeSync());
      } else {
        throw new Error("Not implemented condition");
      }
    }
    this.name = params.name;
  }

  public addText(text: string): void {
    if (this.target instanceof Type1FontDictionary) {
      const maxUnicode = PDFLiteralString.getMaxUnicode(text);
      if (maxUnicode > 255 && this.target.BaseFont !== pdfFont.DefaultFonts.Symbol && this.target.BaseFont !== pdfFont.DefaultFonts.ZapfDingbats) {
        throw new Error("Unsupported unicodes for this default font");
      }
    }
  }

  public static addFont(doc: PDFDocument, font: pdfFont.DefaultFonts | BufferSource = FontComponent.DEFAULT_FONT): FontComponent {

    let fontObj: FontComponent;

    if (!BufferSourceConverter.isBufferSource(font)) {
      fontObj = this.addDefault(font, doc);

    } else {
      fontObj = this.addComposite(font, doc);
    }

    return fontObj;
  }

  private static findFont(font: string, document: PDFDocument): core.FontDictionary | null {
    const obj = document.target.update.items.find(i => {

      // TODO need upgrade and optimize (add cash) equal?
      if (i.type !== core.PDFDocumentObjectTypes.free && i.value instanceof core.PDFDictionary) {
        if (i.value.has("Type")) {
          const type = i.value.get("Type");
          if (type && type instanceof core.PDFName && type.text === "Font") {
            const baseFont = this.findFieldByName(i.value, "BaseFont");
            let fontDescriptor;
            if (i.value.has("FontDescriptor")) {
              fontDescriptor = i.value.get("FontDescriptor");
            }
            if (baseFont === font) {
              return i.value;
            } else if (fontDescriptor) {
              const fontDescriptor = i.value.get("FontDescriptor") as core.PDFDictionary;
              const fontName = this.findFieldByName(fontDescriptor, "FontName");
              if (fontName === font) {
                return i.value;
              }
            }
          }
        }
      }
    });

    return obj ? obj.value as core.FontDictionary : null;
  }

  private static findFieldByName(value: core.PDFDictionary, fieldName: string): string | null {
    if (value.has(fieldName)) {
      const baseFont = value.get(fieldName);
      if (baseFont && baseFont instanceof core.PDFName) {
        return baseFont.text;
      }
    }

    return null;
  }

  private static addDefault(font: pdfFont.DefaultFonts, document: PDFDocument): FontComponent {
    let fontObj = this.findFont(font, document);
    let fontInfo: pdfFont.FontInfo;

    if (!fontObj) {
      fontObj = core.Type1FontDictionary.create(document.target.update);
      if (fontObj instanceof core.Type1FontDictionary) {
        fontObj.BaseFont = font;
      }

      document.target.append(fontObj);
    }

    if (fontObj instanceof core.Type1FontDictionary) {
      fontInfo = pdfFont.FontFactory.createDefault(font);
    } else {
      throw new Error("Default font is not of type 'Type1'");
    }

    return new FontComponent({
      fontDictionary: fontObj,
      document,
      fontInfo,
      name: font,
    });
  }

  public measureTextWidth(text: string, size: number): number {
    let width = 0;
    const scale = 1000 / this.fontInfo.unitsPerEm;

    for (const letter of text) {
      const glyph = this.fontInfo.findGlyph(letter.charCodeAt(0));
      width += glyph ? glyph.advanceWidth : 0;
    }
    width *= scale;

    return width * size / 1000;
  }

  public measureTextHeight(fontSize: number, descent = true): number {
    const scale = 1000 / this.fontInfo.unitsPerEm;

    return (this.fontInfo.ascent - (descent ? this.fontInfo.descent : 0)) / 1000 * fontSize * scale;
  }

  private static addComposite(font: pdfFont.DefaultFonts | BufferSource, document: PDFDocument): FontComponent {

    let fontInfo: pdfFont.FontInfo;
    let fontFile: core.PDFStream | null = null;

    if (BufferSourceConverter.isBufferSource(font)) {
      fontInfo = pdfFont.FontFactory.create(font);

      // add font stream
      fontFile = document.target.createStream(font);

    } else {
      fontInfo = pdfFont.FontFactory.createDefault(font);
    }

    const uuidName = core.UUID.generate();
    if (!fontInfo.name.fontFamily) {
      fontInfo.name.fontFamily = uuidName;
    }
    if (!fontInfo.name.fullName) {
      fontInfo.name.fullName = uuidName;
    }
    if (!fontInfo.name.postScriptName) {
      fontInfo.name.postScriptName = uuidName;
    }

    // add fonts
    const font0 = this.createFont0(fontInfo, document);
    const fontCID = this.createCIDFont(fontInfo, font0, document);

    // add toUnicode
    const nameCmap = core.UUID.generate();
    const toUnicodeBuffer = this.drawCMaps({
      cidSystemInfo: {
        registry: "PeculiarVentures",
        ordering: "UCS"
      },
      name: nameCmap,
      glyphs: fontInfo.glyphs,
    });
    const toUnicodeStream = document.target.createStream(toUnicodeBuffer);
    toUnicodeStream.set("CMapName", document.target.createName(nameCmap));
    font0.ToUnicode = toUnicodeStream.makeIndirect();

    // add font Descriptor
    const fontDescriptor = this.createFontDescriptor(fontInfo, document, fontFile);
    fontCID.FontDescriptor = fontDescriptor.makeIndirect();

    // add DescendantFonts
    font0.DescendantFonts = document.target.createArray(fontCID.makeIndirect());

    return new FontComponent({
      fontDictionary: font0,
      document,
      fontInfo,
      name: font0.BaseFont,
    });
  }

  public static createFont0(fontInfo: pdfFont.FontInfo, document: PDFDocument): core.Type0FontDictionary {
    const font = core.Type0FontDictionary.create(document.target.update);

    font.BaseFont = `PDFHLP+${fontInfo.name.postScriptName}`;

    return font;
  }

  public static createCIDFont(fontInfo: pdfFont.FontInfo, font0: core.Type0FontDictionary, document: PDFDocument): core.CIDFontDictionary {
    const font = core.CIDFontDictionary.create(document.target.update);

    const widthsObject = this.getWidthArrayByString(fontInfo, document);
    font.W.set(widthsObject);

    font.BaseFont = font0.BaseFont;

    const cidSystemInfo = core.CIDSystemInfoDictionary.create(document.target.update);
    cidSystemInfo.Registry = "Adobe";
    cidSystemInfo.Ordering = "Identity";
    cidSystemInfo.Supplement = 0;
    font.CIDSystemInfo = cidSystemInfo;

    font.CIDToGIDMap = document.target.createName("Identity");

    return font;
  }

  private static createFontDescriptor(fontInfo: pdfFont.FontInfo, document: PDFDocument, fontFile: core.PDFStream | null): core.FontDescriptorDictionary {
    const scale = 1000 / fontInfo.unitsPerEm;

    const fontDescriptor = core.FontDescriptorDictionary.create(document.target.update);
    if (fontFile) {
      fontDescriptor.fontFile2 = fontFile.makeIndirect();
    }
    fontDescriptor.fontName = fontInfo.name.fullName;
    fontDescriptor.fontFamily = fontInfo.name.fontFamily;
    fontDescriptor.fontBBox = core.PDFRectangle.createWithData(document.target.update, fontInfo.head.xMin * scale, fontInfo.head.yMin * scale, fontInfo.head.xMax * scale, fontInfo.head.yMax * scale);
    fontDescriptor.italicAngle = fontInfo.post.italicAngle;
    fontDescriptor.ascent = fontInfo.head.yMax * scale;
    fontDescriptor.descent = fontInfo.head.yMin * scale;
    fontDescriptor.capHeight = fontInfo.os2.sCapHeight * scale;
    fontDescriptor.xHeight = fontInfo.os2.sxHeight * scale;
    fontDescriptor.fontWeight = fontInfo.os2.usWeightClass; // Optional
    fontDescriptor.stemV = (50 + Math.pow(fontInfo.os2.usWeightClass / 65, 2)); // ??? Very unclear how to calculate this value
    fontDescriptor.flags |= core.FontDescriptorFlags.nonsymbolic;
    fontDescriptor.flags |= core.FontDescriptorFlags.serif;

    return fontDescriptor;
  }

  private static getWidthArrayByString(fontInfo: pdfFont.FontInfo, document: PDFDocument): core.PDFArray {
    const array: Array<core.PDFNumeric | core.PDFArray> = [];
    const scale = 1000 / fontInfo.unitsPerEm;

    array.push(document.target.createNumber(0));
    const widths = document.target.createArray();
    array.push(widths);
    for (const glyph of fontInfo.glyphs) {
      widths.push(document.target.createNumber(glyph.advanceWidth * scale));
    }

    return document.target.createArray(...array);
  }

  public static drawCMaps(params: CMapsParams): ArrayBuffer {
    const viewWriter = new core.ViewWriter();

    viewWriter.writeStringLine("/CIDInit /ProcSet findresource begin");
    viewWriter.writeStringLine("1 dict begin");
    viewWriter.writeStringLine("begincmap");

    viewWriter.writeStringLine(`/CIDSystemInfo <</Registry (${params.cidSystemInfo.registry}) /Ordering (${params.cidSystemInfo.ordering}) /Supplement 0>> def`);

    viewWriter.writeStringLine(`/CMapName /${params.name} def`);
    viewWriter.writeStringLine("/CMapType 2 def");

    viewWriter.writeStringLine("1 begincodespacerange");

    viewWriter.writeStringLine("<0000> <FFFF>");

    viewWriter.writeStringLine("endcodespacerange");
    viewWriter.writeStringLine(`${params.glyphs.length} beginbfchar`);

    for (const glyph of params.glyphs) {
      if (glyph.unicode.length) {
        const keyHex = glyph.index.toString(16).toUpperCase().padStart(4, "0");
        const valueHex = glyph.unicode[0].toString(16).toUpperCase().padStart(4, "0");
        viewWriter.writeStringLine(`<${keyHex}> <${valueHex}>`);
      }
    }

    viewWriter.writeStringLine("endbfchar");

    viewWriter.writeStringLine("endcmap");
    viewWriter.writeStringLine("CMapName currentdict");
    viewWriter.writeStringLine("CMap defineresource pop");
    viewWriter.writeStringLine("end");
    viewWriter.writeStringLine("end");

    return viewWriter.toArrayBuffer();
  }
}

export enum TextAlignment {
  left = "left",
  center = "center",
  right = "right",
  justify = "justify",
}

export interface TextStyle {
  size: number;
  color: core.Colors
  bgColor?: core.Colors
  underline: boolean;
  strikeThrough: boolean;
}
export interface TextBlock {
  text: string;
  font: FontComponent;
  style: TextStyle;
  link?: string;
}

export class TextRectangle {

  public constructor(
    public left = 0,
    public top = 0,
    public width = 0,
    public height = 0) { }
}

export class TextRowItem extends TextRectangle {
  public ascent = 0;
  public descent = 0;
  public space = 0;

  constructor(
    public original: TextBlock,
    fontMetrics: FontMetrics = { ascent: 0, descent: 0, height: 0 },
    public text: string = "") {
    super();

    this.ascent = fontMetrics.ascent;
    this.descent = fontMetrics.descent;
    this.height = fontMetrics.height;
  }

  public push(char: string, glyphWidth: number): void {
    this.text += char;
    this.width += glyphWidth;
    if (char === " ") {
      this.space += glyphWidth;
    } else {
      this.space = 0;
    }
  }

}
export interface TextBlockParams {
  text: string;
  font: FontComponent;
  style?: Partial<TextStyle>
  link?: string;
}

export interface TextCalculateParams {
  blocks: TextBlockParams[];
  width: core.TypographySize;
  align?: TextAlignment;
  leading?: number;
}

export class TextRow extends TextRectangle {
  public items: TextRowItem[] = [];
  public ascent = 0;
  public descent = 0;
  public fontSize = 0;
  public space = 0;
  public leading = 0;

  public push(item: TextRowItem): TextRowItem {
    if (item.text) {
      item.left = this.width;

      if (item.ascent > this.ascent) {
        this.ascent = item.ascent;
      }
      if (item.descent < this.descent) {
        this.descent = item.descent;
      }

      this.width += item.width;
      this.space = item.space;

      if (item.height > this.height) {
        this.height = item.height;
      }

      if (item.original.style.size > this.fontSize) {
        this.fontSize = item.original.style.size;
      }

      this.items.push(item);
    }

    return item;
  }
}

export interface GlyphSize {
  ascent: number;
  descent: number;
  width: number;
}

export interface FontMetrics {
  ascent: number;
  descent: number;
  height: number;
}

export class TextBlocks extends TextRectangle {

  public rows: TextRow[] = [];
  public leading = 1;

  public last(): TextRow | null {
    if (this.rows.length) {
      return this.rows[this.rows.length - 1];
    }

    return null;
  }

  public push(row: TextRow): TextRow {
    const last = this.last();

    let leading = row.ascent;
    if (last) {
      leading -= last.descent;
    }
    leading *= this.leading;

    // Compute row position in current text block
    row.top = this.height + leading;
    row.leading = leading;

    // Increase text block height by added row height
    this.height += row.height;

    this.rows.push(row);

    return row;
  }

  public prepare(align = TextAlignment.left): void {
    for (const row of this.rows) {
      // Horizontal alignment
      switch (align) {
        case TextAlignment.right:
          row.left = this.width - row.width + row.space;
          break;
        case TextAlignment.center:
          row.left = (this.width - row.width + row.space) / 2;
          break;
        case TextAlignment.left:
        default:
      }

      for (const item of row.items) {
        item.top = row.ascent - item.ascent;
      }
    }
  }

}

export class TextSizeCounter {

  private static readonly NEW_LINE_CHAR = "\n";
  private static readonly SPACE_CHAR = " ";
  private static readonly MINUS_CHAR = "-";

  private static getDefaultStyle(style?: Partial<TextStyle>): TextStyle {
    return {
      size: 12,
      color: 0, // black
      strikeThrough: false,
      underline: false,
      ...style,
    };
  }

  public static getGlyphWidth(charCode: number, font: FontComponent, style: TextStyle): number {
    const glyph = font.fontInfo.findGlyph(charCode);
    const width = (glyph ? glyph.advanceWidth : 0) * style.size / font.fontInfo.unitsPerEm;

    return width;
  }

  public static getFontMetrics(font: FontComponent, style: TextStyle): FontMetrics {
    const scale = style.size / font.fontInfo.unitsPerEm;
    const ascent = font.fontInfo.ascent * scale;
    const descent = font.fontInfo.descent * scale;

    return {
      ascent,
      descent,
      height: ascent - descent,
    };
  }

  public static calculate(params: TextCalculateParams): TextBlocks {
    const width = core.TypographyConverter.toPoint(params.width);
    const res = new TextBlocks();
    res.width = width;
    res.leading = params.leading || 1;

    let row = new TextRow();
    for (const block of params.blocks) {
      const style = this.getDefaultStyle(block.style);
      const original = Object.assign(block, { style });
      const fontMetrics = this.getFontMetrics(block.font, style);

      // Init empty
      let rowItem = new TextRowItem(original, fontMetrics);
      let word = { text: "", width: 0 };
      for (const char of block.text) {
        if (char === TextSizeCounter.NEW_LINE_CHAR) {
          // New line
          word.text + char;
          rowItem.push(word.text, word.width);
          word = { text: "", width: 0 };

          row.push(rowItem);
          rowItem = new TextRowItem(original, fontMetrics);

          res.push(row);
          row = new TextRow();

          continue;
        }
        // Measure glyph size
        const glyphWidth = this.getGlyphWidth(char.charCodeAt(0), block.font, style);

        const rowWidth = row.width + rowItem.width + word.width + glyphWidth;
        if (width < rowWidth && char !== TextSizeCounter.SPACE_CHAR) {
          if (word.width + glyphWidth > width) {
            // if world length more than text block width split it
            rowItem.push(word.text, word.width);
            word = { text: "", width: 0 };
          }

          row.push(rowItem);
          rowItem = new TextRowItem(original, fontMetrics);

          res.push(row);
          row = new TextRow();
        }

        if (char === TextSizeCounter.SPACE_CHAR) {
          if (word.text) {
            rowItem.push(word.text, word.width);

            word = { text: "", width: 0 };
          }
          rowItem.push(char, glyphWidth);
        } else if (char === TextSizeCounter.MINUS_CHAR) {
          rowItem.push(word.text, word.width);
          rowItem.push(char, glyphWidth);

          word = { text: "", width: 0 };
        } else {
          word.text += char;
          word.width += glyphWidth;
        }
      }

      if (rowItem.text || word.text) {
        rowItem.push(word.text, word.width);
        row.push(rowItem);
      }
    }

    if (row.items.length) {
      res.push(row);
    }

    res.prepare(params.align);

    return res;
  }

}
