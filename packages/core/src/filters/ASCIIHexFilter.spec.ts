import { ASCIIHexFilter } from "./ASCIIHexFilter";

describe("ASCIIHexFilter", () => {
  let filter: ASCIIHexFilter;

  beforeEach(() => {
    filter = new ASCIIHexFilter();
  });

  it("should have correct name and className", () => {
    expect(filter.name).toBe("ASCIIHexDecode");
    expect(ASCIIHexFilter.NAME).toBe("ASCIIHexDecode");
    expect(ASCIIHexFilter.className).toBe("ASCIIHexFilter");
  });

  describe("decode", () => {
    it("should decode hex string to binary", async () => {
      const input = new TextEncoder().encode("48656C6C6F"); // "Hello" in hex
      const result = await filter.decode(input);
      const decoded = new TextDecoder().decode(result);
      expect(decoded).toBe("Hello");
    });

    it("should decode empty input", async () => {
      const input = new Uint8Array(0);
      const result = await filter.decode(input);
      expect(result.byteLength).toBe(0);
    });
  });

  describe("decodeSync", () => {
    it("should decode hex string to binary synchronously", () => {
      const input = new TextEncoder().encode("48656C6C6F"); // "Hello" in hex
      const result = filter.decodeSync(input);
      const decoded = new TextDecoder().decode(result);
      expect(decoded).toBe("Hello");
    });

    it("should decode empty input synchronously", () => {
      const input = new Uint8Array(0);
      const result = filter.decodeSync(input);
      expect(result.byteLength).toBe(0);
    });
  });

  describe("encode", () => {
    it("should encode binary to hex string", async () => {
      const input = new TextEncoder().encode("Hello");
      const result = await filter.encode(input);
      const encoded = new TextDecoder().decode(result);
      expect(encoded.toUpperCase()).toBe("48656C6C6F");
    });

    it("should encode empty input", async () => {
      const input = new Uint8Array(0);
      const result = await filter.encode(input);
      expect(result.byteLength).toBe(0);
    });
  });

  describe("encodeSync", () => {
    it("should encode binary to hex string synchronously", () => {
      const input = new TextEncoder().encode("Hello");
      const result = filter.encodeSync(input);
      const encoded = new TextDecoder().decode(result);
      expect(encoded.toUpperCase()).toBe("48656C6C6F");
    });

    it("should encode empty input synchronously", () => {
      const input = new Uint8Array(0);
      const result = filter.encodeSync(input);
      expect(result.byteLength).toBe(0);
    });
  });
});
