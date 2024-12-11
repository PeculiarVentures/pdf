import { TextEncoder } from "./TextEncoder";

describe("TextEncoder", () => {
  describe("from", () => {
    it("should decode UTF-16 string", () => {
      const input = "\xFE\xFF\x00H\x00e\x00l\x00l\x00o";
      const result = TextEncoder.from(input);
      expect(result).toBe("Hello");
    });

    it("should decode UTF-8 string", () => {
      const input = "\xEF\xBB\xBFHello";
      const result = TextEncoder.from(input);
      expect(result).toBe("Hello");
    });

    it("should return original string if no BOM detected", () => {
      const input = "Hello";
      const result = TextEncoder.from(input);
      expect(result).toBe("Hello");
    });
  });

  describe("to", () => {
    it("should keep ASCII text as-is", () => {
      const input = "Hello";
      const result = TextEncoder.to(input);
      expect(result).toBe("Hello");
    });

    it("should encode non-ASCII text to UTF-16", () => {
      const input = "Hello 世界";
      const result = TextEncoder.to(input);
      expect(result.startsWith(TextEncoder.UTF16)).toBe(true);
      // Decode the result to verify
      const decoded = TextEncoder.from(result);
      expect(decoded).toBe(input);
    });

    it("should handle empty string", () => {
      const input = "";
      const result = TextEncoder.to(input);
      expect(result).toBe("");
    });
  });
});
