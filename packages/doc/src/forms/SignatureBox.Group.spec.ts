import * as assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import { Crypto } from "@peculiar/webcrypto";
import * as x509 from "@peculiar/x509";
import * as core from "@peculiarventures/pdf-core";
import { CMSContentType, CMSSignedData, ContentTypeAttribute, FormattingState, MessageDigestAttribute, PDFDocument, SignatureBoxGroup, SigningTimeAttribute } from "@peculiarventures/pdf-doc";
import { BufferSourceConverter, Convert } from "pvtsutils";
import * as pkijs from "pkijs";

const crypto = new Crypto() as globalThis.Crypto;
pkijs.setEngine("PDF crypto", crypto, new core.PDFCryptoEngine({ crypto: crypto, subtle: crypto.subtle }));

const WRITE_FILES = false;

export function writeFile(data: BufferSource, name = "tmp"): void {
  if (!WRITE_FILES) {
    return;
  }
  const filePath = path.resolve(__dirname, `../../../../${name}.pdf`);
  fs.writeFileSync(filePath, Buffer.from(BufferSourceConverter.toArrayBuffer(data)), { flag: "w+" });
  console.log(`File saved to ${filePath}`);
}

async function createEmptyDocument() {
  const doc = await PDFDocument.create({
    useXrefTable: true,
    disableCompressedStreams: true,
  });
  assert.strictEqual(doc.pages.length, 0);
  const page = doc.pages.create();

  return { doc, page };
}

async function createSelfSignedCertificate() {
  const alg: RsaHashedKeyGenParams = {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
    modulusLength: 2048,
  };
  const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
  const cert = await x509.X509CertificateGenerator.createSelfSigned({
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
      await x509.AuthorityKeyIdentifierExtension.create(keys.publicKey!, false, crypto),
      await x509.SubjectKeyIdentifierExtension.create(keys.publicKey!, false, crypto),
      new x509.ExtendedKeyUsageExtension([
        "1.3.6.1.4.1.311.10.3.12", // documentSigning
        "1.2.840.113583.1.1.5", // pdfAuthenticDocumentsTrust
      ]),
    ]
  }, crypto);

  return { keys, cert };
}

function signHandler(hash: string, keys: CryptoKeyPair, cert: x509.X509Certificate) {
  return async (data: Uint8Array) => {
    const messageDigest = await crypto.subtle.digest(hash, data);
    const signedData = new CMSSignedData();
    const signer = signedData.createSigner(cert, {
      digestAlgorithm: hash,
      signedAttributes: [
        new ContentTypeAttribute(CMSContentType.data),
        new SigningTimeAttribute(new Date()),
        new MessageDigestAttribute(messageDigest),
      ]
    });

    signedData.certificates.push(cert);

    await signedData.sign(keys.privateKey!, signer);

    return signedData.toBER();
  };
}

function checkSignatureValue(signatureValue: core.SignatureDictionary, doc: PDFDocument, eol: string, isLastSignature: boolean) {
  const byteRange = signatureValue.ByteRange.get();
  assert.strictEqual(byteRange.get(0, core.PDFNumeric).value, 0);
  assert.strictEqual(byteRange.get(1, core.PDFNumeric).value, signatureValue.Contents.view.byteOffset);
  assert.strictEqual(byteRange.get(2, core.PDFNumeric).value, signatureValue.Contents.view.byteOffset + signatureValue.Contents.view.byteLength);
  const lastByte = byteRange.get(3, core.PDFNumeric).value + byteRange.get(2, core.PDFNumeric).value;

  if (isLastSignature) {
    assert.strictEqual(lastByte, doc.target.view.byteLength);
  } else {
    const endView = doc.target.view.subarray(lastByte - eol.length - 5, lastByte);
    assert.strictEqual(Convert.ToBinary(endView), `%%EOF${eol}`);
  }
}

