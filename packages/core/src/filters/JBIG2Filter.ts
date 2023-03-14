import { Filter } from "./Filter";


export class JBIG2Filter extends Filter {

  public static readonly NAME = "JBIG2Decode";
  public name = JBIG2Filter.NAME;

  public static get className(): string {
    return "JBIG2Filter";
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
