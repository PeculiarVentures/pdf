import { Predictor } from "./Predicator";

export class PNGPredictor extends Predictor {
  public static readonly className = "PNGPredictor";

  public decode(view: Uint8Array): Uint8Array {
    const bytesPerPixel = (this.colors * this.bitsPerComponent + 7) >> 3;
    const bytesPerRow =
      (this.colors * this.bitsPerComponent * this.columns + 7) >> 3;

    // Store initial data
    this.prevData = new Uint8Array(view);

    // Create result array
    const result = new Uint8Array(
      Math.ceil(view.length / (bytesPerRow + 1)) * bytesPerRow
    );
    let resultPos = 0;
    let pos = 0;

    while (pos < view.length) {
      const type = view[pos++];
      const row = view.subarray(pos, pos + bytesPerRow);
      pos += bytesPerRow;

      switch (type) {
        case 0: // None
          result.set(row, resultPos);
          break;

        case 1: // Sub
          for (let i = 0; i < bytesPerPixel; i++) {
            result[resultPos + i] = row[i];
          }
          for (let i = bytesPerPixel; i < bytesPerRow; i++) {
            result[resultPos + i] =
              (row[i] + result[resultPos + i - bytesPerPixel]) & 0xff;
          }
          break;

        case 2: // Up
          for (let i = 0; i < bytesPerRow; i++) {
            const up =
              resultPos >= bytesPerRow
                ? result[resultPos - bytesPerRow + i]
                : 0;
            result[resultPos + i] = (row[i] + up) & 0xff;
          }
          break;

        case 3: // Average
          for (let i = 0; i < bytesPerRow; i++) {
            const left =
              i < bytesPerPixel ? 0 : result[resultPos + i - bytesPerPixel];
            const up =
              resultPos >= bytesPerRow
                ? result[resultPos - bytesPerRow + i]
                : 0;
            result[resultPos + i] =
              (row[i] + Math.floor((left + up) / 2)) & 0xff;
          }
          break;

        case 4: // Paeth
          for (let i = 0; i < bytesPerRow; i++) {
            const left =
              i < bytesPerPixel ? 0 : result[resultPos + i - bytesPerPixel];
            const up =
              resultPos >= bytesPerRow
                ? result[resultPos - bytesPerRow + i]
                : 0;
            const upLeft =
              i < bytesPerPixel || resultPos < bytesPerRow
                ? 0
                : result[resultPos - bytesPerRow + i - bytesPerPixel];
            result[resultPos + i] =
              (row[i] + paethPredictor(left, up, upLeft)) & 0xff;
          }
          break;

        default:
          throw new Error(`Unsupported predictor type: ${type}`);
      }

      resultPos += bytesPerRow;
    }

    return result;
  }

  public encode(view: Uint8Array): Uint8Array {
    return view;
  }
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
