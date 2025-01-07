import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import "./algorithms";
import { OCSP } from "./OCSP";
import { CertificateID } from "./CertID";
import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";

describe("OCSP", () => {
  beforeAll(() => {
    pkijs.setEngine(
      "newEngine",
      new pkijs.CryptoEngine({ name: "nodejs", crypto })
    );
  });

  describe("create", () => {
    it("should create OCSP response", async () => {
      const algorithm = {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: "SHA-256"
      } as EcKeyGenParams | EcdsaParams;

      // create CA
      const caKeys = (await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ])) as CryptoKeyPair;
      const caCert = await x509.X509CertificateGenerator.createSelfSigned(
        {
          name: "CN=CA Test",
          keys: caKeys,
          signingAlgorithm: algorithm,
          notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
        },
        crypto
      );

      // create leaf
      const leafKeys = (await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ])) as CryptoKeyPair;
      const leafCert = await x509.X509CertificateGenerator.create({
        issuer: caCert.issuer,
        subject: "CN=Leaf Test",
        publicKey: leafKeys.publicKey,
        signingKey: caKeys.privateKey,
        signingAlgorithm: algorithm
      });

      // create OCSP response
      const ocsp = await OCSP.create({
        issuer: caCert,
        signingAlgorithm: algorithm,
        signingKey: caKeys.privateKey,
        responses: [
          {
            certId: await CertificateID.create("SHA-256", leafCert, caCert),
            status: {
              type: "good"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
          }
        ],
        producedAt: new Date()
      });

      const ok = await ocsp.verify(caCert);
      expect(ok).toBe(true);
    });
  });

  describe("fromOCSPResponse/toOCSPResponse", () => {
    it("should parse and serialize OCSP response", () => {
      const ocspResponseEnc = [
        "MIIBVgoBAKCCAU8wggFLBgkrBgEFBQcwAQEEggE8MIIBODCBvqE0MDIxCzAJBgNVBAYTAlVTMRYwFAYD",
        "VQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJFNRgPMjAyNDEyMTUwODI2MDBaMHUwczBLMAkGBSsO",
        "AwIaBQAEFB4RwMms/aRT70svanMhFWBNVK25BBSZzSnDoVgmr3p6TIRaj3OIYLDf3gISA2Z/04DWtQg1",
        "FEVjZfQKjaHYgAAYDzIwMjQxMjE1MDgyNjAwWqARGA8yMDI0MTIyMjA4MjU1OFowCgYIKoZIzj0EAwMD",
        "aQAwZgIxAO/YNlTbYzpsrRGfRmux0SRofPeF3qayn5r+V3e9chKw9Z0k/DPrn5uDXt5rMubPvgIxAKvD",
        "47tcxPW+oBouWNNESF3tz9fP9qJDKMchvsXGAUcQ7zNZdWFobZML3LVuQbNxhw=="
      ].join("");

      const ocspResponse = OCSP.fromOCSPResponse(
        Buffer.from(ocspResponseEnc, "base64")
      );
      expect(ocspResponse.signatureAlgorithm).toEqual({
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        }
      });
      expect(ocspResponse.signatureValue).toBeDefined();

      const raw = ocspResponse.toOCSPResponse();
      expect(Buffer.from(raw).toString("base64")).toBe(ocspResponseEnc);
    });
  });

  describe("fromBER", () => {
    const basicOcspEnc =
      "308201383081BEA1343032310B300906035504061302555331163014060355040A130D4C6574277320456E6372797074310B3009060355040313024535180F32303234313231353038323630305A30753073304B300906052B0E03021A050004141E11C0C9ACFDA453EF4B2F6A732115604D54ADB9041499CD29C3A15826AF7A7A4C845A8F738860B0DFDE021203667FD380D6B5083514456365F40A8DA1D88000180F32303234313231353038323630305AA011180F32303234313232323038323535385A300A06082A8648CE3D0403030369003066023100EFD83654DB633A6CAD119F466BB1D124687CF785DEA6B29F9AFE5777BD7212B0F59D24FC33EB9F9B835EDE6B32E6CFBE023100ABC3E3BB5CC4F5BEA01A2E58D344485DEDCFD7CFF6A24328C721BEC5C6014710EF33597561686D930BDCB56E41B37187";
    it("should parse OCSP response", async () => {
      const caEnc = [
        "MIIEVzCCAj+gAwIBAgIRAIOPbGPOsTmMYgZigxXJ/d4wDQYJKoZIhvcNAQELBQAw",
        "TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh",
        "cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw",
        "WhcNMjcwMzEyMjM1OTU5WjAyMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg",
        "RW5jcnlwdDELMAkGA1UEAxMCRTUwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAAQNCzqK",
        "a2GOtu/cX1jnxkJFVKtj9mZhSAouWXW0gQI3ULc/FnncmOyhKJdyIBwsz9V8UiBO",
        "VHhbhBRrwJCuhezAUUE8Wod/Bk3U/mDR+mwt4X2VEIiiCFQPmRpM5uoKrNijgfgw",
        "gfUwDgYDVR0PAQH/BAQDAgGGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD",
        "ATASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBSfK1/PPCFPnQS37SssxMZw",
        "i9LXDTAfBgNVHSMEGDAWgBR5tFnme7bl5AFzgAiIyBpY9umbbjAyBggrBgEFBQcB",
        "AQQmMCQwIgYIKwYBBQUHMAKGFmh0dHA6Ly94MS5pLmxlbmNyLm9yZy8wEwYDVR0g",
        "BAwwCjAIBgZngQwBAgEwJwYDVR0fBCAwHjAcoBqgGIYWaHR0cDovL3gxLmMubGVu",
        "Y3Iub3JnLzANBgkqhkiG9w0BAQsFAAOCAgEAH3KdNEVCQdqk0LKyuNImTKdRJY1C",
        "2uw2SJajuhqkyGPY8C+zzsufZ+mgnhnq1A2KVQOSykOEnUbx1cy637rBAihx97r+",
        "bcwbZM6sTDIaEriR/PLk6LKs9Be0uoVxgOKDcpG9svD33J+G9Lcfv1K9luDmSTgG",
        "6XNFIN5vfI5gs/lMPyojEMdIzK9blcl2/1vKxO8WGCcjvsQ1nJ/Pwt8LQZBfOFyV",
        "XP8ubAp/au3dc4EKWG9MO5zcx1qT9+NXRGdVWxGvmBFRAajciMfXME1ZuGmk3/GO",
        "koAM7ZkjZmleyokP1LGzmfJcUd9s7eeu1/9/eg5XlXd/55GtYjAM+C4DG5i7eaNq",
        "cm2F+yxYIPt6cbbtYVNJCGfHWqHEQ4FYStUyFnv8sjyqU8ypgZaNJ9aVcWSICLOI",
        "E1/Qv/7oKsnZCWJ926wU6RqG1OYPGOi1zuABhLw61cuPVDT28nQS/e6z95cJXq0e",
        "K1BcaJ6fJZsmbjRgD5p3mvEf5vdQM7MCEvU0tHbsx2I5mHHJoABHb8KVBgWp/lcX",
        "GWiWaeOyB7RP+OfDtvi2OsapxXiV7vNVs7fMlrRjY1joKaqmmycnBvAq14AEbtyL",
        "sVfOS66B8apkeFX2NY4XPEYV4ZSCe8VHPrdrERk2wILG3T/EGmSIkCYVUMSnjmJd",
        "VQD9F6Na/+zmXCc="
      ].join("");
      const certEnc = [
        "MIIDezCCAwCgAwIBAgISA2Z/04DWtQg1FEVjZfQKjaHYMAoGCCqGSM49BAMDMDIx",
        "CzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJF",
        "NTAeFw0yNDExMDIyMTA5NDlaFw0yNTAxMzEyMTA5NDhaMBIxEDAOBgNVBAMTB2xh",
        "cG8uaXQwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARliQaE++bzrSRNmBVbiiQg",
        "9Xm9Okka3VwCZmFSXbzIzEp/sk64BiIbaIB6zC6FVQ7aQFDYkSqiarR/0QuZaQek",
        "o4ICFDCCAhAwDgYDVR0PAQH/BAQDAgeAMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggr",
        "BgEFBQcDAjAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBQaDrFDmeGL2zhbCyVYaqaX",
        "5E7lzDAfBgNVHSMEGDAWgBSfK1/PPCFPnQS37SssxMZwi9LXDTBVBggrBgEFBQcB",
        "AQRJMEcwIQYIKwYBBQUHMAGGFWh0dHA6Ly9lNS5vLmxlbmNyLm9yZzAiBggrBgEF",
        "BQcwAoYWaHR0cDovL2U1LmkubGVuY3Iub3JnLzAdBgNVHREEFjAUggkqLmxhcG8u",
        "aXSCB2xhcG8uaXQwEwYDVR0gBAwwCjAIBgZngQwBAgEwggEEBgorBgEEAdZ5AgQC",
        "BIH1BIHyAPAAdgCi4wrkRe+9rZt+OO1HZ3dT14JbhJTXK14bLMS5UKRH5wAAAZLu",
        "7AkOAAAEAwBHMEUCIC83pD0I9yAhShocAPmGMnjAnimjorRTk1yQ6UU8WtBbAiEA",
        "rWej/b+qNdnFk3kMUVQGC0watDV2V3Y+1XYYr2dmAycAdgDgkrP8DB3I52g2H95h",
        "uZZNClJ4GYpy1nLEsE2lbW9UBAAAAZLu7BEeAAAEAwBHMEUCIFGUd/zVhldtMSyM",
        "IKF34tE83nIgBDKfr3JN2FiVqrm9AiEA1mI+1WIAugqoZY17e9Og9QEZgZVBxQYx",
        "AeRIry8do8AwCgYIKoZIzj0EAwMDaQAwZgIxANKdmQMcUc6mk9RVutMNmvQYccS9",
        "+yu8zNpuU9w4/SgsuaDue4I6bbkc6f8KC+3y3QIxAKjyv2BdsJpeOQPd8Idn+MaZ",
        "8czfzqWZ3jvEvPPr8gDpx+8JfaHrRBFmdKij28GevA=="
      ].join("");
      const caCert = new x509.X509Certificate(Buffer.from(caEnc, "base64"));
      const cert = new x509.X509Certificate(Buffer.from(certEnc, "base64"));
      const ocsp = OCSP.fromBER(Buffer.from(basicOcspEnc, "hex"));
      const certStorage = new DefaultCertificateStorageHandler();
      certStorage.certificates = new x509.X509Certificates([cert, caCert]);
      ocsp.certificateHandler.parent = certStorage;

      const ok = await ocsp.verify(caCert);
      expect(ok).toBe(true);

      const status = await ocsp.checkCertStatus(cert);
      expect(status).toBe("good");
    });
  });
});
