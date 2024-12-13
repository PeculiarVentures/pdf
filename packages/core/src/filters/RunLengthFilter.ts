import { Filter } from "./Filter";

export class RunLengthFilter extends Filter {
  public static readonly NAME = "RunLengthDecode";
  public name = RunLengthFilter.NAME;

  public static get className(): string {
    return "RunLengthFilter";
  }

  public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

  public decodeSync(stream: Uint8Array): ArrayBuffer {
    // Pre-allocate with input size as a reasonable starting point
    let result = new Uint8Array(stream.length);
    let resultPos = 0;

    let index = 0;
    while (index < stream.length) {
      const length = stream[index++];

      if (length === 0x80) {
        if (index < stream.length) {
          throw new Error(
            "RunLengthDecode: Unexpected end of data marker (EOD) found before end of stream"
          );
        }
        break;
      }

      if (length < 128) {
        // Copy length + 1 bytes literally
        const copyLength = length + 1;
        // Grow result buffer if needed
        if (resultPos + copyLength > result.length) {
          const newResult = new Uint8Array(result.length * 2);
          newResult.set(result);
          result = newResult;
        }
        result.set(stream.subarray(index, index + copyLength), resultPos);
        resultPos += copyLength;
        index += copyLength;
      } else {
        // Repeat single byte 257 - length times
        const repeatLength = 257 - length;
        const repeatByte = stream[index++];
        // Grow result buffer if needed
        if (resultPos + repeatLength > result.length) {
          const newResult = new Uint8Array(result.length * 2);
          newResult.set(result);
          result = newResult;
        }
        result.fill(repeatByte, resultPos, resultPos + repeatLength);
        resultPos += repeatLength;
      }
    }

    if (index >= stream.length && stream[index - 1] !== 0x80) {
      // Note: Missing EOD marker in RunLengthDecode stream
    }

    return result.buffer.slice(0, resultPos);
  }

  public encodeSync(_stream: Uint8Array): ArrayBuffer {
    throw new Error("Method not implemented");
  }
}
