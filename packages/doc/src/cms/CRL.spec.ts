import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import { CRL } from "./CRL";

describe("CRL", () => {
  let caCert: x509.X509Certificate;
  let wrongCaCert: x509.X509Certificate;
  let crlRaw: ArrayBuffer;

  beforeAll(async () => {
    // setup pkijs and x509
    pkijs.setEngine("NodeJS", new pkijs.CryptoEngine({ crypto }));
    x509.cryptoProvider.set(crypto);

    // key algorithm
    const algorithm = {
      name: "ECDSA",
      namedCurve: "P-256"
    };

    // create CA certificate
    const caKeys = await crypto.subtle.generateKey(algorithm, false, [
      "sign",
      "verify"
    ]);
    caCert = await x509.X509CertificateGenerator.createSelfSigned({
      name: "CN=CA Test",
      keys: caKeys,
      signingAlgorithm: algorithm,
      notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
    });

    // create wrong CA certificate
    const wrongCaKeys = await crypto.subtle.generateKey(algorithm, false, [
      "sign",
      "verify"
    ]);
    wrongCaCert = await x509.X509CertificateGenerator.createSelfSigned({
      name: "CN=Wrong CA Test",
      keys: wrongCaKeys,
      signingAlgorithm: algorithm,
      notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
    });

    // create CRL
    const crl = await x509.X509CrlGenerator.create({
      issuer: caCert.issuer,
      thisUpdate: new Date(),
      nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
      signingKey: caKeys.privateKey,
      signingAlgorithm: { ...algorithm, hash: "SHA-256" }
    });
    crlRaw = crl.rawData;
  });

  describe("verify", () => {
    it("should return true for valid CRL", async () => {
      const crl = CRL.fromBER(crlRaw);

      const ok = await crl.verify(caCert);

      expect(ok).toBe(true);
    });

    it("should return false for invalid CRL", async () => {
      const crl = CRL.fromBER(crlRaw);

      const ok = await crl.verify(wrongCaCert);

      expect(ok).toBe(false);
    });
  });

  describe("issuer", () => {
    it("should return issuer name", async () => {
      const crl = CRL.fromBER(crlRaw);

      const issuer = crl.issuer;

      expect(issuer).toBe(caCert.issuer);
    });
  });

  describe("fromSchema", () => {
    it("should create CRL from schema", () => {
      const crlSchema = pkijs.CertificateRevocationList.fromBER(crlRaw);
      CRL.fromSchema(crlSchema);
    });
  });
});
