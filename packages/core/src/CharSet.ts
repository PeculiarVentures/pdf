import { Convert } from "pvtsutils";

/**
 * Defines commonly used character codes and sets in PDF document processing
 */
export class CharSet {
  /** Line feed character (0x0a, \n) */
  public static readonly newLineChar = 0x0a;

  /** Common whitespace characters including NUL, tab, LF, FF, CR, and space */
  public static readonly whiteSpaceChars = new Uint8Array([
    0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20
  ]);

  /** Less than symbol '<' (0x3c) */
  public static readonly lessThanChar = 0x3c;

  /** Greater than symbol '>' (0x3e) */
  public static readonly greaterThanChar = 0x3e;

  /** Valid hexadecimal characters (0-9, a-f, A-F) */
  public static readonly hexadecimalChars = new Uint8Array(
    Convert.FromUtf8String("01234567890abcdefABCDEF")
  );

  /** Percent symbol '%' (0x25) */
  public static readonly percentChar = 0x25;

  /** Space character (0x20) */
  public static readonly whiteSpaceChar = 0x20;

  /** ASCII representation of 'trailer' keyword */
  public static readonly trailerChars = new Uint8Array([
    0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72
  ]);

  /** ASCII representation of 'xref' keyword */
  public static readonly xrefChars = new Uint8Array([0x78, 0x72, 0x65, 0x66]);
}
