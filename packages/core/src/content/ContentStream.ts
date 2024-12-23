import { Convert } from "pvtsutils";

import { PDFStream } from "../objects";

export class PDFContentStream extends PDFStream {
  #content?: PDFContent;

  constructor();
  constructor(stream: BufferSource);
  constructor(stream: PDFStream);
  constructor(stream?: BufferSource | PDFStream) {
    super(stream);

    if (stream instanceof PDFContentStream) {
      this.#content = stream.content;
    }
  }

  public get content(): PDFContent {
    if (!this.#content) {
      const content = (this.#content = PDFContent.fromString(
        Convert.ToBinary(this.stream)
      ));

      const clearCallback = this.clear.bind(this, true);
      content.once("push", clearCallback);
      content.on("clear", clearCallback);
    }

    return this.#content;
  }

  protected serializeContent(): void {
    const content = this.content;
    if (!this.stream.length && content && content.operators.length) {
      this.stream = content.toUint8Array();
    }
  }

  public override async encode(): Promise<ArrayBuffer> {
    this.serializeContent();

    return super.encode();
  }

  public override clear(streamOnly = false): void {
    super.clear(streamOnly);
  }
}

import { PDFContent } from "./Content";
