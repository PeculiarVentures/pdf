import { BufferSource, BufferSourceConverter } from "pvtsutils";
import { Filter } from "./Filter";

export class CryptFilter extends Filter {
  public static readonly NAME = "Crypt";
  public name = CryptFilter.NAME;

  public static get className(): string {
    return "CryptFilter";
  }

  public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

  public decodeSync(stream: BufferSource): ArrayBuffer {
    return BufferSourceConverter.toArrayBuffer(stream);
  }

  public encodeSync(stream: Uint8Array): ArrayBuffer {
    throw BufferSourceConverter.toArrayBuffer(stream);
  }
}
