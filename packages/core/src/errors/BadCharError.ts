import { ParsingError } from "./ParsingError";

export class BadCharError extends ParsingError {
  public static override readonly NAME: string = "BadCharError";

  constructor(position?: number, cause?: Error);
  constructor(message: string, position?: number, cause?: Error);
  constructor(
    messageOrPosition?: string | number,
    positionOrCause?: number | Error,
    cause?: Error
  ) {
    let message: string;
    let position: number | undefined;
    if (typeof messageOrPosition === "string") {
      message = `${messageOrPosition} at ${positionOrCause} position.`;
      position = positionOrCause as number | undefined;
    } else {
      message = `Wrong character at ${position} position.`;
      position = messageOrPosition as number | undefined;
      cause = positionOrCause as Error | undefined;
    }
    super(message, position, cause);
  }
}
