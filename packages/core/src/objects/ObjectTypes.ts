import type { PDFArray } from "./Array";
import type { PDFBoolean } from "./Boolean";
import type { PDFDictionary } from "./Dictionary";
import type { PDFHexString } from "./HexString";
import type { PDFIndirectReference } from "./IndirectReference";
import type { PDFLiteralString } from "./LiteralString";
import type { PDFName } from "./Name";
import type { PDFNull } from "./Null";
import type { PDFNumeric } from "./Numeric";
import type { PDFTextString } from "./TextString";

export type PDFObjectTypes = PDFNull |
  PDFBoolean | PDFNumeric | PDFLiteralString | PDFHexString | PDFName |
  PDFDictionary | PDFArray | PDFIndirectReference | PDFTextString;
