import { Convert } from "pvtsutils";
import { ecAlgorithmConverter } from "./ec";

type TestVector = {
  name: string;
  webAlg: { name: string; hash?: { name: string }; namedCurve?: string };
  asnAlg: string;
};

const testVectors: TestVector[] = [
  {
    name: "ECDSA with SHA-1",
    webAlg: { name: "ECDSA", hash: { name: "SHA-1" } },
    asnAlg: "300b06072a8648ce3d04010500"
  },
  {
    name: "ECDSA with SHA-256",
    webAlg: { name: "ECDSA", hash: { name: "SHA-256" } },
    asnAlg: "300c06082a8648ce3d0403020500"
  },
  {
    name: "ECDSA with SHA-384",
    webAlg: { name: "ECDSA", hash: { name: "SHA-384" } },
    asnAlg: "300c06082a8648ce3d0403030500"
  },
  {
    name: "ECDSA with SHA-512",
    webAlg: { name: "ECDSA", hash: { name: "SHA-512" } },
    asnAlg: "300c06082a8648ce3d0403040500"
  },
  {
    name: "Ed25519",
    webAlg: { name: "EdDSA", namedCurve: "Ed25519" },
    asnAlg: "300506032b6570"
  },
  {
    name: "Ed448",
    webAlg: { name: "EdDSA", namedCurve: "Ed448" },
    asnAlg: "300506032b6571"
  }
];

describe("ecAlgorithmConverter", () => {
  describe("toBER", () => {
    testVectors.forEach(({ name, webAlg, asnAlg }) => {
      it(`should convert ${name} to BER`, () => {
        const ber = ecAlgorithmConverter.toBER(webAlg)!;
        expect(ber).toBeTruthy();
        const expectedBer = Convert.FromHex(asnAlg);
        expect(Convert.ToHex(ber)).toBe(Convert.ToHex(expectedBer));
      });
    });

    it("should return null for unsupported algorithm", () => {
      const result = ecAlgorithmConverter.toBER({ name: "UNKNOWN-ALG" });
      expect(result).toBeNull();
    });

    it("should return null for ECDSA without hash", () => {
      const result = ecAlgorithmConverter.toBER({ name: "ECDSA" });
      expect(result).toBeNull();
    });

    it("should return null for ECDSA with unsupported hash", () => {
      const result = ecAlgorithmConverter.toBER({
        name: "ECDSA",
        hash: { name: "MD5" }
      });
      expect(result).toBeNull();
    });
  });

  describe("fromBER", () => {
    testVectors.forEach(({ name, webAlg, asnAlg }) => {
      it(`should convert ${name} from BER`, () => {
        const ber = Convert.FromHex(asnAlg);
        const algorithm = ecAlgorithmConverter.fromBER(ber);
        expect(algorithm).toEqual(webAlg);
      });
    });

    it("should return null for unsupported algorithm ID", () => {
      const invalidBer = Convert.FromHex("300b06072a8648ce3d040f0500");
      const result = ecAlgorithmConverter.fromBER(invalidBer);
      expect(result).toBeNull();
    });

    it("should handle invalid BER data", () => {
      const invalidBer = new ArrayBuffer(4);
      expect(() => ecAlgorithmConverter.fromBER(invalidBer)).toThrow();
    });
  });
});
