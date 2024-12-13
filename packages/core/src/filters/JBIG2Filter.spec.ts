import { Convert } from "pvtsutils";
import { JBIG2Filter } from "./JBIG2Filter";

describe("JBIG2Filter", () => {
  let filter: JBIG2Filter;
  const testData = new Uint8Array([1, 2, 3, 4, 5]);

  beforeEach(() => {
    filter = new JBIG2Filter();
  });

  it("should have correct static NAME property", () => {
    expect(JBIG2Filter.NAME).toBe("JBIG2Decode");
  });

  it("should have correct instance name property", () => {
    expect(filter.name).toBe("JBIG2Decode");
  });

  it("should return correct className", () => {
    expect(JBIG2Filter.className).toBe("JBIG2Filter");
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
