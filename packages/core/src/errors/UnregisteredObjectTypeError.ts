import { PDFError } from "./Error";

export class UnregisteredObjectTypeError extends PDFError {
  public static override readonly NAME: string =
    "PDFUnregisteredObjectTypeError";

  constructor(name: string, cause?: Error) {
    super(
      `The PDF object type '${name}' has not been registered with the PDF library. Please register the object type before attempting to use it.`,
      cause
    );
  }
}
