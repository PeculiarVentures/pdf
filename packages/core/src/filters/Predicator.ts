import { PDFNumeric } from "../objects/Numeric";
import { PDFDictionary } from "../objects/Dictionary";

export interface PredictorParameters {
  prevData?: Uint8Array;
  colors?: number;
  bitsPerComponent?: number;
  columns?: number;
  parameters?: PDFDictionary;
}

export abstract class Predictor {
  public prevData: Uint8Array;
  public colors: number;
  public bitsPerComponent: number;
  public columns: number;

  constructor(parameters: PredictorParameters = {}) {
    this.prevData = parameters.prevData ?? new Uint8Array(); // Previous data, before action on "Stream"

    this.colors = parameters.colors ?? 1;
    this.bitsPerComponent = parameters.bitsPerComponent ?? 8;
    this.columns = parameters.columns ?? 1;

    if (parameters.parameters instanceof PDFDictionary) {
      const params = parameters.parameters;

      const valueColors = params.get("Colors", PDFNumeric);
      if (valueColors) this.colors = valueColors.value;

      const valueBitsPerComponent = params.get("BitsPerComponent", PDFNumeric);
      if (valueBitsPerComponent)
        this.bitsPerComponent = valueBitsPerComponent.value;

      const valueColumns = params.get("Columns", PDFNumeric);
      if (valueColumns) this.columns = valueColumns.value;
    }
  }

  public abstract decode(view: Uint8Array): Uint8Array;

  public abstract encode(view: Uint8Array): Uint8Array;
}
