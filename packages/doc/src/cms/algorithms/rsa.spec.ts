import * as assert from "node:assert";
import { Convert } from "pvtsutils";
import { rsaAlgorithmConverter } from "./rsa";

type TestVector = {
  name: string;
  webAlg: { name: string; hash?: { name: string; }; saltLength?: number; };
  asnAlg: string;
};

const testVectors: TestVector[] = [
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-1",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-1" } },
    asnAlg: "300d06092a864886f70d0101050500",
  },
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-256",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
    asnAlg: "300d06092a864886f70d01010b0500",
  },
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-384",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } },
    asnAlg: "300d06092a864886f70d01010c0500",
  },
  {
    name: "RSASSA-PKCS1-v1_5 with SHA-512",
    webAlg: { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } },
    asnAlg: "300d06092a864886f70d01010d0500",
  },
  {
    name: "RSA-PSS with SHA-1 (defaults)",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-1" }, saltLength: 20 },
    asnAlg: "300d06092a864886f70d01010a3000",
  },
  {
    name: "RSA-PSS with SHA-1",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-1" }, saltLength: 32 },
    asnAlg: "301206092a864886f70d01010a3005a203020120",
  },
  {
    name: "RSA-PSS with SHA-256",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-256" }, saltLength: 32 },
    asnAlg: "304106092a864886f70d01010a3034a00f300d06096086480165030402010500a11c301a06092a864886f70d010108300d06096086480165030402010500a203020120",
  },
  {
    name: "RSA-PSS with SHA-384",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-384" }, saltLength: 48 },
    asnAlg: "304106092a864886f70d01010a3034a00f300d06096086480165030402020500a11c301a06092a864886f70d010108300d06096086480165030402020500a203020130",
  },
  {
    name: "RSA-PSS with SHA-512",
    webAlg: { name: "RSA-PSS", hash: { name: "SHA-512" }, saltLength: 64 },
    asnAlg: "304106092a864886f70d01010a3034a00f300d06096086480165030402030500a11c301a06092a864886f70d010108300d06096086480165030402030500a203020140",
  },
];

describe("rsaAlgorithmConverter", () => {
  describe("toBER and fromBER", () => {
    testVectors.forEach(({ name, webAlg: webCryptoAlg, asnAlg: asnAlgIdHex }) => {
      it(`should convert ${name} to BER and back`, () => {
        // toBER test
        const ber = rsaAlgorithmConverter.toBER(webCryptoAlg);
        assert.ok(ber, "toBER should return a value");
        const expectedBer = Convert.FromHex(asnAlgIdHex);
        assert.deepStrictEqual(new Uint8Array(ber), new Uint8Array(expectedBer), `${name}: toBER`);

        // fromBER test, if applicable
        if (asnAlgIdHex) {
          const algorithm = rsaAlgorithmConverter.fromBER(expectedBer);
          const expectedAlgorithm = webCryptoAlg;
          assert.deepStrictEqual(algorithm, expectedAlgorithm, `${name}: fromBER`);
        }
      });
    });
  });
});
