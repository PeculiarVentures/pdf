import { Convert } from "pvtsutils";
import { rsaAlgorithmConverter } from "./rsa";

type TestVector = {
  name: string;
  webAlg: { name: string; hash?: { name: string }; saltLength?: number };
  asnAlg: string;
};

const testVectors: TestVector[] = [
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-1",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-1" } },
    asnAlg: "300d06092a864886f70d0101050500"
  },
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-256",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    asnAlg: "300d06092a864886f70d01010b0500"
  },
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-384",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } },
    asnAlg: "300d06092a864886f70d01010c0500"
  },
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-512",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } },
    asnAlg: "300d06092a864886f70d01010d0500"
  },
  {
    name: "RSA-PSS with SHA-1 (defaults)",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-1" }, saltLength: 20 },
    asnAlg: "300d06092a864886f70d01010a3000"
  },
  {
    name: "RSA-PSS with SHA-1",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-1" }, saltLength: 32 },
    asnAlg: "301206092a864886f70d01010a3005a203020120"
  },
  {
    name: "RSA-PSS with SHA-256",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-256" }, saltLength: 32 },
    asnAlg:
      "304106092a864886f70d01010a3034a00f300d06096086480165030402010500a11c301a06092a864886f70d010108300d06096086480165030402010500a203020120"
  },
  {
    name: "RSA-PSS with SHA-384",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-384" }, saltLength: 48 },
    asnAlg:
      "304106092a864886f70d01010a3034a00f300d06096086480165030402020500a11c301a06092a864886f70d010108300d06096086480165030402020500a203020130"
  },
  {
    name: "RSA-PSS with SHA-512",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-512" }, saltLength: 64 },
    asnAlg:
      "304106092a864886f70d01010a3034a00f300d06096086480165030402030500a11c301a06092a864886f70d010108300d06096086480165030402030500a203020140"
  }
];

describe("rsaAlgorithmConverter", () => {
  describe("toBER", () => {
    testVectors.forEach(
      ({ name, webAlg: webCryptoAlg, asnAlg: asnAlgIdHex }) => {
        it(`should convert ${name} to BER`, () => {
          const ber = rsaAlgorithmConverter.toBER(webCryptoAlg)!;
          expect(ber).toBeTruthy();
          const expectedBer = Convert.FromHex(asnAlgIdHex);
          expect(Convert.ToHex(ber)).toBe(Convert.ToHex(expectedBer));
        });
      }
    );

    it("should return null for unsupported algorithm", () => {
      const result = rsaAlgorithmConverter.toBER({ name: "UNKNOWN-ALG" });
      expect(result).toBeNull();
    });

    it("should throw error for unsupported hash algorithm in RSA-PSS", () => {
      expect(() =>
        rsaAlgorithmConverter.toBER({
          name: "RSA-PSS",
          hash: { name: "MD5" },
          saltLength: 20
        } as Algorithm)
      ).toThrow("Unsupported hash algorithm: MD5");
    });

    it("should handle RSA-PSS without saltLength", () => {
      const result = rsaAlgorithmConverter.toBER({
        name: "RSA-PSS",
        hash: { name: "SHA-1" }
      });
      expect(result).toBeTruthy();
    });
  });

  describe("fromBER", () => {
    testVectors.forEach(
      ({ name, webAlg: webCryptoAlg, asnAlg: asnAlgIdHex }) => {
        it(`should convert ${name} from BER`, () => {
          const ber = Convert.FromHex(asnAlgIdHex);
          const algorithm = rsaAlgorithmConverter.fromBER(ber);
          expect(algorithm).toEqual(webCryptoAlg);
        });
      }
    );

    it("should return null for unsupported algorithm ID", () => {
      const invalidBer = Convert.FromHex("300d06092a864886f70d01010f0500");
      const result = rsaAlgorithmConverter.fromBER(invalidBer);
      expect(result).toBeNull();
    });

    it("should handle RSA-PSS without parameters", () => {
      const berWithoutParams = Convert.FromHex("300b06092a864886f70d01010a");
      const result = rsaAlgorithmConverter.fromBER(berWithoutParams);
      expect(result).toEqual({ name: "RSA-PSS" });
    });

    it("should handle plain RSA encryption", () => {
      const berRsaEncryption = Convert.FromHex(
        "300d06092a864886f70d0101010500"
      );
      const result = rsaAlgorithmConverter.fromBER(berRsaEncryption);
      expect(result).toEqual({ name: "RSASSA-PKCS1-v1_5" });
    });

    it("should handle RSA-PSS with specified saltLength", () => {
      const berUnsupportedHash = Convert.FromHex(
        "301d06092a864886f70d01010a3010a009300706052b0e03021aa203020120"
      );
      const result = rsaAlgorithmConverter.fromBER(berUnsupportedHash);
      expect(result).toEqual({
        name: "RSA-PSS",
        hash: { name: "SHA-1" },
        saltLength: 32
      });
    });

    it("should handle invalid BER data", () => {
      const invalidBer = new ArrayBuffer(4);
      expect(() => rsaAlgorithmConverter.fromBER(invalidBer)).toThrow();
    });
  });
});
