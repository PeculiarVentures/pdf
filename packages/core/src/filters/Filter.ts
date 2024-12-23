import type { PDFDictionary } from "../objects";

export abstract class Filter {
  public abstract name: string;

  constructor(public decodeParams: PDFDictionary | null = null) {}

  /**
   * Decode data using current filter
   * @param stream The stream to work on
   * @param typeString String representation of the primary type for input stream
   */
  public abstract decode(stream: Uint8Array): Promise<ArrayBuffer>;

  /**
   * Encode data using current filter
   * @param stream The stream to work on
   * @param typeString String representation of the primary type for input stream
   */
  public abstract encode(stream: Uint8Array): Promise<ArrayBuffer>;

  /**
   * Decode data using current filter
   * @param stream The stream to work on
   * @param typeString String representation of the primary type for input stream
   */
  public abstract decodeSync(stream: Uint8Array): ArrayBuffer;

  /**
   * Encode data using current filter
   * @param stream The stream to work on
   * @param typeString String representation of the primary type for input stream
   */
  public abstract encodeSync(stream: Uint8Array): ArrayBuffer;
}
