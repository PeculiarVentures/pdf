import { Crypto } from "@peculiar/webcrypto";
import * as x509 from "@peculiar/x509";
import * as assert from "assert";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import { ContentTypeAttribute, MessageDigestAttribute, SigningTimeAttribute } from "./attributes";
import { CertificateChain } from "./CertificateChain";
import { CMSSignedData } from "./SignedData";
import { cms, data } from "./SignedData.vector.spec";
import { CMSContentType } from "./SignerInfo";

const crypto = new Crypto() as globalThis.Crypto;

pkijs.setEngine("CryptoEngine", crypto, new pkijs.CryptoEngine({ crypto: crypto, subtle: crypto.subtle }));
x509.cryptoProvider.set(crypto);

context("SignedData", () => {

  context("fromBER", () => {

    it("vector", async () => {
      const signedData = CMSSignedData.fromBER(cms);

      assert.strictEqual(signedData.signers.length, 1);

      const result = await signedData.verify(data);

      for (const signer of result.signers) {
        if (signer.signerCertificate) {
          const chain = new CertificateChain();
          chain.certificateHandler = signedData.certificateHandler;
          const _chainResult = await chain.build(signer.signerCertificate, { checkDate: result.date });
        }
      }

      assert.strictEqual(result.signatureVerified, true);
    });

  });

  it("sign/verify", async () => {
    const alg: RsaHashedKeyGenParams = {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
      publicExponent: new Uint8Array([1, 0, 1]),
      modulusLength: 2048,
    };
    const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
    const cert = await x509.X509CertificateGenerator.createSelfSigned({
      serialNumber: "010203",
      notBefore: new Date("2021-06-29"),
      notAfter: new Date("2022-06-29"),
      name: "CN=Test",
      keys,
      signingAlgorithm: alg,
    }, crypto);

    const data = Convert.FromUtf8String("Hello");
    const digestAlgorithm = "SHA-256";
    // const digestAlgorithm = alg.hash;
    const messageDigest = await crypto.subtle.digest(digestAlgorithm, data);

    let signedData = new CMSSignedData();
    const signer = signedData.createSigner(cert, {
      digestAlgorithm,
      signedAttributes: [
        new ContentTypeAttribute(CMSContentType.data),
        new SigningTimeAttribute(),
        new MessageDigestAttribute(messageDigest),
      ]
    });
    signedData.certificates.push(cert);

    await signedData.sign(keys.privateKey!, signer);

    // console.log(signedData.toString("hex"));

    // !!! PKIjs uses encoded SignerInfo.signedAttributes. We need decode BER data for that
    signedData = CMSSignedData.fromBER(signedData.toBER());
    const verifyResult = await signedData.verify(data);

    // console.log(verifyResult);

    assert.strictEqual(verifyResult.signers[0].code, 14);
    assert.strictEqual(verifyResult.signers[0].signatureVerified, true);
  });

});
