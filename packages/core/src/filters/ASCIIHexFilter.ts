import { ByteStream } from "bytestreamjs";
import { Filter } from "./Filter";

export class ASCIIHexFilter extends Filter {

	public static readonly NAME = "ASCIIHexDecode";
	public name = ASCIIHexFilter.NAME;

	public static get className(): string {
		return "ASCIIHexFilter";
	}

	public async decode(view: Uint8Array): Promise<ArrayBuffer> {
		return this.decodeSync(view);
	}

	public async encode(view: Uint8Array): Promise<ArrayBuffer> {
		return this.encodeSync(view);
	}

	public decodeSync(stream: Uint8Array): ArrayBuffer {
		const result = new ByteStream({
			hexstring: new ByteStream({ view: stream }).toString(),
		});

		return result.view.slice().buffer;
	}

	public encodeSync(stream: Uint8Array): ArrayBuffer {
		const result = new ByteStream({
			string: new ByteStream({ view: stream }).toHexString(),
		});

		return result.view.slice().buffer;
	}

}
