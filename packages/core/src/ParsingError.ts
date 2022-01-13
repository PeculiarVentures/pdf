export class ParsingError extends Error {

  public static readonly NAME: string = "ParsingError";

  public position: number;

  constructor(message: string, position = -1) {
    super();

    this.name = ParsingError.NAME;
    this.message = message;
    this.position = position;
  }

}
