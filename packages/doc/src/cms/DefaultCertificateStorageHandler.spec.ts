import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import {
  CertificateID,
  CRL,
  DefaultCertificateStorageHandler,
  ICertificateStorageHandler,
  IResult,
  IsTrustedResult,
  OCSP,
  RevocationType
} from "@peculiar/pdf-doc";

describe("DefaultCertificateStorageHandler", () => {
  beforeAll(() => {
    pkijs.setEngine(
      "newEngine",
      new pkijs.CryptoEngine({ name: "nodejs", crypto })
    );
  });

  describe("getSKI", () => {
    describe("SKI presents in certificate extension", () => {
      let cert: x509.X509Certificate;

      beforeAll(async () => {
        const algorithm = {
          name: "ECDSA",
          namedCurve: "P-256"
        };
        const keys = await crypto.subtle.generateKey(algorithm, false, [
          "sign",
          "verify"
        ]);
        cert = await x509.X509CertificateGenerator.createSelfSigned({
          name: "CN=Test",
          keys,
          signingAlgorithm: algorithm,
          extensions: [
            await x509.SubjectKeyIdentifierExtension.create(keys.publicKey)
          ]
        });
      });

      it("should return SKI", async () => {
        const ski = await DefaultCertificateStorageHandler.getSKI(cert);
        const skiHex = Buffer.from(ski).toString("hex");
        const skiExt = cert.getExtension(x509.SubjectKeyIdentifierExtension);
        expect(skiExt).toBeDefined();
        expect(skiHex).toBe(skiExt!.keyId);
      });
    });
    describe("SKI does not present in certificate extension", () => {
      let cert: x509.X509Certificate;

      beforeAll(async () => {
        const algorithm = {
          name: "ECDSA",
          namedCurve: "P-256"
        };
        const keys = await crypto.subtle.generateKey(algorithm, false, [
          "sign",
          "verify"
        ]);
        cert = await x509.X509CertificateGenerator.createSelfSigned({
          name: "CN=Test",
          keys,
          signingAlgorithm: algorithm
        });
      });

      it("should calculate SKI", async () => {
        const ski = await DefaultCertificateStorageHandler.getSKI(cert);
        const skiHex = Buffer.from(ski).toString("hex");
        const skiExt = cert.getExtension(x509.SubjectKeyIdentifierExtension);
        expect(skiExt).toBeNull();
        const skiFromPubKey = await cert.publicKey.getKeyIdentifier();
        const skiHexFromPubKey = Buffer.from(skiFromPubKey).toString("hex");
        expect(skiHex).toBe(skiHexFromPubKey);
      });
    });
  });

  describe("isIssuerCertificate", () => {
    describe("issuer and subject are different", () => {
      let issuer: x509.X509Certificate;
      let cert: x509.X509Certificate;

      beforeAll(async () => {
        const algorithm = {
          name: "ECDSA",
          namedCurve: "P-256"
        };
        const issuerKeys = await crypto.subtle.generateKey(algorithm, false, [
          "sign",
          "verify"
        ]);
        issuer = await x509.X509CertificateGenerator.createSelfSigned({
          name: "CN=Issuer",
          keys: issuerKeys,
          signingAlgorithm: algorithm
        });

        const certKeys = await crypto.subtle.generateKey(algorithm, false, [
          "sign",
          "verify"
        ]);
        cert = await x509.X509CertificateGenerator.create({
          issuer: "CN=Issuer 2",
          subject: "CN=Test",
          publicKey: certKeys.publicKey,
          signingKey: issuerKeys.privateKey,
          signingAlgorithm: algorithm
        });
      });

      it("should return false", async () => {
        const result =
          await DefaultCertificateStorageHandler.isIssuerCertificate(
            cert,
            issuer
          );
        expect(result).toBe(false);
      });
    });

    describe("authority extension", () => {
      describe("keyIdentifier", () => {
        describe("value matches", () => {
          let issuer: x509.X509Certificate;
          let cert: x509.X509Certificate;

          beforeAll(async () => {
            const algorithm = {
              name: "ECDSA",
              namedCurve: "P-256"
            };
            const issuerKeys = await crypto.subtle.generateKey(
              algorithm,
              false,
              ["sign", "verify"]
            );
            issuer = await x509.X509CertificateGenerator.createSelfSigned({
              name: "CN=Issuer",
              keys: issuerKeys,
              signingAlgorithm: algorithm
            });

            const certKeys = await crypto.subtle.generateKey(algorithm, false, [
              "sign",
              "verify"
            ]);
            cert = await x509.X509CertificateGenerator.create({
              issuer: issuer.subject,
              subject: "CN=Test",
              publicKey: certKeys.publicKey,
              signingKey: issuerKeys.privateKey,
              signingAlgorithm: algorithm,
              extensions: [
                await x509.AuthorityKeyIdentifierExtension.create(
                  issuerKeys.publicKey
                )
              ]
            });
          });

          it("should return true", async () => {
            const result =
              await DefaultCertificateStorageHandler.isIssuerCertificate(
                cert,
                issuer
              );
            expect(result).toBe(true);
          });
        });

        describe("value does not match", () => {
          let issuer: x509.X509Certificate;
          let cert: x509.X509Certificate;

          beforeAll(async () => {
            const algorithm = {
              name: "ECDSA",
              namedCurve: "P-256"
            };
            const issuerKeys = await crypto.subtle.generateKey(
              algorithm,
              false,
              ["sign", "verify"]
            );
            issuer = await x509.X509CertificateGenerator.createSelfSigned({
              name: "CN=Issuer",
              keys: issuerKeys,
              signingAlgorithm: algorithm
            });

            const certKeys = await crypto.subtle.generateKey(algorithm, false, [
              "sign",
              "verify"
            ]);
            cert = await x509.X509CertificateGenerator.create({
              issuer: issuer.subject,
              subject: "CN=Test",
              publicKey: certKeys.publicKey,
              signingKey: issuerKeys.privateKey,
              signingAlgorithm: algorithm,
              extensions: [
                new x509.AuthorityKeyIdentifierExtension(
                  "0102030405060708090a0b0c0d0e0f01020304"
                )
              ]
            });
          });

          it("should return false", async () => {
            const result =
              await DefaultCertificateStorageHandler.isIssuerCertificate(
                cert,
                issuer
              );
            expect(result).toBe(false);
          });
        });
      });

      describe("authorityCertIssuer and authorityCertSerialNumber", () => {
        describe("values match", () => {
          let issuer: x509.X509Certificate;
          let cert: x509.X509Certificate;

          beforeAll(async () => {
            const algorithm = {
              name: "ECDSA",
              namedCurve: "P-256"
            };
            const issuerKeys = await crypto.subtle.generateKey(
              algorithm,
              false,
              ["sign", "verify"]
            );
            issuer = await x509.X509CertificateGenerator.createSelfSigned({
              name: "CN=Issuer",
              keys: issuerKeys,
              signingAlgorithm: algorithm
            });

            const certKeys = await crypto.subtle.generateKey(algorithm, false, [
              "sign",
              "verify"
            ]);
            cert = await x509.X509CertificateGenerator.create({
              issuer: issuer.subject,
              subject: "CN=Test",
              publicKey: certKeys.publicKey,
              signingKey: issuerKeys.privateKey,
              signingAlgorithm: algorithm,
              extensions: [
                await x509.AuthorityKeyIdentifierExtension.create({
                  name: new x509.GeneralNames([
                    new x509.GeneralName("dn", issuer.subject)
                  ]),
                  serialNumber: issuer.serialNumber
                })
              ]
            });
          });

          it("should return true", async () => {
            const result =
              await DefaultCertificateStorageHandler.isIssuerCertificate(
                cert,
                issuer
              );
            expect(result).toBe(true);
          });
        });

        describe("values do not match", () => {
          let issuer: x509.X509Certificate;
          let cert: x509.X509Certificate;

          beforeAll(async () => {
            const algorithm = {
              name: "ECDSA",
              namedCurve: "P-256"
            };
            const issuerKeys = await crypto.subtle.generateKey(
              algorithm,
              false,
              ["sign", "verify"]
            );
            issuer = await x509.X509CertificateGenerator.createSelfSigned({
              name: "CN=Issuer",
              keys: issuerKeys,
              signingAlgorithm: algorithm
            });

            const certKeys = await crypto.subtle.generateKey(algorithm, false, [
              "sign",
              "verify"
            ]);
            cert = await x509.X509CertificateGenerator.create({
              issuer: issuer.subject,
              subject: "CN=Test",
              publicKey: certKeys.publicKey,
              signingKey: issuerKeys.privateKey,
              signingAlgorithm: algorithm,
              extensions: [
                await x509.AuthorityKeyIdentifierExtension.create({
                  name: new x509.GeneralNames([
                    new x509.GeneralName("dn", issuer.subject)
                  ]),
                  serialNumber: "123456"
                })
              ]
            });
          });

          it("should return false", async () => {
            const result =
              await DefaultCertificateStorageHandler.isIssuerCertificate(
                cert,
                issuer
              );
            expect(result).toBe(false);
          });
        });
      });
    });
  });

  describe("findCertificate", () => {
    let caCert: x509.X509Certificate;

    beforeAll(async () => {
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
        serialNumber: "0102",
        name: "CN=CA Test",
        keys: caKeys,
        signingAlgorithm: algorithm
      });
    });

    it("should return issuer certificate by spki", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const spki = await caCert.publicKey.getKeyIdentifier();
      const result = await storage.findCertificate(spki);
      expect(result).toBe(caCert);
    });

    it("should return null if spki is not found", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const spki = new Uint8Array(32);
      const result = await storage.findCertificate(spki);
      expect(result).toBeNull();
    });

    it("should return issuer certificate by serialNumber and issuer", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const result = await storage.findCertificate(
        Convert.FromHex("02020102"),
        caCert.issuerName.toArrayBuffer()
      );
      expect(result).toBe(caCert);
    });

    it("should return null if serialNumber is different", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const result = await storage.findCertificate(
        Convert.FromHex("02020103"),
        caCert.issuerName.toArrayBuffer()
      );
      expect(result).toBeNull();
    });

    it("should return issuer from parent storage", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;
      const result = await childStorage.findCertificate(
        Convert.FromHex("02020102"),
        caCert.issuerName.toArrayBuffer()
      );
      expect(result).toBe(caCert);
    });

    it("should return null if issuer does not present in parent storage too", async () => {
      const storage = new DefaultCertificateStorageHandler();

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;
      const result = await childStorage.findCertificate(
        Convert.FromHex("02020102"),
        caCert.issuerName.toArrayBuffer()
      );
      expect(result).toBeNull();
    });
  });

  describe("findIssuer", () => {
    let caCert: x509.X509Certificate;
    let cert: x509.X509Certificate;

    beforeAll(async () => {
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
        serialNumber: "0102",
        name: "CN=CA Test",
        keys: caKeys,
        signingAlgorithm: algorithm
      });

      // create certificate
      const certKeys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      cert = await x509.X509CertificateGenerator.create({
        issuer: caCert.subject,
        subject: "CN=Test",
        publicKey: certKeys.publicKey,
        signingKey: caKeys.privateKey,
        signingAlgorithm: algorithm
      });
    });

    it("should return issuer certificate for leaf certificate", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);
      storage.certificates.push(cert);

      const result = await storage.findIssuer(cert);
      expect(result).toBe(caCert);
    });

    it("should return null if issuer does not present", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(cert);

      const result = await storage.findIssuer(cert);
      expect(result).toBeNull();
    });

    it("should return the same certificate if it is self-signed", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const result = await storage.findIssuer(caCert);
      expect(result).toBe(caCert);
    });

    it("should return issuer from parent storage", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;
      childStorage.certificates.push(cert);

      const result = await childStorage.findIssuer(cert);
      expect(result).toBe(caCert);
    });

    it("should return null if issuer does not present in parent storage too", async () => {
      const storage = new DefaultCertificateStorageHandler();

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;
      childStorage.certificates.push(cert);

      const result = await childStorage.findIssuer(cert);
      expect(result).toBeNull();
    });
  });

  describe("isTrusted", () => {
    let caCert: x509.X509Certificate;
    let cert: x509.X509Certificate;

    class TestCertificateStorageHandler extends DefaultCertificateStorageHandler {
      public override async isTrusted(
        cert: x509.X509Certificate
      ): Promise<IsTrustedResult> {
        const selfSigned = await cert.isSelfSigned();
        return { target: this, result: selfSigned };
      }
    }

    beforeAll(async () => {
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
        serialNumber: "0102",
        name: "CN=CA Test",
        keys: caKeys,
        signingAlgorithm: algorithm
      });

      // create certificate
      const certKeys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      cert = await x509.X509CertificateGenerator.create({
        issuer: caCert.subject,
        subject: "CN=Test",
        publicKey: certKeys.publicKey,
        signingKey: caKeys.privateKey,
        signingAlgorithm: algorithm
      });
    });

    it("should return false if certificate is not trusted", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const result = await storage.isTrusted(cert);
      expect(result.result).toBe(false);
    });

    it("should return true if certificate is trusted by parent storage", async () => {
      const storage = new TestCertificateStorageHandler();
      storage.certificates.push(caCert);

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;

      const result = await childStorage.isTrusted(caCert);
      expect(result.result).toBe(true);
    });

    it("should return false if certificate is not trusted by parent storage", async () => {
      const storage = new DefaultCertificateStorageHandler();

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;

      const result = await childStorage.isTrusted(caCert);
      expect(result.result).toBe(false);
    });
  });

  describe("findRevocation", () => {
    let caCert: x509.X509Certificate;
    let cert: x509.X509Certificate;
    let crl: CRL;
    let ocsp: OCSP;

    beforeAll(async () => {
      const algorithm = {
        name: "ECDSA",
        namedCurve: "P-256"
      };
      const signingAlgorithm = { ...algorithm, hash: "SHA-256" };

      // create CA certificate
      const caKeys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      caCert = await x509.X509CertificateGenerator.createSelfSigned({
        serialNumber: "0102",
        name: "CN=CA Test",
        keys: caKeys,
        signingAlgorithm
      });

      // create certificate
      const certKeys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      cert = await x509.X509CertificateGenerator.create({
        issuer: caCert.subject,
        subject: "CN=Test",
        publicKey: certKeys.publicKey,
        signingKey: caKeys.privateKey,
        signingAlgorithm
      });

      // create CRL
      const x509Crl = await x509.X509CrlGenerator.create({
        issuer: caCert.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: caKeys.privateKey,
        signingAlgorithm
      });
      crl = CRL.fromBER(x509Crl.rawData);

      // create OCSP
      ocsp = await OCSP.create({
        issuer: caCert,
        signingKey: caKeys.privateKey,
        signingAlgorithm,
        responses: [
          {
            certId: await CertificateID.create("SHA-256", cert, caCert),
            status: {
              type: "good"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
          }
        ]
      });
    });

    it("should return CRL by certificate", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);
      storage.crls.push(crl);

      const result = await storage.findRevocation("crl", cert);
      expect(result.result).toBeTruthy();
      expect(result.result).toBe(crl);
    });

    it("should return null if CRL is not found", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const result = await storage.findRevocation("crl", cert);
      expect(result.result).toBeNull();
    });

    it("should return OCSP by certificate", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);
      storage.ocsps.push(ocsp);

      const result = await storage.findRevocation("ocsp", cert);
      expect(result.result).toBeTruthy();
      expect(result.result).toBe(ocsp);
    });

    it("should return null if OCSP is not found", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);

      const result = await storage.findRevocation("ocsp", cert);
      expect(result.result).toBeNull();
    });

    it("should return revocation from parent storage", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(caCert);
      storage.ocsps.push(ocsp);

      const childStorage = new DefaultCertificateStorageHandler();
      childStorage.parent = storage;

      const result = await childStorage.findRevocation("ocsp", cert);
      expect(result.result).toBeTruthy();
      expect(result.result).toBe(ocsp);
    });
  });

  describe("fetchRevocation", () => {
    let rootCert: x509.X509Certificate;
    let caCert: x509.X509Certificate;

    beforeAll(async () => {
      const rootEnc = [
        "MIICjzCCAhWgAwIBAgIQXIuZxVqUxdJxVt7NiYDMJjAKBggqhkjOPQQDAzCBiDEL",
        "MAkGA1UEBhMCVVMxEzARBgNVBAgTCk5ldyBKZXJzZXkxFDASBgNVBAcTC0plcnNl",
        "eSBDaXR5MR4wHAYDVQQKExVUaGUgVVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNVBAMT",
        "JVVTRVJUcnVzdCBFQ0MgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTAwMjAx",
        "MDAwMDAwWhcNMzgwMTE4MjM1OTU5WjCBiDELMAkGA1UEBhMCVVMxEzARBgNVBAgT",
        "Ck5ldyBKZXJzZXkxFDASBgNVBAcTC0plcnNleSBDaXR5MR4wHAYDVQQKExVUaGUg",
        "VVNFUlRSVVNUIE5ldHdvcmsxLjAsBgNVBAMTJVVTRVJUcnVzdCBFQ0MgQ2VydGlm",
        "aWNhdGlvbiBBdXRob3JpdHkwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAQarFRaqflo",
        "I+d61SRvU8Za2EurxtW20eZzca7dnNYMYf3boIkDuAUU7FfO7l0/4iGzzvfUinng",
        "o4N+LZfQYcTxmdwlkWOrfzCjtHDix6EznPO/LlxTsV+zfTJ/ijTjeXmjQjBAMB0G",
        "A1UdDgQWBBQ64QmG1M8ZwpZ2dEl23OA1xmNjmjAOBgNVHQ8BAf8EBAMCAQYwDwYD",
        "VR0TAQH/BAUwAwEB/zAKBggqhkjOPQQDAwNoADBlAjA2Z6EWCNzklwBBHU6+4WMB",
        "zzuqQhFkoJ2UOQIReVx7Hfpkue4WQrO/isIJxOzksU0CMQDpKmFHjFJKS04YcPbW",
        "RNZu9YO6bVi9JNlWSOrvxKJGgYhqOkbRqZtNyWHa0V1Xahg="
      ].join("");
      const caEnc = [
        "MIIDqDCCAy6gAwIBAgIRAPNkTmtuAFAjfglGvXvh9R0wCgYIKoZIzj0EAwMwgYgx",
        "CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpOZXcgSmVyc2V5MRQwEgYDVQQHEwtKZXJz",
        "ZXkgQ2l0eTEeMBwGA1UEChMVVGhlIFVTRVJUUlVTVCBOZXR3b3JrMS4wLAYDVQQD",
        "EyVVU0VSVHJ1c3QgRUNDIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MB4XDTE4MTEw",
        "MjAwMDAwMFoXDTMwMTIzMTIzNTk1OVowgY8xCzAJBgNVBAYTAkdCMRswGQYDVQQI",
        "ExJHcmVhdGVyIE1hbmNoZXN0ZXIxEDAOBgNVBAcTB1NhbGZvcmQxGDAWBgNVBAoT",
        "D1NlY3RpZ28gTGltaXRlZDE3MDUGA1UEAxMuU2VjdGlnbyBFQ0MgRG9tYWluIFZh",
        "bGlkYXRpb24gU2VjdXJlIFNlcnZlciBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEH",
        "A0IABHkYk8qfbZ5sVwAjBTcLXw9YWsTef1Wj6R7W2SUKiKAgSh16TwUwimNJE4xk",
        "IQeV/To14UrOkPAY9z2vaKb71EijggFuMIIBajAfBgNVHSMEGDAWgBQ64QmG1M8Z",
        "wpZ2dEl23OA1xmNjmjAdBgNVHQ4EFgQU9oUKOxGG4QR9DqoLLNLuzGR7e64wDgYD",
        "VR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYIKwYB",
        "BQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgEwUAYD",
        "VR0fBEkwRzBFoEOgQYY/aHR0cDovL2NybC51c2VydHJ1c3QuY29tL1VTRVJUcnVz",
        "dEVDQ0NlcnRpZmljYXRpb25BdXRob3JpdHkuY3JsMHYGCCsGAQUFBwEBBGowaDA/",
        "BggrBgEFBQcwAoYzaHR0cDovL2NydC51c2VydHJ1c3QuY29tL1VTRVJUcnVzdEVD",
        "Q0FkZFRydXN0Q0EuY3J0MCUGCCsGAQUFBzABhhlodHRwOi8vb2NzcC51c2VydHJ1",
        "c3QuY29tMAoGCCqGSM49BAMDA2gAMGUCMEvnx3FcsVwJbZpCYF9z6fDWJtS1UVRs",
        "cS0chWBNKPFNpvDKdrdKRe+oAkr2jU+ubgIxAODheSr2XhcA7oz9HmedGdMhlrd9",
        "4ToKFbZl+/OnFFzqnvOhcjHvClECEQcKmc8fmA=="
      ].join("");
      rootCert = new x509.X509Certificate(Buffer.from(rootEnc, "base64"));
      caCert = new x509.X509Certificate(Buffer.from(caEnc, "base64"));
    });

    it("should fetch CRL by certificate", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(rootCert);

      const result = await storage.fetchRevocation("crl", caCert);
      expect(result.result).toBeTruthy();
      expect(result.result).toBeInstanceOf(CRL);
    });

    it("should fetch OCSP by certificate", async () => {
      const storage = new DefaultCertificateStorageHandler();
      storage.certificates.push(rootCert);

      const result = await storage.fetchRevocation("ocsp", caCert);
      expect(result.result).toBeTruthy();
      expect(result.result).toBeInstanceOf(OCSP);
    });
  });

  it("fetchRevocation with stopPropagation", async () => {
    const issuer = new x509.X509Certificate(
      "MIIG6zCCBNOgAwIBAgIQeSmaexvS3f0QpnfHL1JU9TANBgkqhkiG9w0BAQwFADBSMQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEoMCYGA1UEAxMfR2xvYmFsU2lnbiBTZWN1cmUgTWFpbCBSb290IFI0NTAeFw0yMDAxMjAwMDAwMDBaFw0yNzAxMjAwMDAwMDBaMGIxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMTgwNgYDVQQDEy9HbG9iYWxTaWduIENvcnBvcmF0ZSBJVCBBdGxhcyBSNDUgU01JTUUgQ0EgMjAyMTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALmLoYT_vTd8M9b57KT3WrbFnqNQBWS3nXQH0dWsXx9g9vXycWHQncs3zvw1wf0NrhHeZgkwL4b1sjNWJBNxo_DYz6LdgLWZR1h6cFqfl4YZPN7iqelISBROMfFg4JlQgSIFpEz4Ab1ptdAcnNYDVOgMtqvuBO30uGZwJQa-ObwgJGO_ihUrhfCCFB55gz3PgGnEUP2boSEwjqzFUxzClL9etbbDUIa3tlpO4T8evAEcQ3KfG5bdbyDRyqlwEvRZapRwmvQeD4kd_zAxFRHwwP8w9pys600_MXk2YJzB7_WiYidRXukwDA2bBgeT2YklWhcfyhoB3B9w4VWn2PJ2YtE-3PqR1lp9Q-9I2GCAFZX4vOl2qSAUIi5piI9zU_RleNl-EV9lxCIWR0qcWDw3kM_kGusHfs6r6BBQIon14lsTIPi0t2Q98EUVgEALMkzdWvR1w6v9ub66qMLgAUe-mWweyd6gN9_sTBy9uKNJtxkZXxEWf4eoHjSGYFgWiPYXA3h6HLJEqDzndgX6oUECCK0X2PqoevYqDdrYc_Y7ke1TkpHG43mQKRcxgywV0z7XOPsGnXzlZiKanzB-QftBzg1FgtTEEofYNcT9bbTQ1xiUCT69ooEq9ndJMuXkXhiJyXXUZPAOjT4pYu-6oBq9bBX5rq3nECQqTvXs0Lj46cdTAgMBAAGjggGrMIIBpzAOBgNVHQ8BAf8EBAMCAYYwKQYDVR0lBCIwIAYIKwYBBQUHAwQGCSsGAQQBgjcVBQYJKwYBBAGCNxUGMBIGA1UdEwEB_wQIMAYBAf8CAQAwHQYDVR0OBBYEFGJ9uWbj1bWXMpYxQ3KGjEPSeJ72MB8GA1UdIwQYMBaAFKCTFShu7o8IsjXGnmJ5dKexDit7MIGJBggrBgEFBQcBAQR9MHswMwYIKwYBBQUHMAGGJ2h0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL3NtaW1lcm9vdHI0NTBEBggrBgEFBQcwAoY4aHR0cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9jYWNlcnQvcjNzbXI0NWNyb3NzMjAyMC5jcnQwOwYDVR0fBDQwMjAwoC6gLIYqaHR0cDovL2NybC5nbG9iYWxzaWduLmNvbS9zbWltZXJvb3RyNDUuY3JsME0GA1UdIARGMEQwQgYKKwYBBAGgMgoDAjA0MDIGCCsGAQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWduLmNvbS9yZXBvc2l0b3J5LzANBgkqhkiG9w0BAQwFAAOCAgEA2h3dySyXP4DIgt1ahFv5-hSG9COBnCaa8wLBQP7Qj6OuRrMkCtcLFH1j8MZNO_kp49nYPQKcLlQFmtmXVDyr35Pox8hOwpw46EGS80ZHPS-g50Aas2KomwwKy_gqT5hZEbetzJN4-gsM5NOOD7yb2B_dv6LChBXQnIU0h62JqbPpZe9HZXiIcqHWtTWJXojBVYGUKk9NYPLHaiM_4uDqAScS3gIcxxb6_qhVXBacdiF2ljuwDlzOxq41CyOnmedclj5O6uBZIaJ68yYre4UqZyqi_qWnFyJVne89r-pfNy7ftXYwYKX79ENbc6kb6WG67knv-DSwidSu9Gj6RNLFso9V_SXdrviNNnriHg15faC_ZVkCEMKg6fhZTYKTbSuego7Ls-Ykl1i43mrwlMvQDJc3-xb14vGmEQJG36vPSFoK86z22xb71nnXlWD03_Z_o-F5XketBAUoLJ_J9IWCdG1_-OaE5aLTiWmhkj7KR7Q1SUOPJAbbvOFYb2b7Bc0njQb_vTJ8hlUERkobTOm5gslJEWAuFtsjxlJPEppvbYq-ip32s-vyPKvVmeLk_2cy1NAxxGzU8U4kch9xzA6vo3UCUQy2T34bDQErxyG2Yt0SMFypCRlWKvREcPOVSRCzHsfpJ58ow5eZCOs9dw-5g7OQt48zvoK6hHSJqSOPIAQ"
    );
    const cert = new x509.X509Certificate(
      "MIIHdTCCBV2gAwIBAgIQATzOw1vjP-9-Pz4LXUe9DjANBgkqhkiG9w0BAQsFADBiMQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTE4MDYGA1UEAxMvR2xvYmFsU2lnbiBDb3Jwb3JhdGUgSVQgQXRsYXMgUjQ1IFNNSU1FIENBIDIwMjEwHhcNMjIwMjIzMDQ1OTU0WhcNMjMwMjIzMDQ1OTU0WjBoMQswCQYDVQQGEwJCRTEXMBUGA1UECAwOVmxhYW1zLUJyYWJhbnQxDzANBgNVBAcMBkxldXZlbjEZMBcGA1UECgwQR2xvYmFsU2lnbiBudi1zYTEUMBIGA1UEAwwLTW9oaXQgS3VtYXIwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQCYo4QuAHDUfJb_vqUXo4uHs_Nw3AujPkgfXMLBaMZ1vCdI6vMOsa-PLI5-L1-7cWeUF9dgI2EU-uXWZn2G7VgVne4b2KICQUInuTulCzJOrPRfO8xGxDiMKu_-VKO4t1RxofFlkbeM72WBIu4SNwApGRbgjgoxBoAThfCOUICIEvNyA6BoFgmZ7cdjpewz6kWQx_2s1AN7OXyn6XZoEYmpU_j5AYVSwY3xrTbBjQ_DvPy0HgBGWmEN8Tt64KXygOG5uqrme9tinQxHEDaHaO1hUcK_pM9npVgr3ViwWH6yZaousdCCe6mkaLZIkODT2eSua9U__hkUdw5zoSx9kgRrjGY4oN52Ers7UTpqG30_LRAkqsp7J0L86clmWROhzT2768BP4X3YmZ9acFltw-9tIsh9p4O85oxQ0bpugtbPq6J0k1HCP5Bm_7bAhI_PVZkeaWpWB6wCWhDSazT7D8l2rAkuxJRfgsoUSdhI6YvUavkVIHLsH3rqgbvkDrw3h2ekoUrGBvdI9fZfkEDm-XKM9Zs0Fdc9zDbXQdp8RAD0mVMLYnbZ8kn0XbNLpYLeDeBgTZ3i0667rj2Ch1FUI3s7bXYKEcxgfaAvMQ02L14-CEZWfXEk0mfs4kjueavcIUNsGasDNN6j22h6w1rOgW20YwsL9jH453icvi8F4NTF0QIDAQABo4ICHzCCAhswJQYDVR0RBB4wHIEabW9oaXQua3VtYXJAZ2xvYmFsc2lnbi5jb20wDgYDVR0PAQH_BAQDAgWgMBMGA1UdJQQMMAoGCCsGAQUFBwMEMD0GCSsGAQQBgjcVBwQwMC4GJisGAQQBgjcVCIaPkCaEoMBBhNWTK7zYI4fywymBYYXhkXqFz51DAgFkAgEUMB0GA1UdDgQWBBTbowJvhDU4JhxrLQWOtAQO0BEdaTBNBgNVHSAERjBEMEIGCisGAQQBoDIKAwIwNDAyBggrBgEFBQcCARYmaHR0cHM6Ly93d3cuZ2xvYmFsc2lnbi5jb20vcmVwb3NpdG9yeS8wDAYDVR0TAQH_BAIwADCBoQYIKwYBBQUHAQEEgZQwgZEwRQYIKwYBBQUHMAGGOWh0dHA6Ly9vY3NwLmdsb2JhbHNpZ24uY29tL2NhL2dzY29ycGl0YXRsYXNyNDVzbWltZWNhMjAyMTBIBggrBgEFBQcwAoY8aHR0cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9nc2NvcnBpdGF0bGFzcjQ1c21pbWVjYTIwMjEuY3J0MB8GA1UdIwQYMBaAFGJ9uWbj1bWXMpYxQ3KGjEPSeJ72ME0GA1UdHwRGMEQwQqBAoD6GPGh0dHA6Ly9jcmwuZ2xvYmFsc2lnbi5jb20vY2EvZ3Njb3JwaXRhdGxhc3I0NXNtaW1lY2EyMDIxLmNybDANBgkqhkiG9w0BAQsFAAOCAgEAr3WLqh149byT05jvZJ5BoYswn-Un2S7iH04VALYds_iC8tBvfQid-yPBgpX0u4s8QLQUNuugxci8XEzOb88UdWtjH7LyE3KajXHMMDLH8OofL3BKjhuQygNPnliI9j4DpWAZdOV_Ur_WawrNyQLOrzGJFfUUiTonhkDDLEcoX2ix219TuSxOoRLP3SI63NvfPwGwSYSLtWGEuaJFlBRiql9rTM-Dg1kA_3d9zUs2vDX2_fwg3U7sBAeGOmGNk27_PjXbcN6WH_aApgBW0LmpzWqUdu38VYF-od9Jg97eQ2u5v9xEYUf8VIV5o2u6y_1xbTf6VylSfpMFGhp-3-jdhN35KUdT5A2yqyzIDREbeFG3tVx1RsWEnVUa_NZ-oBHJtbiRSWGXFEH7h2ltBccED8DNbrqirgXDmo2Q5Dabc6pWQO5CLQ2g631Z7f9BXR3vaHJXoWHdQPUYQNQNx4cfnsN3vReKtp9WQua9lQ9JguaBKyt_gA6IItNfYqBmUiezGlXlWZA1hOHIK2SOhP5PK1hUlwvepsxJU5PMLhLifAIQV9QHwpN5fEtFmbTyHHS_HPx4yJ3KiPGoyx2oN0RJtpXI_kdveUxmsEUWNiPl6jL_jCZJZEGHW0749mSLA_-3_VmiWxj84OCNA15jHF2rpIKlSIARJZF1Sy7NWZDceVM"
    );

    const certStorage: ICertificateStorageHandler =
      new DefaultCertificateStorageHandler();
    certStorage.certificates.push(issuer);

    const ocsp = await certStorage.fetchRevocation("ocsp", cert);
    expect(ocsp.result).toBeInstanceOf(OCSP);
    expect(ocsp.target).toBe(certStorage);

    class ApplicationStorage extends DefaultCertificateStorageHandler {
      public override async fetchRevocation(
        type: "crl",
        cert: x509.X509Certificate
      ): Promise<IResult<CRL | null>>;
      public override async fetchRevocation(
        type: "ocsp",
        cert: x509.X509Certificate
      ): Promise<IResult<OCSP | null>>;
      public override async fetchRevocation(
        type: RevocationType,
        cert: x509.X509Certificate
      ): Promise<IResult<CRL | OCSP | null>> {
        if (type === "ocsp") {
          return {
            result: null,
            target: this,
            stopPropagation: true
          };
        }

        return super.fetchRevocation(type, cert);
      }
    }

    certStorage.parent = new ApplicationStorage();
    const ocsp2 = await certStorage.fetchRevocation("ocsp", cert);
    expect(ocsp2.result).toBeNull();
    expect(ocsp2.target).toBe(certStorage.parent);
  });
});
