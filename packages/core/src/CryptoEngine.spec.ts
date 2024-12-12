import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";
import { PDFCryptoEngine } from "./CryptoEngine";

const crypto = new Crypto();

describe("PDFCryptoEngine", () => {
  const engine = new PDFCryptoEngine({
    name: "node",
    crypto
  });
  describe("getSignatureParameters", () => {
    it("ECDSA with SHA3-256", async () => {
      const keys = await crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256"
        },
        false,
        ["sign", "verify"]
      );
      const params = await engine.getSignatureParameters(
        keys.privateKey,
        "SHA3-256"
      );
      expect(params.signatureAlgorithm.algorithmId).toBe(
        "2.16.840.1.101.3.4.3.10"
      );
      expect(params.parameters.algorithm).toStrictEqual({
        name: "ECDSA",
        hash: {
          name: "SHA3-256"
        }
      });
    });
  });
  describe("rc4", () => {
    it("generateKey/encrypt/decrypt", async () => {
      const key = (await engine.generateKey(
        {
          name: "RC4"
        },
        false,
        ["encrypt", "decrypt"]
      )) as CryptoKey;
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const encrypted = await engine.encrypt(
        {
          name: "RC4"
        },
        key,
        data
      );
      const decrypted = await engine.decrypt(
        {
          name: "RC4"
        },
        key,
        encrypted
      );
      expect(Buffer.from(data).toString("hex")).toBe(
        Buffer.from(decrypted).toString("hex")
      );
    });
  });
  describe("digest", () => {
    it("md5", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const digest = await engine.digest(
        {
          name: "MD5"
        },
        data
      );
      expect(Buffer.from(digest).toString("hex")).toBe(
        "7cfdd07889b3295d6a550914ab35e068"
      );
    });
  });
  describe("getPublicKey", () => {
    const test = async (vector: {
      algorithm: Algorithm;
      usage: KeyUsage[];
      signatureAlgorithm: pkijs.AlgorithmIdentifier;
    }) => {
      const keys = (await crypto.subtle.generateKey(
        vector.algorithm,
        true,
        vector.usage
      )) as CryptoKeyPair;
      const spki = await crypto.subtle.exportKey("spki", keys.publicKey);
      const publicKeyInfo = pkijs.PublicKeyInfo.fromBER(spki);
      const publicKey = await engine.getPublicKey(
        publicKeyInfo,
        vector.signatureAlgorithm
      );
      expect(publicKey).toBeTruthy();
    };

    it("ECDSA P-256", async () => {
      await test({
        algorithm: {
          name: "ECDSA",
          namedCurve: "P-256"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.2.840.10045.4.3.2" // ecdsa-with-SHA256
        })
      });
    });
    it("ECDSA P-384", async () => {
      await test({
        algorithm: {
          name: "ECDSA",
          namedCurve: "P-384"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.2.840.10045.4.3.3" // ecdsa-with-SHA384
        })
      });
    });
    it("ECDSA P-521", async () => {
      await test({
        algorithm: {
          name: "ECDSA",
          namedCurve: "P-521"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.2.840.10045.4.3.4" // ecdsa-with-SHA512
        })
      });
    });
    it("ECDSA brainpoolP256r1", async () => {
      await test({
        algorithm: {
          name: "ECDSA",
          namedCurve: "brainpoolP256r1"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.2.840.10045.4.3.2" // ecdsa-with-SHA256
        })
      });
    });
    it("ECDSA brainpoolP384r1", async () => {
      await test({
        algorithm: {
          name: "ECDSA",
          namedCurve: "brainpoolP384r1"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.2.840.10045.4.3.3" // ecdsa-with-SHA384
        })
      });
    });
    it("ECDSA brainpoolP512r1", async () => {
      await test({
        algorithm: {
          name: "ECDSA",
          namedCurve: "brainpoolP512r1"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.2.840.10045.4.3.4" // ecdsa-with-SHA512
        })
      });
    });
    it("EdDSA Ed25519", async () => {
      await test({
        algorithm: {
          name: "EDDSA",
          namedCurve: "Ed25519"
        } as Algorithm,
        usage: ["sign", "verify"],
        signatureAlgorithm: new pkijs.AlgorithmIdentifier({
          algorithmId: "1.3.101.112" // Ed25519
        })
      });
    });
  });
  describe("AES-ECB", () => {
    it("generateKey/encrypt/decrypt", async () => {
      const key = (await engine.generateKey(
        {
          name: "AES-ECB",
          length: 128
        },
        false,
        ["encrypt", "decrypt"]
      )) as CryptoKey;
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const encrypted = await engine.encrypt(
        {
          name: "AES-ECB"
        } as Algorithm,
        key,
        data
      );
      const decrypted = await engine.decrypt(
        {
          name: "AES-ECB"
        } as Algorithm,
        key,
        encrypted
      );
      expect(Buffer.from(data).toString("hex")).toBe(
        Buffer.from(decrypted).toString("hex")
      );
    });
    it("generateKey/encrypt/decrypt with padding", async () => {
      const key = (await engine.generateKey(
        {
          name: "AES-ECB",
          length: 128
        },
        false,
        ["encrypt", "decrypt"]
      )) as CryptoKey;
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const encrypted = await engine.encrypt(
        {
          name: "AES-ECB"
        } as Algorithm,
        key,
        data
      );
      const decrypted = await engine.decrypt(
        {
          name: "AES-ECB",
          pad: true
        } as Algorithm,
        key,
        encrypted
      );
      expect(Buffer.from(decrypted).toString("hex")).toBe(
        "01020304050b0b0b0b0b0b0b0b0b0b0b10101010101010101010101010101010"
      );
    });
  });
  describe("getOIDByAlgorithm", () => {
    it("AES-ECB", () => {
      const oid = engine.getOIDByAlgorithm({
        name: "shake128"
      } as Algorithm);
      expect(oid).toBe("2.16.840.1.101.3.4.2.11");
    });
  });
});
