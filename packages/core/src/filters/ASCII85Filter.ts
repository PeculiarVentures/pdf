import { CharSet } from "../CharSet";
import { Filter } from "./Filter";

const ASCII85_CODE_START = 33;
const ASCII85_CODE_END = 117;
const ASCII85_ZERO = 122;
const ASCII85_TILDE = 126;
const ASCII85_MORE = 62;
const ASCII85_BASE = 85;
const ASCII85_ENCODING_GROUP_LENGTH = 4;
const ASCII85_DECODING_GROUP_LENGTH = 5;

export class ASCII85Filter extends Filter {

	public static readonly NAME = "ASCII85Decode";
	public name = ASCII85Filter.NAME;

	public static get className(): string {
		return "ASCII85Filter";
	}

	public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

	public decodeSync(view: Uint8Array): ArrayBuffer {
		let zeroCount = 0;
		for (const charCode of view) {
			if (charCode === ASCII85_ZERO) {
				zeroCount++;
			}
		}
		const res = new Uint8Array(Math.floor(view.length * ASCII85_ENCODING_GROUP_LENGTH / ASCII85_DECODING_GROUP_LENGTH) + zeroCount * ASCII85_ENCODING_GROUP_LENGTH);
		let offset = 0;
		let state = 0;
		const bytes = new Uint8Array(ASCII85_DECODING_GROUP_LENGTH);
		for (const charCode of view) {
			if (CharSet.whiteSpaceChars.includes(charCode)) {
				continue;
			}
			if (charCode === ASCII85_TILDE) {
				break;
			}
			if (charCode === ASCII85_ZERO && state == 0) {
				res[offset++] = 0;
				res[offset++] = 0;
				res[offset++] = 0;
				res[offset++] = 0;
				continue;
			}
			if (charCode < ASCII85_CODE_START || charCode > ASCII85_CODE_END) {
				throw new Error("Illegal character in ASCII85 decode");
			}
			bytes[state++] = charCode - ASCII85_CODE_START;
			if (state === ASCII85_DECODING_GROUP_LENGTH) {
				let r = 0;
				for (let i = 0; i < ASCII85_DECODING_GROUP_LENGTH; i++) {
					r = r * ASCII85_BASE + bytes[i];
				}
				for (let i = 3; i >= 0; i--) {
					res[offset++] = r >> (8 * i);
				}

				state = 0;
			}
		}

		if (state) {
			// Remaining bytes
			let r = 0;
			for (let i = 0; i < ASCII85_DECODING_GROUP_LENGTH; i++) {
				r = r * ASCII85_BASE + (i >= state ? ASCII85_BASE : bytes[i]);
			}
			for (let i = 3; i > ASCII85_ENCODING_GROUP_LENGTH - state; i--) {
				res[offset++] = r >> (8 * i);
			}
		}

		return new Uint8Array(res.buffer.slice(0, offset));
	}

	public encodeSync(view: Uint8Array): ArrayBuffer {
		const bytes = new Uint8Array(ASCII85_DECODING_GROUP_LENGTH);
		let r = 0;

		// estimate output length and alloc buffer for it.
		let offset = 0;
		const len = Math.ceil(view.length * ASCII85_DECODING_GROUP_LENGTH / ASCII85_ENCODING_GROUP_LENGTH) + ASCII85_ENCODING_GROUP_LENGTH;
		const res = new Uint8Array(len + 2);

		// iterate over all data bytes.
		let state = 0;
		let current = 0;
		for (let i = state = current = 0; i < view.length; i++) {
			current = current * 256 + view[i];
			state++;

			if (state % ASCII85_ENCODING_GROUP_LENGTH) {
				continue;
			}

			if (current) {
				for (let j = ASCII85_ENCODING_GROUP_LENGTH; j >= 0; j--) {
					r = current % ASCII85_BASE;
					bytes[j] = r;
					current = (current - r) / ASCII85_BASE;
				}

				for (let j = 0; j < ASCII85_DECODING_GROUP_LENGTH; j++) {
					res[offset++] = bytes[j] + ASCII85_CODE_START;
				}
			} else {
				res[offset++] = ASCII85_ZERO;
			}

			current = 0;
			state = 0;
		}

		// add padding for remaining bytes.
		if (state) {
			if (current) {
				const padding = ASCII85_ENCODING_GROUP_LENGTH - state;

				for (let i = ASCII85_ENCODING_GROUP_LENGTH - state; i > 0; i--) {
					current *= 256;
				}

				for (let j = ASCII85_ENCODING_GROUP_LENGTH; j >= 0; j--) {
					r = current % ASCII85_BASE;
					bytes[j] = r;
					current = (current - r) / ASCII85_BASE;
				}

				for (let j = 0; j < ASCII85_DECODING_GROUP_LENGTH; j++) {
					res[offset++] = bytes[j] + ASCII85_CODE_START;
				}

				offset -= padding;
			} else {
				// If remaining bytes are zero, need to insert '!' instead of 'z'.
				// This is a special case.
				for (let i = 0; i < state + 1; i++) {
					res[offset++] = ASCII85_CODE_START;
				}
			}
		}

		// Add END
		res[offset++] = ASCII85_TILDE;
		res[offset++] = ASCII85_MORE;

		return new Uint8Array(res.buffer.slice(0, offset)).buffer;
	}

}
