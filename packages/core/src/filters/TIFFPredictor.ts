import { Predictor } from "./Predicator";

export class TIFFPredictor extends Predictor {
  public static get className(): string {
    return "TIFFPredictor";
  }

  public decode(view: Uint8Array): Uint8Array {
    return view;
  }

  public encode(view: Uint8Array): Uint8Array {
    return view;
  }
}
