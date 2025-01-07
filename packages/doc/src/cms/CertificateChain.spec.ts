import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import "./algorithms";
import {
  CertificateChain,
  CertificateChainStatusCode
} from "./CertificateChain";
import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";
import {
  IResult,
  IsTrustedResult,
  RevocationType
} from "./ICertificateStorageHandler";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";
import { CertificateID } from "./CertID";

/**
 * Test implementation of ICertificateStorageHandler that mocks a root certificate storage.
 */
class RootCertificateStorageHandler extends DefaultCertificateStorageHandler {
  constructor(
    private trustedCertificate: x509.X509Certificate,
    private revocations: Record<string, CRL | OCSP> = {}
  ) {
    super();
  }
  public override async isTrusted(
    cert: x509.X509Certificate
  ): Promise<IsTrustedResult> {
    if (this.trustedCertificate.equal(cert)) {
      return {
        result: true,
        target: this,
        source: "RootCertificateStorageHandler"
      };
    }

    return {
      result: false,
      target: this,
      source: "RootCertificateStorageHandler"
    };
  }

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
    if (type === "crl") {
      const crlDistriPoints = cert.getExtension(
        x509.CRLDistributionPointsExtension
      );
      if (crlDistriPoints) {
        for (const point of crlDistriPoints.distributionPoints) {
          const url =
            point.distributionPoint?.fullName?.[0].uniformResourceIdentifier;
          if (url && this.revocations[url]) {
            return {
              result: this.revocations[url] as CRL,
              target: this
            };
          }
        }
      }
    } else if (type === "ocsp") {
      const aia = cert.getExtension(x509.AuthorityInfoAccessExtension);
      if (aia) {
        for (const ocsp of aia.ocsp) {
          const url = ocsp.type === "url" ? ocsp.value : null;
          if (url && this.revocations[url]) {
            return {
              result: this.revocations[url] as OCSP,
              target: this
            };
          }
        }
      }
    }
    return {
      result: null,
      target: this
    };
  }
}

