import { Filter } from "./Filter";
import * as pako from "pako";
import { BufferSourceConverter } from "pvtsutils";
import { PDFNumeric } from "../objects/Numeric";
import { TIFFPredictor } from "./TIFFPredictor";
import { PNGPredictor } from "./PNGPredictor";

export interface FlateFilterBuildHuffmanCodesResult {
  codes: Record<number, string>;
  maximumLength: number;
}

export class FlateFilter extends Filter {
  public static readonly PREDICTOR = 1;
  public static readonly COLUMNS = 1;
  public static readonly COLORS = 1;
  public static readonly BITS_PER_COMPONENT = 8;

  public static readonly FIELD_PREDICTOR = "Predictor";
  public static readonly FIELD_COLUMNS = "Columns";
  public static readonly FIELD_COLORS = "Colors";
  public static readonly FIELD_BITS_PER_COMPONENT = "BitsPerComponent";

  public static readonly NAME = "FlateDecode";
  public name = FlateFilter.NAME;

  public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

  public decodeSync(stream: Uint8Array): ArrayBuffer {
    let predictor = FlateFilter.PREDICTOR;
    let columns = FlateFilter.COLUMNS;
    let colors = FlateFilter.COLORS;
    let bitsPerComponent = FlateFilter.BITS_PER_COMPONENT;

    if (this.decodeParams) {
      if (this.decodeParams.has(FlateFilter.FIELD_PREDICTOR)) {
        predictor = this.decodeParams.get(
          FlateFilter.FIELD_PREDICTOR,
          PDFNumeric
        ).value;
      }
      if (this.decodeParams.has(FlateFilter.FIELD_COLUMNS)) {
        columns = this.decodeParams.get(
          FlateFilter.FIELD_COLUMNS,
          PDFNumeric
        ).value;
      }
      if (this.decodeParams.has(FlateFilter.FIELD_COLORS)) {
        colors = this.decodeParams.get(
          FlateFilter.FIELD_COLORS,
          PDFNumeric
        ).value;
      }
      if (this.decodeParams.has(FlateFilter.FIELD_BITS_PER_COMPONENT)) {
        bitsPerComponent = this.decodeParams.get(
          FlateFilter.FIELD_BITS_PER_COMPONENT,
          PDFNumeric
        ).value;
      }
    }

    let result: Uint8Array;
    try {
      result = pako.ungzip(stream);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }

      throw new Error(
        `Cannot decode the stream using the FlateDecode filter. ${e}`
      );
    }

    if (!result) {
      return BufferSourceConverter.toArrayBuffer(stream);
    }

    if (predictor > 1) {
      if (predictor === 2) {
        result = new TIFFPredictor({
          columns
        }).decode(result);
      } else {
        result = new PNGPredictor({
          columns,
          colors,
          bitsPerComponent
        }).decode(result);
      }
    }

    return result.buffer;
  }

  public encodeSync(stream: Uint8Array): ArrayBuffer {
    return pako.deflate(stream).buffer;
  }
}
