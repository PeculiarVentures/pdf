import { Convert } from "pvtsutils";
import { JPXFilter } from "./JPXFilter";

describe("JPXFilter", () => {
  let filter: JPXFilter;
  const testData = new Uint8Array([1, 2, 3, 4, 5]);

  beforeEach(() => {
    filter = new JPXFilter();
  });

  it("should have correct static NAME property", () => {
    expect(JPXFilter.NAME).toBe("JPXDecode");
  });

  it("should have correct instance name property", () => {
    expect(filter.name).toBe("JPXDecode");
  });

  it("should return correct className", () => {
    expect(JPXFilter.className).toBe("JPXFilter");
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
