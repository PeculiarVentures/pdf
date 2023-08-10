import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import { CharSet } from "./CharSet";

export type ViewWriterCallback = (subarray: Uint8Array) => void;
export class ViewWriter {

  private buffer: [Uint8Array, ViewWriterCallback?][] = [];
  private totalLength = 0;

  public get length(): number {
    return this.totalLength;
  }

  private addToLength(length: number): void {
    this.totalLength += length;
  }

  public write(data: BufferSource, cb?: ViewWriterCallback): void {
    const uint8Data = BufferSourceConverter.toUint8Array(data);
    this.addToLength(uint8Data.length);
    this.buffer.push([uint8Data, cb]);
  }
  public writeLine(data?: BufferSource): void {
    if (data) {
      this.write(data);
    }
    this.writeByte(CharSet.newLineChar);
  }

  public writeByte(char: number): void {
    this.addToLength(1);
    this.buffer.push([new Uint8Array([char])]);
  }

  public writeByteLine(char: number): void {
    this.addToLength(2);
    this.buffer.push([new Uint8Array([char, CharSet.newLineChar])]);
  }

  public writeString(text: string): void {
    const uint8Text = new Uint8Array(Convert.FromBinary(text));
    this.addToLength(uint8Text.length);
    this.buffer.push([uint8Text]);
  }

  public writeStringLine(text: string): void {
    this.writeString(text);
    this.writeByte(CharSet.newLineChar);
  }

  public toArrayBuffer(): ArrayBuffer {
    return this.toUint8Array().buffer;
  }

  public toUint8Array(): Uint8Array {
    const res = new Uint8Array(this.totalLength);
    let offset = 0;

    for (const [item, cb] of this.buffer) {
      res.set(item, offset);

      if (cb) {
        cb(res.subarray(offset, offset + item.length));
      }

      offset += item.length;
    }

    return res;
  }

}
