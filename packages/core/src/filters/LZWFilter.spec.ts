import { Convert } from "pvtsutils";
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
      expect(Convert.ToHex(result)).toBe("0102030405");
    });

    it("should decode data synchronously", () => {
      const result = filter.decodeSync(testData);
      expect(Convert.ToHex(result)).toBe("0102030405");
    });
  });

  describe("encode methods", () => {
    it("should encode data asynchronously", async () => {
      const result = await filter.encode(testData);
      expect(Convert.ToHex(result)).toBe("0102030405");
    });

    it("should encode data synchronously", () => {
      const result = filter.encodeSync(testData);
      expect(Convert.ToHex(result)).toBe("0102030405");
    });
  });
});
