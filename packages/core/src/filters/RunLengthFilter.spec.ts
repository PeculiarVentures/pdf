import { RunLengthFilter } from "./RunLengthFilter";

describe("RunLengthFilter", () => {
  let filter: RunLengthFilter;

  beforeEach(() => {
    filter = new RunLengthFilter();
  });

  it("should have correct name and className", () => {
    expect(filter.name).toBe("RunLengthDecode");
    expect(RunLengthFilter.className).toBe("RunLengthFilter");
  });

  describe("decode", () => {
    it("should decode run-length encoded data", async () => {
      // Test case 1: Literal run
      // 0x02 means next 3 bytes are literal
      const literal = new Uint8Array([0x02, 0x41, 0x42, 0x43, 0x80]);
      const literalResult = await filter.decode(literal);
      expect(new Uint8Array(literalResult)).toEqual(
        new Uint8Array([0x41, 0x42, 0x43])
      );

      // Test case 2: Repeated run
      // 0xFF means repeat next byte 2 times (257 - 255)
      const repeated = new Uint8Array([0xff, 0x41, 0x80]);
      const repeatedResult = await filter.decode(repeated);
      expect(new Uint8Array(repeatedResult)).toEqual(
        new Uint8Array([0x41, 0x41])
      );
    });

    it("should handle multiple runs in the same stream", async () => {
      const mixed = new Uint8Array([
        0x02,
        0x41,
        0x42,
        0x43, // literal run of 3 bytes
        0xfe,
        0x58, // repeat X twice
        0x01,
        0x59,
        0x5a, // literal run of 2 bytes
        0x80 // EOD
      ]);
      const result = await filter.decode(mixed);
      expect(new Uint8Array(result)).toEqual(
        new Uint8Array([0x41, 0x42, 0x43, 0x58, 0x58, 0x58, 0x59, 0x5a])
      );
    });
  });

  describe("encode", () => {
    it("should throw error for unimplemented encode method", async () => {
      const data = new Uint8Array([0x41, 0x42, 0x43]);
      await expect(filter.encode(data)).rejects.toThrow(
        "Method not implemented"
      );
    });

    it("should throw error for unimplemented encodeSync method", () => {
      const data = new Uint8Array([0x41, 0x42, 0x43]);
      expect(() => filter.encodeSync(data)).toThrow("Method not implemented");
    });
  });

  describe("decodeSync", () => {
    it("should decode data synchronously", () => {
      const input = new Uint8Array([0x02, 0x41, 0x42, 0x43, 0x80]);
      const result = filter.decodeSync(input);
      expect(new Uint8Array(result)).toEqual(
        new Uint8Array([0x41, 0x42, 0x43])
      );
    });

    it("should handle empty content", () => {
      const input = new Uint8Array([0x80]); // just EOD marker
      const result = filter.decodeSync(input);
      expect(new Uint8Array(result)).toEqual(new Uint8Array([]));
    });
  });
});
