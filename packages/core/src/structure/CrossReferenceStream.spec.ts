import { describe, it, expect } from "vitest";
import { CrossReferenceStream } from "..";

describe("CrossReferenceStream", () => {
  describe("numberToUint8Array", () => {
    // Field values in cross-reference streams are big-endian, high-order byte first.
    const toBytes = (value: number, size: number) => Buffer.from((CrossReferenceStream.prototype as any).numberToUint8Array.call(null, value, size)).toString("hex");

    it("should write numbers with an odd number of hex digits", () => {
      expect(toBytes(0x1a3, 2)).toBe("01a3");
      expect(toBytes(0x1, 1)).toBe("01");
      expect(toBytes(0x12345, 4)).toBe("00012345");
    });

    it("should write numbers with an even number of hex digits", () => {
      expect(toBytes(0xabcd, 3)).toBe("00abcd");
      expect(toBytes(0, 1)).toBe("00");
    });
  });
});
