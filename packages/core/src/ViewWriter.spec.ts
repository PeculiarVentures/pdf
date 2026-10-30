import { describe, it, expect } from "vitest";
import { ViewWriter } from "./ViewWriter";

describe("ViewWriter", () => {
  describe("writeString", () => {
    it("should write one byte per character and keep bytes 0x80-0xFF", () => {
      const writer = new ViewWriter();
      writer.writeString("%\xE2\xE3\xCF\xD3");
      expect(Buffer.from(writer.toUint8Array()).toString("hex")).toBe("25e2e3cfd3");
    });

    it("should keep only the low byte of characters above 0xFF", () => {
      const writer = new ViewWriter();
      writer.writeString("Ł€");
      expect(Buffer.from(writer.toUint8Array()).toString("hex")).toBe("41ac");
    });
  });
});
