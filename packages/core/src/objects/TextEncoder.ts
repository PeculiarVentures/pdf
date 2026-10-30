import { binary, toArrayBuffer, utf16 } from "@peculiar/utils";

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
      return utf16.decode(toArrayBuffer(binary.decode(text.substring(this.UTF16.length))));
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
      if (char.charCodeAt(0) > 0xff) {
        ascii = false;
        break;
      }
    }

    if (ascii) {
      return text;
    }

    return `${this.UTF16}${binary.encode(toArrayBuffer(utf16.encode(text)))}`;
  }
}
