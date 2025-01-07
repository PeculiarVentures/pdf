import { Crypto } from "@peculiar/webcrypto";
import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import "./algorithms";
import {
  ContentTypeAttribute,
  MessageDigestAttribute,
  SigningTimeAttribute
} from "./attributes";
import { CMSSignedData } from "./SignedData";
import { cms, data } from "./SignedData.vector.spec";
import { CMSContentType } from "./SignerInfo";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";
import { CertificateID } from "./CertID";
import { AdobeRevocationInfoArchival } from "./AdobeRevocationInfoArchival";

describe("SignedData", () => {
  let crypto: Crypto;
  beforeAll(() => {
    crypto = new Crypto();
    pkijs.setEngine("CryptoEngine", new pkijs.CryptoEngine({ crypto: crypto }));
    x509.cryptoProvider.set(crypto);
  });

  it("vector", async () => {
    const signedData = CMSSignedData.fromBER(cms);
    expect(signedData.signers.length).toBe(1);

    const result = await signedData.verify(data);
    expect(result.signatureVerified).toBe(true);
  });

  describe("fromBER", () => {
    let algorithm: EcKeyGenParams;
    let signingAlgorithm: EcdsaParams;
    let caCert: x509.X509Certificate;
    let leafCert: x509.X509Certificate;
    let ocsp: OCSP;
    let crl: CRL;

    beforeAll(async () => {
      algorithm = {
        name: "ECDSA",
        namedCurve: "P-256"
      };
      signingAlgorithm = {
        name: "ECDSA",
        hash: "SHA-256"
      };

      // create CA
      const caKeys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      caCert = await x509.X509CertificateGenerator.createSelfSigned(
        {
          name: "CN=CA Test",
          keys: caKeys,
          signingAlgorithm,
          notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
        },
        crypto
      );
      caCert.privateKey = caKeys.privateKey;

      // create leaf
      const leafKeys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      leafCert = await x509.X509CertificateGenerator.create({
        issuer: caCert.issuer,
        subject: "CN=Leaf Test",
        publicKey: leafKeys.publicKey,
        signingKey: caKeys.privateKey,
        signingAlgorithm
      });
      leafCert.privateKey = leafKeys.privateKey;

      // create OCSP response
      ocsp = await OCSP.create({
        issuer: caCert,
        signingAlgorithm,
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

      // create CRL
      const x50Crl = await x509.X509CrlGenerator.create({
        issuer: caCert.issuer,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: caKeys.privateKey,
        signingAlgorithm
      });
      crl = CRL.fromBER(x50Crl.rawData);
    });

    describe("CMS with CRLs", () => {
      let cms: ArrayBuffer;
      beforeAll(async () => {
        // create CMS
        const signedData = new CMSSignedData();
        signedData.certificates.push(leafCert);
        signedData.revocations.push(crl);
        signedData.revocations.push(ocsp);
        const data = Convert.FromUtf8String("Hello");
        const digestAlgorithm = "SHA-256";
        const digest = await crypto.subtle.digest(digestAlgorithm, data);
        const signer = signedData.createSigner(leafCert, {
          digestAlgorithm,
          signatureAlgorithm: signingAlgorithm,
          signedAttributes: [
            new ContentTypeAttribute(CMSContentType.data),
            new SigningTimeAttribute(),
            new MessageDigestAttribute(digest)
          ]
        });
        await signedData.sign(leafCert.privateKey!, signer);
        cms = signedData.toBER();
      });

      it("should parse CMS with CRL and OCSP", async () => {
        const signedData = CMSSignedData.fromBER(cms);
        expect(signedData.revocations.length).toBe(2);
        expect(signedData.revocations[0]).toBeInstanceOf(CRL);
        expect(signedData.revocations[1]).toBeInstanceOf(OCSP);
        expect(signedData.certificateHandler.certificates.length).toBe(1);
        expect(signedData.certificateHandler.crls.length).toBe(1);
        expect(signedData.certificateHandler.ocsps.length).toBe(1);
      });
    });

    describe("CMS with OCSP from Adobe attributes", () => {
      let cms: ArrayBuffer;

      beforeAll(async () => {
        // create digest
        const data = Convert.FromUtf8String("Hello");
        const digestAlgorithm = "SHA-256";
        const digest = await crypto.subtle.digest(digestAlgorithm, data);

        // create CMS
        const signedData = new CMSSignedData();
        signedData.certificates.push(leafCert);
        const signer = signedData.createSigner(leafCert, {
          digestAlgorithm,
          signatureAlgorithm: signingAlgorithm,
          signedAttributes: [
            new ContentTypeAttribute(CMSContentType.data),
            new SigningTimeAttribute(),
            new MessageDigestAttribute(digest),
            new AdobeRevocationInfoArchival([
              crl,
              ocsp,
              {
                type: "ocsp",
                value: ocsp
              }
            ])
          ]
        });
        await signedData.sign(leafCert.privateKey!, signer);
        cms = signedData.toBER();
      });

      it("should parse CMS with OCSP from Adobe attributes", async () => {
        const signedData = CMSSignedData.fromBER(cms);
        expect(signedData.certificateHandler.certificates.length).toBe(1);
        expect(signedData.certificateHandler.crls.length).toBe(1);
        expect(signedData.certificateHandler.ocsps.length).toBe(2);
      });
    });
  });

  describe("sign/verify", () => {
    let algorithm: EcKeyGenParams;
    let signingAlgorithm: EcdsaParams;
    let cert: x509.X509Certificate;
    let data: ArrayBuffer;
    let dataHash: ArrayBuffer;

    beforeAll(async () => {
      algorithm = {
        name: "ECDSA",
        namedCurve: "P-256"
      };
      signingAlgorithm = {
        name: "ECDSA",
        hash: "SHA-256"
      };
      data = Convert.FromUtf8String("Hello");
      dataHash = await crypto.subtle.digest("SHA-256", data);

      const keys = await crypto.subtle.generateKey(algorithm, false, [
        "sign",
        "verify"
      ]);
      cert = await x509.X509CertificateGenerator.createSelfSigned(
        {
          name: "CN=Test",
          keys,
          signingAlgorithm,
          notAfter: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) // 1 year
        },
        crypto
      );
      cert.privateKey = keys.privateKey;
    });

    it("should be verified with signing certificate in cms", async () => {
      const signedData = new CMSSignedData();
      signedData.certificates.push(cert);
      const signer = signedData.createSigner(cert, {
        digestAlgorithm: "SHA-256",
        signatureAlgorithm: signingAlgorithm,
        signedAttributes: [
          new ContentTypeAttribute(CMSContentType.data),
          new SigningTimeAttribute(),
          new MessageDigestAttribute(dataHash)
        ]
      });
      await signedData.sign(cert.privateKey!, signer);

      const result = await signedData.verify(data);
      expect(result.signatureVerified).toBe(true);
      expect(result.signers.length).toBe(1);

      // verify without specified signer
      const result2 = await signedData.verify(data);
      expect(result2.signatureVerified).toBe(true);
      expect(result2.signers.length).toBe(1);
    });

    it("should be verified with signing certificate in certificate storage", async () => {
      const signedData = new CMSSignedData();
      signedData.certificateHandler.certificates.push(cert);
      const signer = signedData.createSigner(cert, {
        digestAlgorithm: "SHA-256",
        signatureAlgorithm: signingAlgorithm,
        signedAttributes: [
          new ContentTypeAttribute(CMSContentType.data),
          new SigningTimeAttribute(),
          new MessageDigestAttribute(dataHash)
        ]
      });
      await signedData.sign(cert.privateKey!, signer);

      const result = await signedData.verify(data);
      expect(result.signatureVerified).toBe(true);
      expect(result.signers.length).toBe(1);
    });

    it("should throw error if signing certificate is not found", async () => {
      const signedData = new CMSSignedData();
      const signer = signedData.createSigner(cert, {
        digestAlgorithm: "SHA-256",
        signatureAlgorithm: signingAlgorithm,
        signedAttributes: [
          new ContentTypeAttribute(CMSContentType.data),
          new SigningTimeAttribute(),
          new MessageDigestAttribute(dataHash)
        ]
      });
      await signedData.sign(cert.privateKey!, signer);

      const result = await signedData.verify(data);
      expect(result.signatureVerified).toBe(false);
      expect(result.signers[0].code).toBe(3);
      expect(result.signers[0].message).toBe(
        "Unable to find signer certificate"
      );
    });
  });
});
