import { ByteStream, SeqStream } from "bytestreamjs";
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
    let blockLength = 0;
    let count = 0;

    const result = new SeqStream({
      appendBlock: stream.buffer.byteLength
    });

    while ((blockLength = stream[count++]) !== 0x80) {
      if (blockLength < 128) {
        result.append(new ByteStream(stream.subarray(count, blockLength + 1)));
        count += (blockLength + 1);
      } else {
        const buffer = new ArrayBuffer(257 - blockLength);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < (257 - blockLength); i++)
          view[i] = stream[count];

        result.append(new ByteStream({ buffer }));
        count++;
      }
    }

    return result.stream.buffer.slice(0, result.start);
  }

  public encodeSync(stream: Uint8Array): ArrayBuffer {
    throw new Error("Method not implemented");
  }

}
