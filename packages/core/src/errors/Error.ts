export class PDFError extends Error {
  public static readonly NAME: string = "PDFError";

  public inner?: Error;

  constructor(message: string, cause?: Error) {
    super(message);

    this.name = (this.constructor as typeof PDFError).NAME;
    if (cause) {
      this.inner = cause;
    }
  }
}
