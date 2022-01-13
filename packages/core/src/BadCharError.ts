import { ParsingError } from "./ParsingError";

export class BadCharError extends ParsingError {

  public static override readonly NAME: string = "BadCharError";

  constructor(position = 0) {
    super(`Wrong character at ${position} position.`, position);

    this.name = ParsingError.NAME;
  }

}
