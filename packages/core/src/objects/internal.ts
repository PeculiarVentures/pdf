const zeroChar = 0x30;
const nineChar = 0x39;
const plusChar = 0x2b;
const minusChar = 0x2d;
const pointChar = 0x2e;

export function isDigit(char: number): boolean {
  return (zeroChar <= char && char <= nineChar) // [0-9]
    || char === plusChar // '+'
    || char === minusChar // '-'
    || char === pointChar; // '.'
}


export enum ObjectTypeEnum {
  Null = "PDFNull",
  Boolean = "PDFBoolean",
  Numeric = "PDFNumeric",
  Name = "PDFName",
  LiteralString = "PDFLiteralString",
  HexString = "PDFHexString",
  IndirectReference = "PDFIndirectReference",
  Array = "PDFArray",
  Dictionary = "PDFDictionary",
  Stream = "PDFStream",
  Comment = "PDFComment",
}
