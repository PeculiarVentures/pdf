import { PDFArray } from "./Array";
import { PDFBoolean } from "./Boolean";
import { PDFComment } from "./Comment";
import { PDFDictionary } from "./Dictionary";
import { PDFHexString } from "./HexString";
import { PDFIndirectReference } from "./IndirectReference";
import { PDFLiteralString } from "./LiteralString";
import { PDFName } from "./Name";
import { PDFNull } from "./Null";
import { PDFNumeric } from "./Numeric";
import { PDFObjectReader } from "./ObjectReader";
import { PDFStream } from "./Stream";

// Register all PDF types in PDFObjectReader
PDFObjectReader.register(PDFName);
PDFObjectReader.register(PDFNull);
PDFObjectReader.register(PDFIndirectReference);
PDFObjectReader.register(PDFLiteralString);
PDFObjectReader.register(PDFHexString);
PDFObjectReader.register(PDFArray);
PDFObjectReader.register(PDFStream);
PDFObjectReader.register(PDFDictionary);
PDFObjectReader.register(PDFNumeric);
PDFObjectReader.register(PDFBoolean);
PDFObjectReader.register(PDFComment);
