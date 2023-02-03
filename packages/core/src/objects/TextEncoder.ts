import { Convert } from "pvtsutils";

export abstract class TextEncoder {

  public static readonly UTF8 = "\xEF\xBB\xBF";
  public static readonly UTF16 = "\xFE\xFF";

  /**
   * Converts the PDF string (with prefixes) into the string value
   * @param text PDF string
   * @returns 
   */
  public static from(text: string): string {
    if (text.startsWith(this.UTF16)) {
      return Convert.ToUtf16String(Convert.FromBinary(text.substring(this.UTF16.length)));
    } else if (text.startsWith(this.UTF8)) {
      return text.substring(this.UTF8.length);
    }

    return text;
  }

  /**
   * Converts the string value into the PDF string (with prefixes)
   * @param text String value
   * @returns 
   */
  public static to(text: string): string {
    let ascii = true;
    for (const char of text) {
      if (char.charCodeAt(0) > 0xFF) {
        ascii = false;
        break;
      }
    }

    if (ascii) {
      return text;
    }

    return `${this.UTF16}${Convert.ToBinary(Convert.FromUtf8String(text, "utf16be"))}`;
  }

}
