import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import { CertificateID } from "./CertID";
import "./algorithms";
import { Convert } from "pvtsutils";

describe("CertID", () => {
  const caCertBase64Url =
    "MIIBIjCByqADAgECAhAGqW14DfDK8pLUGsS1nd6fMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB0NBIENlcnQwHhcNMjQxMjEzMTUyMzUxWhcNMjUxMjEzMTUyMzUxWjASMRAwDgYDVQQDEwdDQSBDZXJ0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETEkds-0v16nkr57C29s7Ze_2hl3_kp02ws4K_mrvgDVzRT0-CBZRRvdP26nXBprY94tyurNweKWF7i9M6tWT36MCMAAwCgYIKoZIzj0EAwIDRwAwRAIgfhxz2-ZooKaBLUyn1RdafAiRAf_SIT8qyIBkUprwdicCIHSaec3MkZtgjlmcRHi6LhOvrlkhZ2vfl4Ue9Yb66ZQv";
  const leafCertBase64Url =
    "MIIBJTCBzKADAgECAhBb8ghssvHBbQ47PO-146sYMAoGCCqGSM49BAMCMBIxEDAOBgNVBAMTB0NBIENlcnQwHhcNMjQxMjEzMTUyMzUxWhcNMjUxMjEzMTUyMzUxWjAUMRIwEAYDVQQDEwlMZWFmIENlcnQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATXJ2CVT0PFsLMOanpGmydtitYgmLqmnQhUrWvDlRQ3cmV3x6qvfT25nW-B-u9wdxj9uOSg0nrSOOop6q5y4d1yowIwADAKBggqhkjOPQQDAgNIADBFAiBC_hg6V85cRal6rcA53pAZ67j_QZH5QsyW9Um54SU4qQIhANLzhz-7zHHE9RXtDRc8mswui_IENXJ38K6ujnMiHhRS";
  let caCert: x509.X509Certificate;
  let leafCert: x509.X509Certificate;

  beforeAll(async () => {
    pkijs.setEngine(
      "newEngine",
      new pkijs.CryptoEngine({ name: "nodejs", crypto })
    );

    caCert = new x509.X509Certificate(caCertBase64Url);
    leafCert = new x509.X509Certificate(leafCertBase64Url);
  });

  describe("create", () => {
    it("should create CertID with string algorithm", async () => {
      const certId = await CertificateID.create("SHA-256", leafCert, caCert);

      expect(certId.hashAlgorithm.name).toBe("SHA-256");
      expect(certId.serialNumber).toBe("5bf2086cb2f1c16d0e3b3cefb5e3ab18");
      expect(Convert.ToHex(certId.issuerNameHash)).toBe(
        "fafa8380b3172127a8bf60d6499c9fe162546ef2b2b563f6e681ba54fb339573"
      );
      expect(Convert.ToHex(certId.issuerKeyHash)).toBe(
        "05855277283c5a102b24a58eeb45a027b7e6630a40740ff1ef2b9373b466ad3d"
      );
    });

    it("should create CertID with algorithm object", async () => {
      const algorithm = {
        name: "SHA-1"
      };

      const certId = await CertificateID.create(algorithm, leafCert, caCert);

      expect(certId.hashAlgorithm.name).toBe("SHA-1");
      expect(certId.serialNumber).toBe("5bf2086cb2f1c16d0e3b3cefb5e3ab18");
      expect(Convert.ToHex(certId.issuerNameHash)).toBe(
        "b281f5bb852267eb9f56ad104a3f94b275df8630"
      );
      expect(Convert.ToHex(certId.issuerKeyHash)).toBe(
        "d1a21222fb7b5aa6a9723d8755a22d8f632d8e10"
      );
    });

    it("should throw error if cert was not signed by issuer", async () => {
      await expect(
        CertificateID.create("SHA-256", leafCert, leafCert)
      ).rejects.toThrow("Certificate was not signed by issuer");
    });
  });

  describe("equal", () => {
    it("should return true for identical CertIDs", async () => {
      const certId1 = await CertificateID.create("SHA-256", leafCert, caCert);
      const certId2 = await CertificateID.create("SHA-256", leafCert, caCert);

      expect(certId1.equal(certId2)).toBe(true);
    });

    it("should return false for different CertIDs", async () => {
      const certId1 = await CertificateID.create("SHA-256", leafCert, caCert);
      const certId2 = await CertificateID.create("SHA-1", leafCert, caCert);

      expect(certId1.equal(certId2)).toBe(false);
    });
  });

  describe("fromSchema", () => {
    it("should handle invalid schema", () => {
      const certId = new CertificateID();

      expect(() => certId.fromSchema(new pkijs.Attribute())).toThrow();
    });

    it("should accept CertID instance", async () => {
      const certId1 = await CertificateID.create("SHA-256", leafCert, caCert);
      const certId2 = new CertificateID();
      certId2.fromSchema(certId1.asn);

      expect(certId1.equal(certId2)).toBe(true);
    });
  });

  describe("DEFAULT_VIEW", () => {
    it("should be empty Uint8Array", () => {
      expect(CertificateID.DEFAULT_VIEW).toBeInstanceOf(Uint8Array);
      expect(CertificateID.DEFAULT_VIEW.length).toBe(0);
    });
  });
});
