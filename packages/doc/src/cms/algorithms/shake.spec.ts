import { describe, it, expect } from "vitest";
import { hex, toArrayBuffer } from "@peculiar/utils";
import { shakeAlgorithmConverter } from "./shake";

type TestVector = {
  name: string;
  webAlg: { name: string };
  asnAlg: string;
};

const testVectors: TestVector[] = [
  {
    name: "SHAKE128",
    webAlg: { name: "shake128" },
    asnAlg: "300B060960864801650304020B",
  },
  {
    name: "SHAKE256",
    webAlg: { name: "shake256" },
    asnAlg: "300B060960864801650304020C",
  },
];

describe("shakeAlgorithmConverter", () => {
  describe("toBER", () => {
    testVectors.forEach(({ name, webAlg, asnAlg }) => {
      it(`should convert ${name} to BER`, () => {
        const ber = shakeAlgorithmConverter.toBER(webAlg)!;
        expect(ber).toBeTruthy();
        const expectedBer = toArrayBuffer(hex.decode(asnAlg));
        expect(hex.encode(ber)).toBe(hex.encode(expectedBer));
      });
    });

    it("should return null for unsupported algorithm", () => {
      const result = shakeAlgorithmConverter.toBER({ name: "UNKNOWN-ALG" });
      expect(result).toBeNull();
    });
  });

  describe("fromBER", () => {
    testVectors.forEach(({ name, webAlg, asnAlg }) => {
      it(`should convert ${name} from BER`, () => {
        const ber = toArrayBuffer(hex.decode(asnAlg));
        const algorithm = shakeAlgorithmConverter.fromBER(ber);
        expect(algorithm).toEqual(webAlg);
      });
    });

    it("should return null for unsupported algorithm ID", () => {
      const invalidBer = toArrayBuffer(hex.decode("300B060960864801650304020F"));
      const result = shakeAlgorithmConverter.fromBER(invalidBer);
      expect(result).toBeNull();
    });

    it("should handle invalid BER data", () => {
      const invalidBer = new ArrayBuffer(4);
      expect(() => shakeAlgorithmConverter.fromBER(invalidBer)).toThrow();
    });
  });
});
