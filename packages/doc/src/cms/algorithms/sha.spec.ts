import { Convert } from "pvtsutils";
import { shaAlgorithmConverter } from "./sha";

type TestVector = {
  name: string;
  webAlg: { name: string };
  asnAlg: string;
};

const testVectors: TestVector[] = [
  {
    name: "SHA-1",
    webAlg: { name: "SHA-1" },
    asnAlg: "300906052b0e03021a0500"
  },
  {
    name: "SHA-256",
    webAlg: { name: "SHA-256" },
    asnAlg: "300d06096086480165030402010500"
  },
  {
    name: "SHA-384",
    webAlg: { name: "SHA-384" },
    asnAlg: "300d06096086480165030402020500"
  },
  {
    name: "SHA-512",
    webAlg: { name: "SHA-512" },
    asnAlg: "300d06096086480165030402030500"
  }
];

describe("shaAlgorithmConverter", () => {
  describe("toBER", () => {
    testVectors.forEach(({ name, webAlg, asnAlg }) => {
      it(`should convert ${name} to BER`, () => {
        const ber = shaAlgorithmConverter.toBER(webAlg)!;
        expect(ber).toBeTruthy();
        const expectedBer = Convert.FromHex(asnAlg);
        expect(Convert.ToHex(ber)).toBe(Convert.ToHex(expectedBer));
      });
    });

    it("should return null for unsupported algorithm", () => {
      const result = shaAlgorithmConverter.toBER({ name: "UNKNOWN-ALG" });
      expect(result).toBeNull();
    });
  });

  describe("fromBER", () => {
    testVectors.forEach(({ name, webAlg, asnAlg }) => {
      it(`should convert ${name} from BER`, () => {
        const ber = Convert.FromHex(asnAlg);
        const algorithm = shaAlgorithmConverter.fromBER(ber);
        expect(algorithm).toEqual(webAlg);
      });
    });

    it("should return null for unsupported algorithm ID", () => {
      const invalidBer = Convert.FromHex("300906052b0e03021f0500");
      const result = shaAlgorithmConverter.fromBER(invalidBer);
      expect(result).toBeNull();
    });

    it("should handle invalid BER data", () => {
      const invalidBer = new ArrayBuffer(4);
      expect(() => shaAlgorithmConverter.fromBER(invalidBer)).toThrow();
    });
  });
});
