import { Filter } from "./Filter";

export class LZWFilter extends Filter {

  public static readonly NAME = "LZWDecode";
  public name = LZWFilter.NAME;

  public static get className(): string {
    return "LZWFilter";
  }

  public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

  public decodeSync(stream: Uint8Array): ArrayBuffer {
    return stream;
  }

  public encodeSync(stream: Uint8Array): ArrayBuffer {
    return stream;
  }

}
