import { Filter } from "./Filter";

export class CCITTFaxFilter extends Filter {

  public static readonly NAME = "CCITTFaxDecode";
  public name = CCITTFaxFilter.NAME;

  public static get className(): string {
    return "CCITTFaxFilter";
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
