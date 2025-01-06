import * as x509 from "@peculiar/x509";
import * as core from "@peculiar/pdf-core";
import {
  AdobeRevocationInfoArchival,
  CertificateID,
  CmsAttribute,
  CMSContentType,
  CMSSignedData,
  ContentTypeAttribute,
  CRL,
  DocumentModificationState,
  EmbeddedSigningTimeState,
  FormattingState,
  LtvState,
  MessageDigestAttribute,
  OCSP,
  PDFDocument,
  RevocationData,
  SignatureBoxGroup,
  SignatureStates,
  SignatureVerifyResult,
  SigningCertificateV2Attribute,
  SigningTimeAttribute,
  SigningTimeState,
  TimeStampToken,
  TimeStampTokenAttribute
} from "@peculiar/pdf-doc";
import {
  createPdfWithPage,
  getTimeStampToken,
  RootCertificateStorageHandler
} from "@peculiar/pdf-tests";
import { BufferSourceConverter, Convert } from "pvtsutils";
import * as pkijs from "pkijs";

// Helper functions
async function createSelfSignedCertificate() {
  const alg: RsaHashedKeyGenParams = {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048
  };
  const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
  const cert = await x509.X509CertificateGenerator.createSelfSigned(
    {
      serialNumber: "0102030405",
      notBefore: new Date("2021-06-29"),
      notAfter: new Date("2022-06-29"),
      name: "CN=Test",
      keys,
      signingAlgorithm: alg,
      extensions: [
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.digitalSignature |
            x509.KeyUsageFlags.nonRepudiation |
            x509.KeyUsageFlags.keyCertSign
        ),
        new x509.BasicConstraintsExtension(false),
        await x509.AuthorityKeyIdentifierExtension.create(
          keys.publicKey!,
          false,
          crypto
        ),
        await x509.SubjectKeyIdentifierExtension.create(
          keys.publicKey!,
          false,
          crypto
        ),
        new x509.ExtendedKeyUsageExtension([
          "1.3.6.1.4.1.311.10.3.12", // documentSigning
          "1.2.840.113583.1.1.5" // pdfAuthenticDocumentsTrust
        ])
      ]
    },
    crypto
  );

  return { keys, cert };
}

function signHandler(
  hash: string,
  keys: CryptoKeyPair,
  cert: x509.X509Certificate
) {
  return async (data: Uint8Array) => {
    const messageDigest = await crypto.subtle.digest(hash, data);
    const signedData = new CMSSignedData();
    const signer = signedData.createSigner(cert, {
      digestAlgorithm: hash,
      signedAttributes: [
        new ContentTypeAttribute(CMSContentType.data),
        new SigningTimeAttribute(new Date()),
        new MessageDigestAttribute(messageDigest)
      ]
    });

    signedData.certificates.push(cert);

    await signedData.sign(keys.privateKey!, signer);

    return signedData.toBER();
  };
}

async function createAndSignDocument(eol: string = "\n") {
  core.PDFDocumentUpdate.EOF_EOL = eol;
  const doc = await createPdfWithPage();
  const page = doc.pages.get(0);
  page.addSignatureBox({ groupName: "box1" });
  await doc.save();

  const { keys, cert } = await createSelfSignedCertificate();
  const box1 = doc.getComponentByName("box1", SignatureBoxGroup);

  await box1.sign({
    dictionaryUpdate: async (dict) => {
      dict.subFilter = "adbe.pkcs7.detached";
      dict.Reason.get().text = "Test Reason";
      dict.Location.get().text = "Test Location";
    },
    containerCreate: signHandler("SHA-256", keys, cert)
  });

  return { doc, keys, cert };
}

function getSignatureState(
  states: SignatureVerifyResult,
  code: string
): SignatureStates {
  const state = states.states.find((o) => o.code === code);
  expect(state).toBeDefined();
  return state!;
}

