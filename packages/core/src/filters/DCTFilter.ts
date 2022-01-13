import { Filter } from "./Filter";

export class DCTFilter extends Filter {

	public static readonly NAME = "DCTDecode";
	public name = DCTFilter.NAME;

	public static get className(): string {
		return "DCTFilter";
	}

	public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

	public decodeSync(stream: Uint8Array): ArrayBuffer {
		return stream.slice().buffer;
	}

	public encodeSync(stream: Uint8Array): ArrayBuffer {
		return stream.slice().buffer;
	}
}
