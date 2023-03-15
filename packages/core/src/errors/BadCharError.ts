import { ParsingError } from "./ParsingError";

export class BadCharError extends ParsingError {

  public static override readonly NAME: string = "BadCharError";

  constructor(position = 0, cause?: Error) {
    super(`Wrong character at ${position} position.`, position, cause);
  }

}