context("SignatureBoxGroup", () => {
  context("States", () => {
    context("formatting", () => {
      context("%%EOF with different EOL", () => {
        after(() => {
          core.PDFDocumentUpdate.EOF_EOL = "\n"; // restore default value
        });

        [
          "", // empty
          "\n", // LF
          "\r\n", // CRLF
          "\n\n", // LFLF (Acrobat Reader supports this EOL)
          "\n\n\n", // LFLFLF (Acrobat Reader supports this EOL)
        ].forEach((eol) => {
          it(`should create valid PDF with EOL = ${JSON.stringify(eol)}`, async () => {
            core.PDFDocumentUpdate.EOF_EOL = eol;
            const emptyDoc = await createEmptyDocument();
            let doc = emptyDoc.doc;
            const page = emptyDoc.page;
            const fileName = JSON.stringify(eol)
              .replace(/"/g, "") // remove quotes
              .replace(/\\/g, "") // remove backslash
              || "empty";

            // Add signature box
            page.addSignatureBox({
              groupName: "box1",
            });
            page.addSignatureBox({
              groupName: "box2",
            });

            // Save document
            await doc.save();

            const { keys, cert } = await createSelfSignedCertificate();
            const box1 = doc.getComponentByName("box1");
            assert.ok(box1 instanceof SignatureBoxGroup);
            await box1.sign({
              dictionaryUpdate: async (dict) => {
                dict.subFilter = "adbe.pkcs7.detached";
                dict.Reason.get().text = "Описание причины";
                dict.Location.get().text = "56.632N 47.928E";
              },
              containerCreate: signHandler("SHA-256", keys, cert),
            });
            let raw = await doc.save();
            writeFile(raw, `SignatureBox.Group.spec.${fileName}.1.pdf`);
            // reopen document, in this case UpdateSection will have different EOL after parsing
            // Parser reads %%EOF[\d][\n]
            doc = await PDFDocument.load(raw);

            let verify = await doc.verify();
            let formattingSate = verify.items[0].states[0];
            assert.strictEqual(formattingSate.type, "valid");

            const box2 = doc.getComponentByName("box2");
            assert.ok(box2 instanceof SignatureBoxGroup);
            await box2.sign({
              dictionaryUpdate: async (dict) => {
                dict.subFilter = "adbe.pkcs7.detached";
                dict.Reason.get().text = "Описание причины 2";
                dict.Location.get().text = "56.632N 47.928E";
              },
              containerCreate: signHandler("SHA-256", keys, cert),
            });
            raw = await doc.save();
            writeFile(raw, `SignatureBox.Group.spec.${fileName}.2.pdf`);

            verify = await doc.verify();
            formattingSate = verify.items[0].states[0];
            assert.strictEqual(formattingSate.type, "valid");
            formattingSate = verify.items[1].states[0];
            assert.strictEqual(formattingSate.type, "valid");

            // check byteRange positions
            const signatureValue1 = box1.getSignatureValue();
            checkSignatureValue(signatureValue1, doc, eol, false);

            const signatureValue2 = box2.getSignatureValue();
            checkSignatureValue(signatureValue2, doc, eol, true);
          });
        });

        it("should return invalid state if there are 'Too many bytes after %%EOF marker'", async () => {
          core.PDFDocumentUpdate.EOF_EOL = "\n\n\n\n";
          const emptyDoc = await createEmptyDocument();
          const doc = emptyDoc.doc;
          const page = emptyDoc.page;

          // Add signature box
          page.addSignatureBox({
            groupName: "box1",
          });

          // Save document
          await doc.save();

          const { keys, cert } = await createSelfSignedCertificate();
          const box1 = doc.getComponentByName("box1");
          assert.ok(box1 instanceof SignatureBoxGroup);
          await box1.sign({
            dictionaryUpdate: async (dict) => {
              dict.subFilter = "adbe.pkcs7.detached";
              dict.Reason.get().text = "Описание причины";
              dict.Location.get().text = "56.632N 47.928E";
            },
            containerCreate: signHandler("SHA-256", keys, cert),
          });
          const raw = await doc.save();
          writeFile(raw, "SignatureBox.Group.spec.invalid.pdf");

          const verify = await doc.verify();
          const formattingSate = verify.items[0].states[0] as FormattingState;
          assert.strictEqual(formattingSate.type, "invalid");
          assert.ok(formattingSate.data.error);
          assert.strictEqual(formattingSate.data.error.message, "The range of bytes points to an incorrect data. Too many bytes after %%EOF marker.");
        });

        it("should return invalid state if there are 'EOL contains invalid characters'", async () => {
          core.PDFDocumentUpdate.EOF_EOL = "\n \n";
          const emptyDoc = await createEmptyDocument();
          const doc = emptyDoc.doc;
          const page = emptyDoc.page;

          // Add signature box
          page.addSignatureBox({
            groupName: "box1",
          });

          // Save document
          await doc.save();

          const { keys, cert } = await createSelfSignedCertificate();
          const box1 = doc.getComponentByName("box1");
          assert.ok(box1 instanceof SignatureBoxGroup);
          await box1.sign({
            dictionaryUpdate: async (dict) => {
              dict.subFilter = "adbe.pkcs7.detached";
              dict.Reason.get().text = "Описание причины";
              dict.Location.get().text = "56.632N 47.928E";
            },
            containerCreate: signHandler("SHA-256", keys, cert),
          });
          const raw = await doc.save();
          writeFile(raw, "SignatureBox.Group.spec.invalid.pdf");

          const verify = await doc.verify();
          const formattingSate = verify.items[0].states[0] as FormattingState;
          assert.strictEqual(formattingSate.type, "invalid");
          assert.ok(formattingSate.data.error);
          assert.strictEqual(formattingSate.data.error.message, "The range of bytes points to an incorrect data. EOL contains invalid characters.");
        });

        it("should return invalid state if there are 'Document contains extra bytes after signed data'", async () => {
          core.PDFDocumentUpdate.EOF_EOL = "\n";
          const emptyDoc = await createEmptyDocument();
          let doc = emptyDoc.doc;
          const page = emptyDoc.page;

          // Add signature box
          page.addSignatureBox({
            groupName: "box1",
          });

          // Save document
          await doc.save();

          const { keys, cert } = await createSelfSignedCertificate();
          const box1 = doc.getComponentByName("box1");
          assert.ok(box1 instanceof SignatureBoxGroup);
          await box1.sign({
            dictionaryUpdate: async (dict) => {
              dict.subFilter = "adbe.pkcs7.detached";
              dict.Reason.get().text = "Описание причины";
              dict.Location.get().text = "56.632N 47.928E";
            },
            containerCreate: signHandler("SHA-256", keys, cert),
          });
          let raw = await doc.save();
          raw = BufferSourceConverter.concat(raw, Buffer.from("\n"));
          writeFile(raw, "SignatureBox.Group.spec.invalid.pdf");

          doc = await PDFDocument.load(raw);
          const verify = await doc.verify();
          const formattingSate = verify.items[0].states[0] as FormattingState;
          assert.strictEqual(formattingSate.type, "invalid");
          assert.ok(formattingSate.data.error);
          assert.strictEqual(formattingSate.data.error.message, "The range of bytes points to an incorrect data. Document contains extra bytes after signed data.");
        });
      });
      context("ByteRange", () => {
        [0, 1, 2].forEach((index) => {
          it(`should return invalid state if ByteRange[${index}] points to incorrect data`, async () => {
            const { doc, page } = await createEmptyDocument();
            page.addSignatureBox({
              groupName: "box1",
            });
            await doc.save();

            const { keys, cert } = await createSelfSignedCertificate();
            const box1 = doc.getComponentByName("box1", SignatureBoxGroup);
            await box1.sign({
              dictionaryUpdate: async (dict) => {
                dict.subFilter = "adbe.pkcs7.detached";
                dict.Reason.get().text = "Описание причины";
                dict.Location.get().text = "56.632N 47.928E";
              },
              containerCreate: (data) => {
                const byteRange = box1.getSignatureValue().ByteRange.get();
                const num = byteRange.get(index, core.PDFNumeric);
                let numValue = num.value;
                if (index > 1) {
                  numValue -= 1;
                } else {
                  numValue += 1;
                }
                const str = numValue.toString();
                for (let i = 0; i < num.view.length; i++) {
                  num.view[i] = str.charCodeAt(i) || 0;
                }

                return signHandler("SHA-256", keys, cert)(data);
              },
            });
            const raw = await doc.save();
            writeFile(raw, "SignatureBox.Group.spec.invalid.pdf");

            const doc2 = await PDFDocument.load(raw);
            const verify = await doc2.verify();
            const formattingSate = verify.items[0].states[0] as FormattingState;
            assert.strictEqual(formattingSate.type, "invalid");
            assert.ok(formattingSate.data.error);
            assert.strictEqual(formattingSate.data.error.message, `The range of bytes points to an incorrect data. ByteRange[${index}] points to an incorrect data.`);
          });
        });
      });
    });
  });
});
