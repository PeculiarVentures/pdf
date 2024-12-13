import { CCITTFaxFilter } from "./CCITTFaxFilter";

describe("CCITTFaxFilter", () => {
  let filter: CCITTFaxFilter;
  const testData = new Uint8Array([1, 2, 3, 4]);

  beforeEach(() => {
    filter = new CCITTFaxFilter();
  });

  it("should have correct static NAME", () => {
    expect(CCITTFaxFilter.NAME).toBe("CCITTFaxDecode");
  });

  it("should have correct className", () => {
    expect(CCITTFaxFilter.className).toBe("CCITTFaxFilter");
  });

  it("should have correct name property", () => {
    expect(filter.name).toBe(CCITTFaxFilter.NAME);
  });

  describe("decode", () => {
    it("should return same data in decode", async () => {
      const result = await filter.decode(testData);
      expect(new Uint8Array(result)).toEqual(testData);
    });
  });

  describe("encode", () => {
    it("should return same data in encode", async () => {
      const result = await filter.encode(testData);
      expect(new Uint8Array(result)).toEqual(testData);
    });
  });

  describe("decodeSync", () => {
    it("should return same data in decodeSync", () => {
      const result = filter.decodeSync(testData);
      expect(new Uint8Array(result)).toEqual(testData);
    });
  });

  describe("encodeSync", () => {
    it("should return same data in encodeSync", () => {
      const result = filter.encodeSync(testData);
      expect(new Uint8Array(result)).toEqual(testData);
    });
  });
});
