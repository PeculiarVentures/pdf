import { ByteStream, SeqStream } from "bytestreamjs";
import { Predictor } from "./Predicator";

export class PNGPredictor extends Predictor {

	public static readonly className = "PNGPredictor";

	public decode(stream: ByteStream): ByteStream {
		//#region Initial variables
		const result = new SeqStream({
			stream: new ByteStream(),
			appendBlock: stream.buffer.byteLength
		});

		const streamLength = stream.buffer.byteLength;

		const bytesPerPixel = (this.colors * this.bitsPerComponent + 7) >> 3;
		const bytesPerRow = (this.colors * this.bitsPerComponent * this.columns + 7) >> 3;

		let count = 0;

		const row = new Uint8Array(bytesPerRow);
		//#endregion
		//#region Store initial data from "Stream"
		this.prevData = stream.copy(0, stream.view.length);
		//#endregion
		while (count < streamLength) {
			const type = stream.view[count++];
			// row.set(new Uint8Array(stream.buffer, count, bytesPerRow));
			row.set(stream.view.subarray(count, count + bytesPerRow));
			count += bytesPerRow;

			switch (type) {
				//#region Filter type 0: None
				case 0:
					result.append(new ByteStream({
						view: row
					}));
					break;
				//#endregion
				//#region Filter type 1: Sub
				case 1:
					{
						for (let i = 0; i < bytesPerPixel; i++)
							result.appendChar(row[i]);

						for (let i = bytesPerPixel; i < bytesPerRow; i++)
							result.appendChar((row[i] + result.stream.view[result.start - bytesPerPixel]) & 0xFF);
					}
					break;
				//#endregion
				//#region Filter type 2: Up
				case 2:
					{
						for (let i = 0; i < bytesPerRow; i++)
							result.appendChar((row[i] + (result.stream.view[result.start - bytesPerRow] || 0)) & 0xFF);
					}
					break;
				//#endregion
				//#region Filter type 3: Average
				case 3:
					{
						for (let i = 0; i < bytesPerPixel; ++i)
							result.appendChar(((result.stream.view[result.start - bytesPerRow] || 0) >> 1) + row[i]);

						for (let i = bytesPerPixel; i < bytesPerRow; ++i)
							result.appendChar((((result.stream.view[result.start - bytesPerRow] || 0) + (result.stream.view[result.start - bytesPerPixel] || 0) >> 1) + row[i]) & 0xFF);
					}
					break;
				//#endregion
				//#region Filter type 4: Paeth
				case 4:
					{
						for (let i = 0; i < bytesPerPixel; ++i)
							result.appendChar(((result.stream.view[result.start - bytesPerRow] || 0) + row[i]) & 0xFF);

						for (let i = bytesPerPixel; i < bytesPerRow; ++i) {
							const a = (result.stream.view[result.start - bytesPerPixel] || 0);
							const b = (result.stream.view[result.start - bytesPerRow] || 0);
							const c = (result.stream.view[result.start - bytesPerRow - bytesPerPixel] || 0);

							const p = a + b - c;

							let pa = p - a;
							if (pa < 0)
								pa = -pa;

							let pb = p - b;
							if (pb < 0)
								pb = -pb;

							let pc = p - c;
							if (pc < 0)
								pc = -pc;

							switch (true) {
								case ((pa <= pb) && (pa <= pc)):
									result.appendChar((a + row[i]) & 0xFF);
									break;
								case (pb <= pc):
									result.appendChar((b + row[i]) & 0xFF);
									break;
								default:
									result.appendChar((c + row[i]) & 0xFF);
							}
						}
					}
					break;
				//#endregion
				//#region default
				default:
					throw new Error(`Unsupported predictor type: ${type}`);
				//#endregion
			}
		}

		//#region Initialize value of input Stream
		stream.buffer = result.stream.buffer.slice(0, result.start);
		stream.view = new Uint8Array(stream.buffer);
		//#endregion

		return stream;
	}

	public encode(stream: ByteStream): ByteStream {
		return stream;
	}

}
