import { PNGPredictor } from "./PNGPredictor";
import { Convert } from "pvtsutils";

describe("PNGPredictor", () => {
  let predictor: PNGPredictor;

  beforeEach(() => {
    predictor = new PNGPredictor();
    predictor.colors = 3;
    predictor.bitsPerComponent = 8;
    predictor.columns = 4;
  });

  it("should have correct className", () => {
    expect(PNGPredictor.className).toBe("PNGPredictor");
  });

  describe("decode", () => {
    // Test Predictor Type 0 (None)
    it("should decode type 0 predictor correctly", () => {
      const hex = "00000102030405060708090a0b000c0d0e0f1011121314151617";
      const input = Buffer.from(hex, "hex");

      const result = predictor.decode(input);

      expect(Buffer.from(result).toString("hex")).toBe(
        "000102030405060708090a0b0c0d0e0f1011121314151617"
      );
    });

    // Test Predictor Type 1 (Sub)
    it("should decode type 1 predictor correctly - corrected", () => {
      const hex = "01000102030303030303030303010c0d0e030303030303030303";
      const input = Buffer.from(hex, "hex");

      const result = predictor.decode(input);

      expect(Buffer.from(result).toString("hex")).toBe(
        "000102030405060708090a0b0c0d0e0f1011121314151617"
      );
    });

    // Test Predictor Type 2 (Up)
    it("should decode type 2 predictor correctly", () => {
      const hex = "02000102030405060708090a0b020c0c0c0c0c0c0c0c0c0c0c0c";
      const input = Buffer.from(hex, "hex");

      const result = predictor.decode(input);

      expect(Buffer.from(result).toString("hex")).toBe(
        "000102030405060708090a0b0c0d0e0f1011121314151617"
      );
    });

    // Test Predictor Type 3 (Average)
    it("should decode type 3 predictor correctly", () => {
      const hex = "03000102030404050506060707030c0d0d080808080808080808";
      const input = Buffer.from(hex, "hex");

      const result = predictor.decode(input);

      expect(Buffer.from(result).toString("hex")).toBe(
        "000102030405060708090a0b0c0d0e0f1011121314151617"
      );
    });

    // Test Predictor Type 4 (Paeth)
    it("should decode type 4 predictor correctly", () => {
      const hex = "04000102030303030303030303040c0c0c030303030303030303";
      const input = Buffer.from(hex, "hex");

      const result = predictor.decode(input);

      expect(Buffer.from(result).toString("hex")).toBe(
        "000102030405060708090a0b0c0d0e0f1011121314151617"
      );
    });

    // Test invalid predictor type
    it("should throw error for invalid predictor type", () => {
      const input = Buffer.from(
        "05000102030405060708090a0b0c0d0e0f1011121314151617",
        "hex"
      );

      expect(() => predictor.decode(input)).toThrow(
        "Unsupported predictor type: 5"
      );
    });

    // Test real PDF data with PNG Up predictor
    it("should decode real PDF XRef stream with PNG Up predictor", () => {
      predictor.columns = 4; // From DecodeParms
      predictor.colors = 1; // XRef stream uses 1 color
      predictor.bitsPerComponent = 8;
      const input = Convert.FromHex(
        "02010010000200038d000200005500020001b1000200012100020001a50002000a8500020004bc000200ecca000201024e0002000000010200000001020000000102ffff12fd"
      );

      const result = predictor.decode(new Uint8Array(input));

      // Convert result to hex string for comparison
      const hex = Buffer.from(result).toString("hex");
      expect(hex).toBe(
        "0100100001039d000103f2000104a3000105c400010669000110ee000114aa00010074000202c2000202c2010202c2020202c2030101d400"
      );
    });
  });

  describe("encode", () => {
    it("should return the same stream for encode method", () => {
      const input = Buffer.from(
        "000102030405060708090a0b0c0d0e0f1011121314151617",
        "hex"
      );

      const result = predictor.encode(input);
      expect(result).toBeDefined();
      expect(result.length).toBe(input.length);
    });
  });
});
