import * as bs from "bytestreamjs";
import { Predictor } from "./Predicator";


export class TIFFPredictor extends Predictor {

	public static get className(): string {
		return "TIFFPredictor";
	}

	public decode(stream: bs.ByteStream): bs.ByteStream {
		return stream;
	}

	public encode(stream: bs.ByteStream): bs.ByteStream {
		return stream;
	}

}