describe("SignatureBoxGroup", () => {
  beforeAll(() => {
    pkijs.setEngine("newEngine", new core.PDFCryptoEngine({ crypto }));
    x509.cryptoProvider.set(crypto);
  });

  afterEach(() => {
    core.PDFDocumentUpdate.EOF_EOL = "\n"; // restore default value
  });

  describe("Formatting state validation", () => {
    const validEOLs = [
      ["empty", ""],
      ["LF", "\n"],
      ["CRLF", "\r\n"],
      ["LFLF", "\n\n"],
      ["LFLFLF", "\n\n\n"]
    ];

    test.each(validEOLs)(
      "should create valid PDF with %s EOL",
      async (_, eol) => {
        const { doc } = await createAndSignDocument(eol);
        const verify = await doc.verify();
        expect(verify.items[0].states[0].type).toBe("valid");
      }
    );

    it("should detect too many bytes after %%EOF marker", async () => {
      const { doc } = await createAndSignDocument("\n\n\n\n");
      const verify = await doc.verify();
      const formattingState = verify.items[0].states[0] as FormattingState;

      expect(formattingState.type).toBe("invalid");
      expect(formattingState.data.error?.message).toBe(
        "The range of bytes points to an incorrect data. Too many bytes after %%EOF marker."
      );
    });

    it("should detect invalid EOL characters", async () => {
      const { doc } = await createAndSignDocument("\n \n");
      const verify = await doc.verify();
      const formattingState = verify.items[0].states[0] as FormattingState;

      expect(formattingState.type).toBe("invalid");
      expect(formattingState.data.error?.message).toBe(
        "The range of bytes points to an incorrect data. EOL contains invalid characters."
      );
    });

    it("should detect extra bytes after signed data", async () => {
      let { doc } = await createAndSignDocument();
      let raw = await doc.save();
      raw = BufferSourceConverter.concat(raw, Buffer.from("\n"));

      doc = await PDFDocument.load(raw);
      const verify = await doc.verify();
      const formattingState = verify.items[0].states[0] as FormattingState;

      expect(formattingState.type).toBe("invalid");
      expect(formattingState.data.error?.message).toBe(
        "The range of bytes points to an incorrect data. Document contains extra bytes after signed data."
      );
    });
  });

  describe("ByteRange validation", () => {
    test.each([0, 1, 2])(
      "should detect incorrect ByteRange[%i]",
      async (index) => {
        const doc = await createPdfWithPage();
        const page = doc.pages.get(0);
        page.addSignatureBox({ groupName: "box1" });
        await doc.save();

        const { keys, cert } = await createSelfSignedCertificate();
        const box1 = doc.getComponentByName("box1", SignatureBoxGroup);

        await box1.sign({
          dictionaryUpdate: async (dict) => {
            dict.subFilter = "adbe.pkcs7.detached";
            dict.Reason.get().text = "Test Reason";
            dict.Location.get().text = "Test Location";
          },
          containerCreate: (data) => {
            const byteRange = box1.getSignatureValue().ByteRange.get();
            const num = byteRange.get(index, core.PDFNumeric);
            const numValue = index > 1 ? num.value - 1 : num.value + 1;
            const str = numValue.toString();
            for (let i = 0; i < num.view.length; i++) {
              num.view[i] = str.charCodeAt(i) || 0;
            }
            return signHandler("SHA-256", keys, cert)(data);
          }
        });

        const doc2 = await PDFDocument.load(await doc.save());
        const verify = await doc2.verify();
        const formattingState = verify.items[0].states[0] as FormattingState;

        expect(formattingState.type).toBe("invalid");
        expect(formattingState.data.error?.message).toBe(
          `The range of bytes points to an incorrect data. ByteRange[${index}] points to an incorrect data.`
        );
      }
    );
  });

  describe("verify", () => {
    const keyAlg = {
      name: "ECDSA",
      namedCurve: "P-256"
    };
    const signingAlg = {
      name: "ECDSA",
      hash: "SHA-256"
    };
    let digicertCaCert: x509.X509Certificate;
    let rootCert: x509.X509Certificate;
    let intermediateCert: x509.X509Certificate;
    let intermediateCrl: CRL;
    let intermediateOcsp: OCSP;
    let leafCert: x509.X509Certificate;
    let leafCrl: CRL;
    let leafOcsp: OCSP;

    beforeAll(async () => {
      // !NOTE: Uncomment this block to generate new CA certificate
      // const caKeys = await crypto.subtle.generateKey(keyAlg, true, [
      //   "sign",
      //   "verify"
      // ]);
      // rootCert = await x509.X509CertificateGenerator.createSelfSigned({
      //   name: "CN=Test CA, O=Signing",
      //   notBefore: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days
      //   notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10 * 365), // 10 years
      //   keys: caKeys,
      //   signingAlgorithm: signingAlg,
      //   extensions: [
      //     new x509.BasicConstraintsExtension(true, 1, true),
      //     new x509.KeyUsagesExtension(
      //       x509.KeyUsageFlags.keyCertSign |
      //         x509.KeyUsageFlags.cRLSign |
      //         x509.KeyUsageFlags.digitalSignature,
      //       true
      //     ),
      //     await x509.SubjectKeyIdentifierExtension.create(
      //       caKeys.publicKey,
      //       false
      //     ),
      //     await x509.AuthorityKeyIdentifierExtension.create(
      //       caKeys.publicKey,
      //       false
      //     )
      //   ]
      // });
      // rootCert.privateKey = caKeys.privateKey;
      // console.log(rootCert.toString());
      // const pkcs8 = await crypto.subtle.exportKey("pkcs8", caKeys.privateKey);
      // const pkcs8Pem = x509.PemConverter.encode(pkcs8, "PRIVATE KEY");
      // console.log(pkcs8Pem);
      // const spki = await crypto.subtle.exportKey("spki", caKeys.publicKey);
      // const spkiPem = x509.PemConverter.encode(spki, "PUBLIC KEY");
      // console.log(spkiPem);

      digicertCaCert = new x509.X509Certificate(
        [
          "MIIDtzCCAp+gAwIBAgIQDOfg5RfYRv6P5WD8G/AwOTANBgkqhkiG9w0BAQUFADBlMQswCQYDVQQGEwJV",
          "UzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3d3cuZGlnaWNlcnQuY29tMSQwIgYDVQQD",
          "ExtEaWdpQ2VydCBBc3N1cmVkIElEIFJvb3QgQ0EwHhcNMDYxMTEwMDAwMDAwWhcNMzExMTEwMDAwMDAw",
          "WjBlMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3d3cuZGlnaWNl",
          "cnQuY29tMSQwIgYDVQQDExtEaWdpQ2VydCBBc3N1cmVkIElEIFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEB",
          "AQUAA4IBDwAwggEKAoIBAQCtDhXO5EOAXLGH87dg+XESpa7cJpSIqvTO9SA5KFhgDPiA2qkVlTJhPLWx",
          "KISKityfCgyDF3qPkKyK53lTXDGEKvYPmDI2dsze3Tyoou9q+yHyUmHfnyDXH+Kx2f4YZNISW1/5WBg1",
          "vEfNoTb5a3/UsDg+wRvDjDPZ2C8Y/igPs6eD1sNuRMBhNZYW/lmci3Zt1/GiSw0r/wty2p5g0I6QNcZ4",
          "VYcgoc/lbQrISXwxmDNsIumH0DJaoroTghHtORedmTpyoeb6pNnVFzF1roV9Iq4/AUaG9ih5yLHa5FcX",
          "xH4cDrC0kqZWs72yl+2qp/C3xag/lRbQ/6GW6whfGHdPAgMBAAGjYzBhMA4GA1UdDwEB/wQEAwIBhjAP",
          "BgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRF66Kv9JLLgjEtUYunpyGd823IDzAfBgNVHSMEGDAWgBRF",
          "66Kv9JLLgjEtUYunpyGd823IDzANBgkqhkiG9w0BAQUFAAOCAQEAog683+Lt8ONyc3pklL/3cmbYMuRC",
          "dWKuh+vy1dneVrOfzM4UKLkNl2BcEkxY5NM9g0lFWJc1aRqoR+pWxnmrEthngYTffwk8lOa4JiwgvT2z",
          "KIn3X/8i4peEH+ll74fg38FnSbNd67IJKusm7Xi+fT8r87cmNW1fiQG2SVufAQWbqz0lwcy2f8Lxb4bG",
          "+mRo64EtlOtCt/qMHt1i8b5QZ7dsvfPxH2sMNgcWfzd8qVttevESRmCD1ycEvkvOl77DZypoEd+A5wwz",
          "Zr8TDRRu838fYxAe+o0bJW1sj6W3YQGx0qMmoRBxna3iw/nDmVG3KwcIzi7mULKn+gpFL6Lw8g=="
        ].join("")
      );

      rootCert = new x509.X509Certificate(
        [
          "MIIBrTCCAVKgAwIBAgIQDNGxhTp+lvzzRF85TTjTyjAKBggqhkjOPQQDAjAkMRAw",
          "DgYDVQQDEwdUZXN0IENBMRAwDgYDVQQKEwdTaWduaW5nMB4XDTI0MTEyNTAxMDgz",
          "MVoXDTM0MTIyMzAxMDgzMVowJDEQMA4GA1UEAxMHVGVzdCBDQTEQMA4GA1UEChMH",
          "U2lnbmluZzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBPA1Nu/qbz9FXX0J7ib",
          "afr/fyUC4pItcjrceS4AocPLL/fxyYaxkzNbiy7HFj1RDnuA31DyoFcs3j8Rk/bd",
          "aDKjZjBkMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYDVR0PAQH/BAQDAgGGMB0GA1Ud",
          "DgQWBBQs9JVbGFuyO7sJw3+GDolRftk0ujAfBgNVHSMEGDAWgBQs9JVbGFuyO7sJ",
          "w3+GDolRftk0ujAKBggqhkjOPQQDAgNJADBGAiEA37yRwv9/Z/IanoM/zkKgAAuv",
          "3psn+rLc1y2PAY7BhfwCIQCtZZ76VDAHlau1etKGyNuwEqxJLey1UxlzXR2274e3",
          "+w=="
        ].join("")
      );
      rootCert.privateKey = await crypto.subtle.importKey(
        "pkcs8",
        Convert.FromBase64(
          [
            "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgXWn0lBforfLExCzT",
            "RB7I1DagoCYiy7UvTbnRMMzNks2hRANCAAQTwNTbv6m8/RV19Ce4m2n6/38lAuKS",
            "LXI63HkuAKHDyy/38cmGsZMzW4suxxY9UQ57gN9Q8qBXLN4/EZP23Wgy"
          ].join("")
        ),
        keyAlg,
        false,
        ["sign"]
      );

      const intermediateKeys = await crypto.subtle.generateKey(keyAlg, false, [
        "sign",
        "verify"
      ]);
      intermediateCert = await x509.X509CertificateGenerator.create({
        subject: "CN=Test Intermediate, O=Signing",
        issuer: rootCert.subject,
        notBefore: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days
        notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 76), // 76 days
        publicKey: intermediateKeys.publicKey,
        signingKey: rootCert.privateKey,
        signingAlgorithm: signingAlg,
        extensions: [
          new x509.BasicConstraintsExtension(true, 0, true),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.digitalSignature |
              x509.KeyUsageFlags.keyCertSign |
              x509.KeyUsageFlags.cRLSign,
            true
          ),
          await x509.AuthorityKeyIdentifierExtension.create(
            rootCert.publicKey,
            false
          ),
          await x509.SubjectKeyIdentifierExtension.create(
            intermediateKeys.publicKey,
            false
          )
        ]
      });
      intermediateCert.privateKey = intermediateKeys.privateKey;

      const interCrl = await x509.X509CrlGenerator.create({
        issuer: rootCert.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: rootCert.privateKey,
        signingAlgorithm: signingAlg
      });
      intermediateCrl = CRL.fromBER(interCrl.rawData);

      intermediateOcsp = await OCSP.create({
        issuer: rootCert,
        producedAt: new Date(),
        responses: [
          {
            certId: await CertificateID.create(
              "SHA-1",
              intermediateCert,
              rootCert
            ),
            status: {
              type: "good"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
          }
        ],
        signingKey: rootCert.privateKey,
        signingAlgorithm: signingAlg
      });

      const leafKeys = await crypto.subtle.generateKey(keyAlg, false, [
        "sign",
        "verify"
      ]);
      leafCert = await x509.X509CertificateGenerator.create({
        subject: "CN=Test Leaf, O=Signing",
        issuer: intermediateCert.subject,
        notBefore: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days
        notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 23), // 23 days
        publicKey: leafKeys.publicKey,
        signingKey: intermediateCert.privateKey,
        signingAlgorithm: signingAlg,
        extensions: [
          // new x509.BasicConstraintsExtension(false, undefined, true),
          new x509.KeyUsagesExtension(
            x509.KeyUsageFlags.digitalSignature |
              x509.KeyUsageFlags.nonRepudiation,
            true
          ),
          await x509.AuthorityKeyIdentifierExtension.create(
            intermediateKeys.publicKey,
            false
          ),
          await x509.SubjectKeyIdentifierExtension.create(
            leafKeys.publicKey,
            false
          ),
          new x509.ExtendedKeyUsageExtension([
            x509.ExtendedKeyUsage.clientAuth,
            "1.3.6.1.4.1.311.10.3.12", // documentSigning
            "1.2.840.113583.1.1.5" // pdfAuthenticDocumentsTrust
          ]),
          new x509.CRLDistributionPointsExtension(["http://leaf.cer/crl"]),
          new x509.AuthorityInfoAccessExtension({
            ocsp: ["http://leaf.cer/ocsp"]
          })
        ]
      });
      leafCert.privateKey = leafKeys.privateKey;

      const crl = await x509.X509CrlGenerator.create({
        issuer: intermediateCert.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: intermediateCert.privateKey,
        signingAlgorithm: signingAlg
      });
      leafCrl = CRL.fromBER(crl.rawData);

      leafOcsp = await OCSP.create({
        issuer: intermediateCert,
        producedAt: new Date(),
        responses: [
          {
            certId: await CertificateID.create(
              "SHA-1",
              leafCert,
              intermediateCert
            ),
            status: {
              type: "good"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
          }
        ],
        signingKey: intermediateCert.privateKey,
        signingAlgorithm: signingAlg
      });
    });

    async function createSignedDocument(
      options: {
        /** Revocation method. Default is "crl" */
        revocation?: "crl" | "ocsp" | "none" | "one-missing";
        revocationStore?: "dss" | "cms" | "adobe-attr";
        signingTime?: "local" | "embedded" | "dss" | "empty";
        invalidateTimestamp?: boolean;
      } = {}
    ) {
      options.revocation ??= "crl";
      options.revocationStore ??= "dss";

      const doc = await PDFDocument.create();
      const page = doc.pages.create();
      const box = page.addSignatureBox({ groupName: "box1" });
      await doc.save();

      let timeStampToken: TimeStampToken | null = null;
      const signature = await box.sign({
        containerSize: 8192,
        dictionaryUpdate: async (dict) => {
          dict.subFilter = "ETSI.CAdES.detached";
          dict.Reason.get().text = "Test Reason";
          dict.Location.get().text = "Test Location";
          if (options.signingTime === "local") {
            dict.signingTime = core.PDFDate.createDate(doc.target, new Date());
          }
        },
        containerCreate: async (data) => {
          const signedData = new CMSSignedData();
          const hash = await crypto.subtle.digest("SHA-256", data);
          const signedAttributes: CmsAttribute[] = [
            new ContentTypeAttribute(CMSContentType.data),
            new MessageDigestAttribute(hash),
            await SigningCertificateV2Attribute.create("SHA-256", leafCert)
          ];

          if (options.revocationStore === "adobe-attr") {
            const revocations: RevocationData[] = [];
            switch (options.revocation) {
              case "crl":
                revocations.push(leafCrl, intermediateCrl);
                break;
              case "ocsp":
                revocations.push(leafOcsp);
                revocations.push({
                  type: "ocsp", // other revocation method
                  value: intermediateOcsp
                });
                break;
              case "one-missing":
                revocations.push(leafCrl);
                break;
              default:
            }

            signedAttributes.push(new AdobeRevocationInfoArchival(revocations));
          }

          const signer = signedData.createSigner(leafCert, {
            digestAlgorithm: "SHA-256",
            signedAttributes
          });

          signedData.certificates.push(leafCert);
          if (options.revocationStore === "cms") {
            switch (options.revocation) {
              case "crl":
                signedData.revocations.push(intermediateCrl);
                signedData.revocations.push(leafCrl);
                break;
              case "ocsp":
                signedData.revocations.push(intermediateOcsp);
                signedData.revocations.push(leafOcsp);
                break;
              case "one-missing":
                signedData.revocations.push(leafCrl);
                break;
              default:
            }
          }

          await signedData.sign(leafCert.privateKey!, signer);

          if (
            options.signingTime === "embedded" ||
            options.signingTime === "dss"
          ) {
            timeStampToken = await getTimeStampToken(
              options.invalidateTimestamp
                ? new Uint8Array([0]) // invalid signature value
                : signedData.signers[0].signatureValue
            );
            if (options.signingTime === "embedded") {
              signedData.signers[0].unsignedAttributes.push(
                new TimeStampTokenAttribute(timeStampToken)
              );
            }
          }

          return signedData.toBER();
        }
      });

      const signatureThumbprint = await signature.thumbprint();
      doc.dss.add(rootCert, signatureThumbprint);
      doc.dss.add(intermediateCert, signatureThumbprint);
      if (options.revocationStore === "dss") {
        switch (options.revocation) {
          case "one-missing":
            doc.dss.add(leafCrl, signatureThumbprint);
            break;
          case "crl":
            doc.dss.add(intermediateCrl, signatureThumbprint);
            doc.dss.add(leafCrl, signatureThumbprint);
            break;
          case "ocsp":
            doc.dss.add(intermediateOcsp, signatureThumbprint);
            doc.dss.add(leafOcsp, signatureThumbprint);
            break;
          default:
        }
      }

      if (options.signingTime === "dss" && timeStampToken) {
        doc.dss.addTimeStamp(timeStampToken, signatureThumbprint);
      }

      return doc;
    }

    async function verifyDocument(doc: PDFDocument, date?: Date) {
      const doc2 = await PDFDocument.load(await doc.save());
      doc2.certificateHandler.parent = new RootCertificateStorageHandler({
        trustedCertificates: [rootCert, digicertCaCert],
        revocations: {
          "http://leaf.cer/crl": leafCrl,
          "http://leaf.cer/ocsp": leafOcsp
        }
      });
      return doc2.verify({
        checkDate: date
      });
    }

    describe("signing time", () => {
      it("should verify signature with certificates, revocations and timestamp in DSS", async () => {
        const doc = await createSignedDocument({
          signingTime: "dss"
        });
        const verify = await verifyDocument(doc);

        const state = getSignatureState(
          verify.items[0],
          "signing_time"
        ) as SigningTimeState;
        expect(state.type).toBe("valid");
        expect(state.text).toBe(
          "The signature includes a timestamp embedded in the document"
        );
        expect(state.data.type).toBe("dss");
      });

      it("should verify signature with certificates, revocations and timestamp in CMS", async () => {
        const doc = await createSignedDocument({
          signingTime: "embedded",
          revocation: "ocsp"
        });
        const verify = await verifyDocument(doc);

        const state = getSignatureState(
          verify.items[0],
          "signing_time"
        ) as SigningTimeState;
        expect(state.type).toBe("valid");
        expect(state.text).toBe("The signature includes an embedded timestamp");
        expect(state.data.type).toBe("embedded");
      });

      it("should verify signature with signingTime in dictionary", async () => {
        const doc = await createSignedDocument({
          signingTime: "local"
        });
        const verify = await verifyDocument(doc);

        const state = getSignatureState(
          verify.items[0],
          "signing_time"
        ) as SigningTimeState;
        expect(state.type).toBe("info");
        expect(state.text).toBe(
          "Signing time is from the clock on the signer's computer"
        );
        expect(state.data.type).toBe("local");
      });

      it("should verify signature without timestamp and signingTime", async () => {
        const doc = await createSignedDocument();
        const verify = await verifyDocument(doc);

        const state = getSignatureState(
          verify.items[0],
          "signing_time"
        ) as SigningTimeState;
        expect(state.type).toBe("info");
        expect(state.text).toBe("Signing time is not available");
        expect(state.data.type).toBe("empty");
      });

      it("should not use checkDate for timestamp verification", async () => {
        const checkDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 1); // 1 year

        const doc = await createSignedDocument({ signingTime: "dss" });
        const verify = await verifyDocument(doc, checkDate);

        const state = getSignatureState(
          verify.items[0],
          "signing_time"
        ) as EmbeddedSigningTimeState;
        // app should ignore checkDate for timestamp verification
        expect(state.type).toBe("valid");
        expect(verify.items[0].checkDate).toBe(checkDate);
        expect(verify.items[0].signingTime).not.toBe(state.data.date);
      });

      it("should detect invalid timestamp signature", async () => {
        const doc = await createSignedDocument({
          signingTime: "dss",
          invalidateTimestamp: true
        });
        const verify = await verifyDocument(doc);

        const state = getSignatureState(
          verify.items[0],
          "signing_time"
        ) as SigningTimeState;
        expect(state.type).toBe("invalid");
        expect(state.text).toBe(
          "The signature includes a timestamp embedded in the document but it is invalid"
        );
      });
    });

    describe("formatting", () => {
      it("should return valid formatting state", async () => {
        const doc = await createSignedDocument();
        const verify = await doc.verify();
        const formattingState = getSignatureState(
          verify.items[0],
          "formatting"
        ) as FormattingState;
        expect(formattingState.type).toBe("valid");
        expect(formattingState.text).toBe("There are not errors in formatting");
      });

      it("should return invalid formatting state for invalid signature value content", async () => {
        const doc = await createSignedDocument();

        // modify the SignatureValue Content to make it invalid
        const signatures = doc.getSignatures();
        const signature = signatures[0] as SignatureBoxGroup;
        const contents = signature.target.V?.Contents;
        expect(contents).toBeDefined();
        contents!.text = contents!.text.replace(/^./, "\x00");

        // verify the signature
        const verify = await signature.verify();
        const formattingState = getSignatureState(
          verify,
          "formatting"
        ) as FormattingState;
        expect(formattingState.type).toBe("invalid");
        expect(formattingState.text).toBe(
          "There are errors in the formatting or information contained in the signature"
        );
      });

      it("should return warn formatting state for wrong document structure", async () => {
        const doc = await createSignedDocument();
        doc.target.wrongStructure = true;

        const verify = await doc.verify();

        const formattingState = getSignatureState(
          verify.items[0],
          "formatting"
        ) as FormattingState;
        expect(formattingState.type).toBe("warn");
        expect(formattingState.text).toBe(
          "Document structure doesn't match PDF specification"
        );
      });
    });

    describe("ltv", () => {
      it("should return valid ltv state", async () => {
        const doc = await createSignedDocument();
        const verify = await doc.verify();
        const ltvState = getSignatureState(verify.items[0], "ltv") as LtvState;
        expect(ltvState.type).toBe("info");
        expect(ltvState.text).toBe("Signature is LTV enabled");
        expect(ltvState.data).toEqual({
          state: true
        });
      });

      it("should return invalid ltv state", async () => {
        const doc = await createSignedDocument({
          revocation: "none"
        });
        const verify = await doc.verify();
        const ltvState = getSignatureState(verify.items[0], "ltv") as LtvState;
        expect(ltvState.type).toBe("info");
        expect(ltvState.text).toBe("Signature is not LTV enabled");
        expect(ltvState.data).toEqual({
          state: false,
          reason: "PDF document doesn't have revocation items"
        });
      });

      it("should detect if one revocation item is missing", async () => {
        const doc = await createSignedDocument({
          revocation: "one-missing"
        });
        const verify = await verifyDocument(doc);
        const ltvState = getSignatureState(verify.items[0], "ltv") as LtvState;
        expect(ltvState.type).toBe("info");
        expect(ltvState.text).toBe("Signature is not LTV enabled");
        expect(ltvState.data).toEqual({
          state: false,
          reason:
            "No revocation values found for one of certificates: No CRLs for specific certificate issuer"
        });
      });
    });

    describe("document modification", () => {
      it("should return valid document modification state", async () => {
        const doc = await createSignedDocument();
        const verify = await doc.verify();
        const state = getSignatureState(
          verify.items[0],
          "document_modification"
        ) as DocumentModificationState;
        expect(state.type).toBe("valid");
        expect(state.data.state).toBe("not_modified");
      });

      it("should return invalid with error when document is modified", async () => {
        const doc = await createSignedDocument();
        doc.target.view[12] = 0xf0; // modify the document

        const verify = await doc.verify();
        const state = getSignatureState(
          verify.items[0],
          "document_modification"
        ) as DocumentModificationState;
        expect(state.type).toBe("invalid");
        expect(state.data.state).toBe("error");
      });

      it("should return invalid if signature is invalid", async () => {
        const doc = await createSignedDocument();
        const signature = doc.getSignatures()[0] as SignatureBoxGroup;
        const contents = signature.target.V!.Contents;
        const signedData = CMSSignedData.fromBER(
          Convert.FromBinary(contents.text)
        );
        signedData.signers[0].asn.signature.valueBlock.valueHexView[0] = 0x00; // modify the signature
        contents.text = Convert.ToBinary(signedData.toBER());

        const verify = await signature.verify();
        const state = getSignatureState(
          verify,
          "document_modification"
        ) as DocumentModificationState;
        expect(state.type).toBe("invalid");
        expect(state.data.state).toBe("modified");
      });
    });

    it("should return valid signature state with embedded revocations", async () => {
      // TODO: Acrobat does't use revocations from CAdES revocation info, it's not clear why
      const doc = await createSignedDocument({
        revocationStore: "cms"
      });
      const verify = await verifyDocument(doc);
      const ltvState = getSignatureState(verify.items[0], "ltv") as LtvState;
      expect(ltvState.type).toBe("info");
      expect(ltvState.data.state).toBe(true);
      const identityState = getSignatureState(
        verify.items[0],
        "identity_verification"
      ) as SignatureStates;
      expect(identityState.type).toBe("valid");
    });

    it("should return valid signature state with Adobe Archive Attribute", async () => {
      const doc = await createSignedDocument({
        revocationStore: "adobe-attr"
      });
      const verify = await verifyDocument(doc);
      const ltvState = getSignatureState(verify.items[0], "ltv") as LtvState;
      expect(ltvState.type).toBe("info");
      expect(ltvState.data.state).toBe(true);
      const identityState = getSignatureState(
        verify.items[0],
        "identity_verification"
      ) as SignatureStates;
      expect(identityState.type).toBe("valid");
    });
  });
});
