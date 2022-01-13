import { ByteStream } from "bytestreamjs";
import { PDFDictionary, PDFNumeric } from "../objects";

export interface PredictorParameters {
  prevData?: ByteStream;
  colors?: number;
  bitsPerComponent?: number;
  columns?: number;
  parameters?: PDFDictionary;
}

export abstract class Predictor {

  public prevData: ByteStream;
  public colors: number;
  public bitsPerComponent: number;
  public columns: number;

  constructor(parameters: PredictorParameters = {}) {
    this.prevData = parameters.prevData ?? new ByteStream(); // Previous data, before action on "Stream"

    this.colors = parameters.colors ?? 1;
    this.bitsPerComponent = parameters.bitsPerComponent ?? 8;
    this.columns = parameters.columns ?? 1;

    if (parameters.parameters instanceof PDFDictionary) {
      const params = parameters.parameters;

      const valueColors = params.get("Colors", PDFNumeric);
      if (valueColors)
        this.colors = valueColors.value;

      const valueBitsPerComponent = params.get("BitsPerComponent", PDFNumeric);
      if (valueBitsPerComponent)
        this.bitsPerComponent = valueBitsPerComponent.value;

      const valueColumns = params.get("Columns", PDFNumeric);
      if (valueColumns)
        this.columns = valueColumns.value;
    }
  }

  public abstract decode(stream: ByteStream): ByteStream;

  public abstract encode(stream: ByteStream): ByteStream;

}
