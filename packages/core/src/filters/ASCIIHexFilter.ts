import * as bs from "bytestreamjs";
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
		const result = new bs.ByteStream({
			hexstring: new bs.ByteStream({ view: stream }).toString(),
		});

		return result.view.slice().buffer;
	}

	public encodeSync(stream: Uint8Array): ArrayBuffer {
		const result = new bs.ByteStream({
			string: new bs.ByteStream({ view: stream }).toHexString(),
		});

		return result.view.slice().buffer;
	}

}
