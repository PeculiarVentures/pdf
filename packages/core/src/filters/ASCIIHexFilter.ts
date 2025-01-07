import { Filter } from "./Filter";

export class ASCIIHexFilter extends Filter {
  public static readonly NAME = "ASCIIHexDecode";
  public name = ASCIIHexFilter.NAME;

  public static get className(): string {
    return "ASCIIHexFilter";
  }

  public async decode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.decodeSync(view);
  }

  public async encode(view: Uint8Array): Promise<ArrayBuffer> {
    return this.encodeSync(view);
  }

  public decodeSync(stream: Uint8Array): ArrayBuffer {
    const hex = new TextDecoder().decode(stream);
    const cleanHex = hex.replace(/\s/g, "");
    const bytes = new Uint8Array(Math.ceil(cleanHex.length / 2));

    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substring(i, i + 2), 16);
      bytes[i / 2] = byte;
    }

    return bytes.buffer;
  }

  public encodeSync(stream: Uint8Array): ArrayBuffer {
    const hex = Array.from(stream)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return new TextEncoder().encode(hex).buffer;
  }
}
