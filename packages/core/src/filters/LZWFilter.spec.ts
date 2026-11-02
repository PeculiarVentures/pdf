import { describe, it, expect, beforeEach } from "vitest";
import { hex } from "@peculiar/utils";
import { LZWFilter } from "./LZWFilter";

describe("LZWFilter", () => {
  let filter: LZWFilter;
  const testData = new Uint8Array([1, 2, 3, 4, 5]);

  beforeEach(() => {
    filter = new LZWFilter();
  });

  it("should have correct static NAME property", () => {
    expect(LZWFilter.NAME).toBe("LZWDecode");
  });

  it("should have correct instance name property", () => {
    expect(filter.name).toBe("LZWDecode");
  });

  it("should return correct className", () => {
    expect(LZWFilter.className).toBe("LZWFilter");
  });

  describe("decode methods", () => {
    it("should decode data asynchronously", async () => {
      const result = await filter.decode(testData);
      expect(hex.encode(result)).toBe("0102030405");
    });

    it("should decode data synchronously", () => {
      const result = filter.decodeSync(testData);
      expect(hex.encode(result)).toBe("0102030405");
    });
  });

  describe("encode methods", () => {
    it("should encode data asynchronously", async () => {
      const result = await filter.encode(testData);
      expect(hex.encode(result)).toBe("0102030405");
    });

    it("should encode data synchronously", () => {
      const result = filter.encodeSync(testData);
      expect(hex.encode(result)).toBe("0102030405");
    });
  });

  it("should return an ArrayBuffer with only the bytes of a subarray", async () => {
    const file = new Uint8Array([0xff, 1, 2, 3, 4, 5, 0xff]);
    const view = file.subarray(1, 6);

    for (const result of [filter.decodeSync(view), filter.encodeSync(view), await filter.decode(view), await filter.encode(view)]) {
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(hex.encode(result)).toBe("0102030405");
    }
  });
});