describe("CertificateChain", () => {
  let algorithm: EcKeyGenParams;
  let signingAlgorithm: EcdsaParams;
  let rootCert: x509.X509Certificate;
  let intermediateCert1: x509.X509Certificate;
  let intermediateCert2: x509.X509Certificate;
  let leafCert: x509.X509Certificate;
  const now = new Date();

  beforeAll(async () => {
    // Set engine
    pkijs.setEngine(
      "newEngine",
      new pkijs.CryptoEngine({ name: "nodejs", crypto })
    );
    x509.cryptoProvider.set(crypto);

    algorithm = {
      name: "ECDSA",
      namedCurve: "P-256"
    };
    signingAlgorithm = {
      name: "ECDSA",
      hash: "SHA-256"
    };

    // Create root certificate
    const rootKeys = await crypto.subtle.generateKey(algorithm, false, [
      "sign",
      "verify"
    ]);
    rootCert = await x509.X509CertificateGenerator.createSelfSigned({
      name: "CN=Root Test",
      keys: rootKeys,
      signingAlgorithm,
      notBefore: now,
      notAfter: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365), // 1 year
      extensions: [
        new x509.BasicConstraintsExtension(true, undefined, true),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
          true
        ),
        await x509.SubjectKeyIdentifierExtension.create(rootKeys.publicKey),
        await x509.AuthorityKeyIdentifierExtension.create(rootKeys.publicKey)
      ]
    });
    rootCert.privateKey = rootKeys.privateKey;

    // Create intermediate certificate 1
    const intermediateKeys1 = await crypto.subtle.generateKey(
      algorithm,
      false,
      ["sign", "verify"]
    );
    intermediateCert1 = await x509.X509CertificateGenerator.create({
      notBefore: now,
      notAfter: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30 * 10), // 10 months
      subject: "CN=Intermediate 1 Test",
      issuer: rootCert.subject,
      publicKey: intermediateKeys1.publicKey,
      signingKey: rootCert.privateKey,
      signingAlgorithm,
      extensions: [
        new x509.BasicConstraintsExtension(true, undefined, true),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
          true
        ),
        await x509.SubjectKeyIdentifierExtension.create(
          intermediateKeys1.publicKey
        ),
        await x509.AuthorityKeyIdentifierExtension.create(rootKeys.publicKey),
        new x509.CRLDistributionPointsExtension(["http://intermediate1.crl"])
      ]
    });
    intermediateCert1.privateKey = intermediateKeys1.privateKey;

    // Create intermediate certificate 2
    const intermediateKeys2 = await crypto.subtle.generateKey(
      algorithm,
      false,
      ["sign", "verify"]
    );
    intermediateCert2 = await x509.X509CertificateGenerator.create({
      notBefore: now,
      notAfter: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30 * 5), // 5 months
      subject: "CN=Intermediate 2 Test",
      issuer: intermediateCert1.subject,
      publicKey: intermediateKeys2.publicKey,
      signingKey: intermediateCert1.privateKey,
      signingAlgorithm,
      extensions: [
        new x509.BasicConstraintsExtension(true, undefined, true),
        new x509.KeyUsagesExtension(
          x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign,
          true
        ),
        await x509.SubjectKeyIdentifierExtension.create(
          intermediateKeys2.publicKey
        ),
        await x509.AuthorityKeyIdentifierExtension.create(
          intermediateKeys1.publicKey
        ),
        new x509.AuthorityInfoAccessExtension({
          ocsp: ["http://intermediate2.ocsp"]
        })
      ]
    });
    intermediateCert2.privateKey = intermediateKeys2.privateKey;

    // Create leaf certificate
    const leafKeys = await crypto.subtle.generateKey(algorithm, false, [
      "sign",
      "verify"
    ]);
    leafCert = await x509.X509CertificateGenerator.create({
      notBefore: now,
      notAfter: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30), // 1 month
      subject: "CN=Leaf Test",
      issuer: intermediateCert2.subject,
      publicKey: leafKeys.publicKey,
      signingKey: intermediateCert2.privateKey,
      signingAlgorithm,
      extensions: [
        new x509.BasicConstraintsExtension(false, undefined, true),
        new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature, true),
        await x509.SubjectKeyIdentifierExtension.create(leafKeys.publicKey),
        await x509.AuthorityKeyIdentifierExtension.create(
          intermediateKeys2.publicKey
        ),
        new x509.CRLDistributionPointsExtension(["http://leaf.crl"]),
        new x509.AuthorityInfoAccessExtension({
          ocsp: ["http://leaf.ocsp"]
        })
      ]
    });
  });

  it("should build certificate chain", async () => {
    const chain = new CertificateChain();
    chain.certificateHandler.certificates.push(rootCert);
    chain.certificateHandler.certificates.push(intermediateCert1);
    chain.certificateHandler.certificates.push(intermediateCert2);
    chain.certificateHandler.parent = new RootCertificateStorageHandler(
      rootCert
    );

    const result = await chain.build(leafCert);
    expect(result.result).toBe(true);
    expect(result.resultCode).toBe(CertificateChainStatusCode.success);
    expect(result.chain.length).toBe(4);
  });

  describe("trusted", () => {
    it("should build certificate chain with trusted intermediate certificate", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        intermediateCert1
      );

      const result = await chain.build(leafCert);
      expect(result.result).toBe(true);
      expect(result.resultCode).toBe(CertificateChainStatusCode.success);
      expect(result.chain.length).toBe(3);
    });

    it("should return error if no trusted certificate", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);

      const result = await chain.build(leafCert);
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.badPath);
    });
  });

  describe("badDate", () => {
    it("should return error if certificate is not yet valid", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert
      );

      const result = await chain.build(leafCert, {
        checkDate: new Date(now.getTime() - 1000)
      });
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.badDate);
    });

    it("should return error if certificate is expired", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert
      );

      const result = await chain.build(leafCert, {
        checkDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 31)
      });
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.badDate);
    });
  });

  describe("revocations", () => {
    let crlLeaf: CRL;
    let ocspLeaf: OCSP;
    let ocspIntermediate2: OCSP;
    let crlIntermediate1: CRL;

    beforeAll(async () => {
      // Create Leaf CRL
      const x509Crl = await x509.X509CrlGenerator.create({
        issuer: intermediateCert2.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: intermediateCert2.privateKey!,
        signingAlgorithm
      });
      crlLeaf = CRL.fromBER(x509Crl.rawData);

      // Create Leaf OCSP
      ocspLeaf = await OCSP.create({
        issuer: intermediateCert2,
        responses: [
          {
            certId: await CertificateID.create(
              "SHA-256",
              leafCert,
              intermediateCert2
            ),
            status: {
              type: "good"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
          }
        ],
        producedAt: new Date(),
        signingAlgorithm,
        signingKey: intermediateCert2.privateKey!
      });

      // Create Intermediate 2 OCSP
      ocspIntermediate2 = await OCSP.create({
        issuer: intermediateCert1,
        responses: [
          {
            certId: await CertificateID.create(
              "SHA-256",
              intermediateCert2,
              intermediateCert1
            ),
            status: {
              type: "good"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
          }
        ],
        producedAt: new Date(),
        signingAlgorithm,
        signingKey: intermediateCert1.privateKey!
      });

      // Create Intermediate 1 CRL
      const x509CrlIntermediate1 = await x509.X509CrlGenerator.create({
        issuer: rootCert.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: rootCert.privateKey!,
        signingAlgorithm
      });
      crlIntermediate1 = CRL.fromBER(x509CrlIntermediate1.rawData);
    });

    it("should build certificate chain with revocation check", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert,
        {
          "http://leaf.crl": crlLeaf,
          "http://leaf.ocsp": ocspLeaf,
          "http://intermediate2.ocsp": ocspIntermediate2,
          "http://intermediate1.crl": crlIntermediate1
        }
      );

      const result = await chain.build(leafCert, {
        revocationMode: "online"
      });
      expect(result.result).toBe(true);
      expect(result.resultCode).toBe(CertificateChainStatusCode.success);
      expect(result.chain.length).toBe(4);
      expect(result.revocationMode).toBe("online");
      expect(result.revocations?.length).toBe(3);
    });

    it("should build certificate chain with revocation check offline", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.crls.push(crlLeaf);
      chain.certificateHandler.crls.push(crlIntermediate1);
      chain.certificateHandler.ocsps.push(ocspLeaf);
      chain.certificateHandler.ocsps.push(ocspIntermediate2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert
      );

      const result = await chain.build(leafCert, {
        revocationMode: "offline"
      });
      expect(result.result).toBe(true);
      expect(result.resultCode).toBe(CertificateChainStatusCode.success);
      expect(result.chain.length).toBe(4);
      expect(result.revocationMode).toBe("offline");
      expect(result.revocations?.length).toBe(3);
    });

    // preferCRL
    it("should prefer CRL over OCSP", async () => {
      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert,
        {
          "http://leaf.crl": crlLeaf,
          "http://leaf.ocsp": ocspLeaf,
          "http://intermediate2.ocsp": ocspIntermediate2,
          "http://intermediate1.crl": crlIntermediate1
        }
      );

      const result = await chain.build(leafCert, {
        revocationMode: "online",
        preferCRL: true
      });
      expect(result.result).toBe(true);
      expect(result.resultCode).toBe(CertificateChainStatusCode.success);
      expect(result.chain.length).toBe(4);
      expect(result.revocationMode).toBe("online");
      expect(result.revocations?.length).toBe(3);
      expect(result.revocations?.[0]).toBeInstanceOf(CRL);
      expect(result.revocations?.[1]).toBeInstanceOf(OCSP);
      expect(result.revocations?.[2]).toBeInstanceOf(CRL);

      const result2 = await chain.build(leafCert, {
        revocationMode: "online",
        preferCRL: false
      });
      expect(result2.result).toBe(true);
      expect(result2.resultCode).toBe(CertificateChainStatusCode.success);
      expect(result2.chain.length).toBe(4);
      expect(result2.revocationMode).toBe("online");
      expect(result2.revocations?.length).toBe(3);
      expect(result2.revocations?.[0]).toBeInstanceOf(OCSP);
      expect(result2.revocations?.[1]).toBeInstanceOf(OCSP);
      expect(result2.revocations?.[2]).toBeInstanceOf(CRL);
    });

    it("should return error if leaf certificate is revoked by CRL", async () => {
      const x509RevokedCrl = await x509.X509CrlGenerator.create({
        issuer: intermediateCert2.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: intermediateCert2.privateKey!,
        signingAlgorithm,
        entries: [
          {
            serialNumber: leafCert.serialNumber,
            revocationDate: new Date(),
            reason: x509.X509CrlReason.privilegeWithdrawn
          }
        ]
      });
      const crlRevoked = CRL.fromBER(x509RevokedCrl.rawData);

      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert,
        {
          "http://leaf.crl": crlRevoked,
          "http://intermediate2.ocsp": ocspIntermediate2,
          "http://intermediate1.crl": crlIntermediate1
        }
      );

      const result = await chain.build(leafCert, {
        revocationMode: "online"
      });
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.revokedOCSP);
    });

    it("should return error if leaf certificate is revoked by OCSP", async () => {
      const ocspRevoked = await OCSP.create({
        issuer: intermediateCert2,
        responses: [
          {
            certId: await CertificateID.create(
              "SHA-256",
              leafCert,
              intermediateCert2
            ),
            status: {
              type: "revoked",
              revocationTime: new Date(),
              reason: "privilegeWithdrawn"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
          }
        ],
        producedAt: new Date(),
        signingAlgorithm,
        signingKey: intermediateCert2.privateKey!
      });

      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert,
        {
          "http://leaf.ocsp": ocspRevoked,
          "http://intermediate2.ocsp": ocspIntermediate2,
          "http://intermediate1.crl": crlIntermediate1
        }
      );

      const result = await chain.build(leafCert, {
        revocationMode: "online"
      });
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.revokedOCSP);
    });

    it("should return error if intermediate certificate is revoked by CRL", async () => {
      const x509RevokedCrl = await x509.X509CrlGenerator.create({
        issuer: rootCert.subject,
        thisUpdate: new Date(),
        nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
        signingKey: rootCert.privateKey!,
        signingAlgorithm,
        entries: [
          {
            serialNumber: intermediateCert1.serialNumber,
            revocationDate: new Date(),
            reason: x509.X509CrlReason.privilegeWithdrawn
          }
        ]
      });
      const crlRevoked = CRL.fromBER(x509RevokedCrl.rawData);

      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert,
        {
          "http://leaf.crl": crlLeaf,
          "http://leaf.ocsp": ocspLeaf,
          "http://intermediate2.ocsp": ocspIntermediate2,
          "http://intermediate1.crl": crlRevoked
        }
      );

      const result = await chain.build(leafCert, {
        revocationMode: "online"
      });
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.revokedOCSP);
    });

    it("should return error if intermediate certificate is revoked by OCSP", async () => {
      const ocspRevoked = await OCSP.create({
        issuer: intermediateCert1,
        responses: [
          {
            certId: await CertificateID.create(
              "SHA-256",
              intermediateCert2,
              intermediateCert1
            ),
            status: {
              type: "revoked",
              revocationTime: new Date(),
              reason: "privilegeWithdrawn"
            },
            thisUpdate: new Date(),
            nextUpdate: new Date(Date.now() + 1000 * 60 * 60 * 24) // 1 day
          }
        ],
        producedAt: new Date(),
        signingAlgorithm,
        signingKey: intermediateCert1.privateKey!
      });

      const chain = new CertificateChain();
      chain.certificateHandler.certificates.push(rootCert);
      chain.certificateHandler.certificates.push(intermediateCert1);
      chain.certificateHandler.certificates.push(intermediateCert2);
      chain.certificateHandler.parent = new RootCertificateStorageHandler(
        rootCert,
        {
          "http://leaf.crl": crlLeaf,
          "http://leaf.ocsp": ocspLeaf,
          "http://intermediate2.ocsp": ocspRevoked,
          "http://intermediate1.crl": crlIntermediate1
        }
      );

      const result = await chain.build(leafCert, {
        revocationMode: "online"
      });
      expect(result.result).toBe(false);
      expect(result.resultCode).toBe(CertificateChainStatusCode.revokedOCSP);
    });
  });
});
