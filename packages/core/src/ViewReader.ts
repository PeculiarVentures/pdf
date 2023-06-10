import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";

export type ViewReaderFindCallback = (value: number, index: number, array: Uint8Array, reader: ViewReader) => boolean;

export class ViewReader {

  public view: Uint8Array;
  public position = 0;
  public backward = false;

  public get isEOF(): boolean {
    return this.position < 0 || this.position >= this.view.length;
  }

  constructor(view: BufferSource) {
    this.view = BufferSourceConverter.toUint8Array(view);
  }


  /**
   * Finds index of the first element that satisfies the callback function. If not found, returns -1.
   * @param param Callback function, view or text to find
   * @returns Returns index of the first element that satisfies the callback function. If not found, returns -1.
   */
  public findIndex(cb: ViewReaderFindCallback): number;
  /**
   * Finds index of the first element that satisfies the view. If not found, returns -1.
   * @param view View to find
   * @returns Returns index of the first element that satisfies the view. If not found, returns -1.
   */
  public findIndex(view: Uint8Array): number;
  /**
   * Finds index of the first element that satisfies the text. If not found, returns -1.
   * @param text Text to find
   * @returns Returns index of the first element that satisfies the text. If not found, returns -1.
   */
  public findIndex(text: string): number;
  public findIndex(param: ViewReaderFindCallback | Uint8Array | string): number;
  public findIndex(param: ViewReaderFindCallback | Uint8Array | string): number {
    if (typeof param === "function") {
      return this.findIndexByCallback(param);
    } else if (typeof param === "string") {
      return this.findIndexByString(param);
    } else {
      return this.findIndexByView(param);
    }
  }

  /**
   * Finds index of the first element that satisfies the callback function. If not found, returns -1.
   * @param cb Callback function
   * @returns Returns index of the first element that satisfies the callback function. If not found, returns -1.
   */
  protected findIndexByCallback(cb: ViewReaderFindCallback): number {
    const step = this.backward ? -1 : 1;

    for (this.position; true; this.position += step) {
      const value = this.view[this.position];
      if (value === undefined) {
        break;
      }
      if (cb(value, this.position, this.view, this)) {
        return this.position;
      }
    }

    return -1;
  }

  /**
   * Finds index of the first element that satisfies the callback function. If not found, returns -1.
   * @param text Text to find
   * @returns Returns index of the first element that satisfies the text. If not found, returns -1.
   */
  protected findIndexByString(text: string): number {
    const buffer = Convert.FromUtf8String(text);
    const view = new Uint8Array(buffer);

    return this.findIndexByView(view);
  }

  /**
   * Finds index of the first element that satisfies the callback function. If not found, returns -1.
   * @param view View to find
   * @returns Returns index of the first element that satisfies the view. If not found, returns -1.
   */
  protected findIndexByView(view: Uint8Array): number {
    const viewCopy = view.slice();
    if (this.backward) {
      viewCopy.reverse();
    }

    return this.findIndex((c, i, a) => {
      for (let j = 0; j < viewCopy.length; j++) {
        if (a[this.backward ? i-- : i++] !== viewCopy[j]) {
          return false;
        }
      }

      return true;
    });
  }

  public readByte(): number {
    const res = this.view[this.position];

    this.position += this.backward ? -1 : 1;

    return res;
  }

  public readUint8(): number {
    return this.readByte();
  }

  public readUint16(littleEndian = false): number {
    const dataView = new DataView(this.read(2).slice().buffer);

    return dataView.getUint16(0, littleEndian);
  }

  public readUint32(littleEndian = false): number {
    const bytes = this.read(4).slice();

    if (littleEndian) {
      bytes.reverse();
    }

    const view = new Uint32Array(bytes.buffer);

    return view[0];
  }

  public readString(size: number): string {
    const bytes = this.read(size);

    return Convert.ToBinary(bytes);
  }

  public read(): Uint8Array;
  public read(length: number): Uint8Array;
  public read(text: string): Uint8Array;
  public read(view: Uint8Array): Uint8Array;
  public read(length: number): Uint8Array;
  public read(cb: ViewReaderFindCallback): Uint8Array;
  public read(param?: ViewReaderFindCallback | number | string | Uint8Array): Uint8Array;
  public read(param?: ViewReaderFindCallback | number | string | Uint8Array): Uint8Array {
    const startPosition = this.position;

    if (typeof param === "number") {
      this.position += this.backward ? -param : param;
    } else if (!param) {
      this.position = (this.backward) ? -1 : this.view.length;
    } else if (param) {
      this.position = this.findIndex(param);
      if (this.position === -1 && !this.backward) {
        this.position = this.view.length;
      }
    }

    return (this.backward)
      ? this.view.subarray(this.position, startPosition)
      : this.view.subarray(startPosition, this.position);
  }

  /**
   * Returns byte value at the current position, without cursor changing
   * @returns Byte value
   */
  public get current(): number | undefined {
    return this.view[this.position];
  }

  /**
   * Moves cursor to the end of the view
   */
  public end(): void {
    this.position = this.view.length - 1;
  }

  /**
   * Moves cursor to the beginning of the view
   */
  public start(): void {
    this.position = 0;
  }

}
