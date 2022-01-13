import { ByteStream } from "bytestreamjs";
import { Predictor } from "./Predicator";


export class TIFFPredictor extends Predictor {

	public static get className(): string {
		return "TIFFPredictor";
	}

	public decode(stream: ByteStream): ByteStream {
		return stream;
	}

	public encode(stream: ByteStream): ByteStream {
		return stream;
	}

}
