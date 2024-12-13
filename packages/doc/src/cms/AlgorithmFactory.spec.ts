import { AlgorithmFactory, AlgorithmConverter } from "./AlgorithmFactory";

describe("AlgorithmFactory", () => {
  const mockConverter: AlgorithmConverter = {
    name: "MOCK",
    toBER(algorithm: Algorithm) {
      if (algorithm.name === "MOCK-ALG") {
        return new Uint8Array([1, 2, 3]).buffer;
      }
      return null;
    },
    fromBER(raw: ArrayBuffer) {
      if (raw.byteLength === 3) {
        return { name: "MOCK-ALG" };
      }
      return null;
    }
  };

  beforeEach(() => {
    // Clear registered converters before each test
    AlgorithmFactory.converters = [];
  });

  describe("register", () => {
    it("should register new converter", () => {
      AlgorithmFactory.register(mockConverter);
      expect(AlgorithmFactory.converters).toContain(mockConverter);
    });
  });

  describe("prepareAlgorithm", () => {
    it("should handle string algorithm", () => {
      const result = AlgorithmFactory.prepareAlgorithm("SHA-256");
      expect(result).toEqual({ name: "SHA-256" });
    });

    it("should handle algorithm with string hash", () => {
      const result = AlgorithmFactory.prepareAlgorithm({
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      });
      expect(result).toEqual({
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      });
    });

    it("should pass through complete algorithm object", () => {
      const alg = {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      };
      const result = AlgorithmFactory.prepareAlgorithm(alg);
      expect(result).toEqual(alg);
    });
  });

  describe("toBER", () => {
    beforeEach(() => {
      AlgorithmFactory.register(mockConverter);
    });

    it("should convert supported algorithm to BER", () => {
      const result = AlgorithmFactory.toBER({ name: "MOCK-ALG" });
      expect(result).toEqual(new Uint8Array([1, 2, 3]).buffer);
    });

    it("should throw error for unsupported algorithm", () => {
      expect(() => {
        AlgorithmFactory.toBER({ name: "UNKNOWN-ALG" });
      }).toThrow(
        "Cannot encode Algorithm to BER format. Unsupported algorithm."
      );
    });

    it("should handle string algorithm input", () => {
      expect(() => {
        AlgorithmFactory.toBER("UNKNOWN-ALG");
      }).toThrow(
        "Cannot encode Algorithm to BER format. Unsupported algorithm."
      );
    });

    it("should handle algorithm with string hash", () => {
      expect(() => {
        AlgorithmFactory.toBER({
          name: "UNKNOWN-ALG",
          hash: "SHA-256"
        });
      }).toThrow(
        "Cannot encode Algorithm to BER format. Unsupported algorithm."
      );
    });
  });

  describe("fromBER", () => {
    beforeEach(() => {
      AlgorithmFactory.register(mockConverter);
    });

    it("should convert supported BER to algorithm", () => {
      const ber = new Uint8Array([1, 2, 3]);
      const result = AlgorithmFactory.fromBER(ber);
      expect(result).toEqual({ name: "MOCK-ALG" });
    });

    it("should throw error for unsupported BER", () => {
      const invalidBer = new Uint8Array([4, 5, 6, 7]);
      expect(() => {
        AlgorithmFactory.fromBER(invalidBer);
      }).toThrow(
        "Cannot decode BER format to Algorithm. Unsupported algorithm identifier."
      );
    });

    it("should handle ArrayBuffer input", () => {
      const ber = new Uint8Array([1, 2, 3]).buffer;
      const result = AlgorithmFactory.fromBER(ber);
      expect(result).toEqual({ name: "MOCK-ALG" });
    });

    it("should handle Uint8Array input", () => {
      const ber = new Uint8Array([1, 2, 3]);
      const result = AlgorithmFactory.fromBER(ber);
      expect(result).toEqual({ name: "MOCK-ALG" });
    });
  });
});
