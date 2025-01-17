import { PDFError } from "./Error";

export class ParsingError extends PDFError {
  public static override readonly NAME: string = "ParsingError";

  public position: number;

  constructor(message: string, position = -1, cause?: Error) {
    message = `${message} at position ${position}`;
    super(message, cause);

    this.message = message;
    this.position = position;
  }
}
