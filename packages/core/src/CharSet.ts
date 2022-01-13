import { Convert } from "pvtsutils";

export class CharSet {
  public static readonly newLineChar = 0x0A; // \n
  public static readonly whiteSpaceChars = new Uint8Array([0x00, 0x09, 0x0A, 0x0C, 0x0D, 0x20]); // NUL \t \n \f \r 
  public static readonly lessThanChar = 0x3c;
  public static readonly greaterThanChar = 0x3e;
  public static readonly hexadecimalChars = new Uint8Array(Convert.FromUtf8String("01234567890abcdefABCDEF"));
  public static readonly endOfLineChars = new Uint8Array([0x0A, 0x0D]); // \n \r 
  public static readonly percentChar = 0x25; // %
  public static readonly whiteSpaceChar = 0x20;
  public static readonly trailerChars = new Uint8Array([0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72]);
  public static readonly startXrefChars = new Uint8Array([0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66]);
  public static readonly xrefChars = new Uint8Array([0x78, 0x72, 0x65, 0x66]);
}
