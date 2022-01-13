import { Filter } from "./Filter";


export class JPXFilter extends Filter {

	public static readonly NAME = "JPXDecode";
	public name = JPXFilter.NAME;

	public static get className(): string {
		return "JPXFilter";
	}

	public async decode(view: Uint8Array): Promise<ArrayBuffer> {
		return this.decodeSync(view);
	}

	public async encode(view: Uint8Array): Promise<ArrayBuffer> {
		return this.encodeSync(view);
	}

	public decodeSync(stream: Uint8Array): ArrayBuffer {
		return stream.buffer;
	}

	public encodeSync(stream: Uint8Array): ArrayBuffer {
		return stream.buffer;
	}

}
