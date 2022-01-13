import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import { CharSet } from "./CharSet";

export type ViewWriterCallback = (subarray: Uint8Array) => void;
export class ViewWriter {

  private buffer: [Uint8Array, ViewWriterCallback?][] = [];

  public get length(): number {
    let length = 0;
    for (const [item,] of this.buffer) {
      length += item.length;
    }

    return length;
  }

  public write(data: BufferSource, cb?: ViewWriterCallback): void {
    this.buffer.push([BufferSourceConverter.toUint8Array(data), cb]);
  }
  public writeLine(data?: BufferSource): void {
    if (data) {
      this.write(data);
    }
    this.writeByte(CharSet.newLineChar);
  }

  public writeByte(char: number): void {
    this.buffer.push([new Uint8Array([char])]);
  }

  public writeByteLine(char: number): void {
    this.buffer.push([new Uint8Array([char, CharSet.newLineChar])]);
  }

  public writeString(text: string): void {
    this.buffer.push([new Uint8Array(Convert.FromBinary(text))]);
  }

  public writeStringLine(text: string): void {
    this.writeString(text);
    this.writeByte(CharSet.newLineChar);
  }

  public toArrayBuffer(): ArrayBuffer {
    return this.toUint8Array().buffer;
  }

  public toUint8Array(): Uint8Array {
    let length = 0;
    this.buffer
      .map(o => o[0])
      .map(o => o.length)
      .forEach(o => {
        length += o;
      });

    const res = new Uint8Array(length);
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
