import { AsnConvert } from "@peculiar/asn1-schema";
import * as fs from "node:fs";
import * as path from "node:path";
import { FontFactory, type FontInfo } from "@peculiar/pdf-font";
import * as pako from "pako";
import { base64 } from "@peculiar/utils";

const pdfFontNames: { [key: string]: string } = {
  Courier: "Courier",
  CourierBold: "Courier-Bold",
  CourierBoldOblique: "Courier-BoldOblique",
  CourierOblique: "Courier-Oblique",
  Helvetica: "Helvetica",
  HelveticaBold: "Helvetica-Bold",
  HelveticaBoldOblique: "Helvetica-BoldOblique",
  HelveticaOblique: "Helvetica-Oblique",
  Symbol: "Symbol",
  TimesBold: "Times-Bold",
  TimesBoldItalic: "Times-BoldItalic",
  TimesItalic: "Times-Italic",
  TimesRoman: "Times-Roman",
  ZapfDingbats: "ZapfDingbats",
};

function main() {
  const filesDir = path.join(import.meta.dirname, "..", "fonts");
  const srcDir = path.join(import.meta.dirname, "..", "src");
  const filesDirInfo = fs.readdirSync(filesDir);
  const map = new Map<string, FontInfo>();
  for (const item of filesDirInfo) {
    if (!item.endsWith("ttf")) {
      continue;
    }

    const fontFile = path.join(filesDir, item);
    const fontRaw = fs.readFileSync(fontFile);

    const fontInfo = FontFactory.create(fontRaw);
    // Use only ASCII unicode
    if (item.startsWith("C") || item.startsWith("H") || item.startsWith("T")) {
      fontInfo.glyphs = fontInfo.glyphs.filter((o) => {
        const unicode = o.unicode.filter((c) => c <= 0xff);
        if (unicode.length) {
          o.unicode = unicode;
          return true;
        }

        return false;
      });
    }

    const name = item.split(".")[0];
    map.set(name, fontInfo);
  }

  const constFileText: string[] = [];
  // Write enum
  constFileText.push("");
  constFileText.push("export enum DefaultFonts {");
  for (const [key, value] of map) {
    const name = pdfFontNames[key];
    constFileText.push(`  ${key} = "${name || value.name.fullName}",`);
  }
  constFileText.push("}");

  // Write constants
  constFileText.push("");
  constFileText.push("export const DefaultFontsZip = new Map<DefaultFonts, string>();");
  constFileText.push("");
  for (const [key, value] of map) {
    const fontInfoRaw = AsnConvert.serialize(value);
    const compressedValue = base64.encode(pako.gzip(new Uint8Array(fontInfoRaw), { level: 9 }));
    constFileText.push(`DefaultFontsZip.set(DefaultFonts.${key}, "${compressedValue}");`);
  }
  constFileText.push("");
  const constFile = path.join(srcDir, "DefaultFonts.ts");
  fs.writeFileSync(constFile, constFileText.join("\n"), { flag: "w+" });
}

main();
