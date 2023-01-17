import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import * as core from "@peculiarventures/pdf-core";
import * as x509 from "@peculiar/x509";
import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";
import { PDFDocument, PDFDocumentCreateParameters, PDFVersion } from "./Document";
import { writeFile } from "./Document.spec";
import { BufferSourceConverter, Convert } from "pvtsutils";
import { FontFactory, DefaultFonts } from "@peculiarventures/pdf-font";
import { FormObject } from "./FormObject";
import { RadioButton, SignatureBox, SignatureBoxGroup } from "./Form";
import * as cms from "./cms";
import { PDFDictionary } from "@peculiarventures/pdf-core";
import { StandardEncryptionHandler } from "packages/core/src/encryption";


const options: PDFDocumentCreateParameters = {
  version: PDFVersion.v1_6,
  disableCompressedStreams: true,
  disableAscii85Encoding: true,
  disableCompressedObjects: true,
  useXrefTable: true,
};

const imagePngB64 = "iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAFD0lEQVRYR82YC1BUZRTHf4gsgrosoIgQ4KNFNLB0NCrHycwcDUsbzddYMdRopmalk48yG8uaSrMa0x46jdM4VjZOMUWjTaLZOBYSUEBZKBBqvB/LAtKCNOe697rA7l3ZXR9nZufe/e79zve7//t93z3n+OEb2wysN45ajKXwI/G4CdjoC9d+PnAyAKgSPzFzTlL25Tg5rQDk5Ky3/n0BuB7Y3H/EowyavIfKo0tUFV8DXrjegMFAk0Dc9NBP9ImcQGtVtqpiLXCrtyp6q+AzwLZ+w+cSOfVzTSwHFd8CnvdGRW8BO2Tw6JmZBEVN0jgcVLQAt3ijojeAK4D3+g55kMHTv+4mUsXhVBpP7ZH2bcBznqroDaBT9VQQBxVbgHhPVfQUUFEvOOY+omYccilO+aG5WE/v90pFTwF11XOiog0Y5omKngAq6smikMXhzv7NmEFT6bceq+gOMBZIcvLrtnJdgV6o+JmzB+5QLxcCjr98oEDvIQUwygFgtH1zlaNLu1L1VAfn0ifTcs6t2n/b4QU6D/gNOCWAynxyZv5BEQSEmDGYzASExCvnASYzhpB4/HoHuXu72vWO9gvYLCW0NZZgayy+dGw4TWt1DjbLGV0/CmCAcRiG0FEYwpMwhCURqBwTrxjA2xvbms7T1ljMf7UFCnRrda5y7GhvxS9s3IaOsPESHd1Y1li0j4rvF6IoGDp2LeHJr98whJY/P6EyM03h0eag6bbVDLhTvu3X1xryd1B1bJkKsUoAFwMfSotp9EoGTHjnuhHW522l+vhqdfyVst+q+6AGGZL4FAMnvn/NIeuyN1Pzy4vquMsBBcJxo9YgJbeIuFsR9ZqYgAmg3Z5U32hXQPl/GTIhjYh7dl91wOrjq6jPe1sdZwmgZF2qOfvUaZBqnnG1KKt+XEpDwQcu4ZwpqN58GdK8kEFT9vqc0SGgFd/dlNNTsBtkv+EPEzn1C59Blh+ah/W05s8lnJ6CKoySkIckLmPgxO0+A6w6tpyGfGWRuk1N3YVb3wApEZN2YRz5uM8ALX/spvLIE+JPkplZeo7dAZYCsTFzsggcqFQMfGISCJTtHyu+igCzp4AGoFU6D02rwT8wzCdwqpOinZo2Mo6kBE5NT0GRLMs/eBBDHyv3KZw4K903Alv9X3IqcZ3LqFoPUCbdruDYaUSlfOdzwPKDs7GeOSB+ZwPKiTPTA3wXeDp07DrCk2WxubeW80c6VRj0etRmbaT2pBKHbgBe9QRQZJsmnztjwqXYzJXJpK85sY7msoMKYNj4jW5BRT1REfgMWOAJoEwQc9e6i6MjCdFrszdhLeq+ibsDtVmKKd0rqTK/Ay6TNFevOBSoBnoNWVRC7/5xnR5QJndd3hYshR87tr8BrLW/Lq0uKHM4dMwap4qWfBpHm/Wfi4CMJ4WmbuYKUEpVmQGmeOIWnNI6yVM3FOygPneLoyOJywSs3qHRaC8Ba0WjvkNnKQGxYxXsfEYKzaUZ0u122TF6Aigx9/a+Qx5g8PR02qxlNBTspO7XTnmLvFcBK9aZntH2KutS9Z5+N8/HlLSCPpF3UXNiDXU5b8qlRYDTiMSVglulZCZP3MtgVOK1izalkCqWDrwM5OiunM4XR9oLmalqszEhlaDoe6n44RFpegV4qScKfgXM9A+OpL1Z26QPAvK4h3sA1vXWZOBZYF6XC1Kend8TQFlZauZ+VJIXvc3UA+ApdtD77X1zgTHO/PwPqpOcplT5ik0AAAAASUVORK5CYII=";
const imagePngRaw = Convert.FromBase64(imagePngB64);
const imageJpegB64 = "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";
const imageJpegRaw = Convert.FromBase64(imageJpegB64);

context("Page", () => {

  context("CheckBox", () => {

    it("Add", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const padding = core.TypographyConverter.toPoint("5mm");
      page.addCheckBox({
        top: padding,
        left: padding,
        enabled: false,
      });
      page.addCheckBox({
        top: padding,
        left: padding + 22,
        foreColor: [1, 0, 0],
        enabled: true,
        width: 20,
        height: 40,
      });
      page.addCheckBox({
        top: padding,
        left: padding + 44,
        borderColor: [0, 0, 1],
        enabled: true,
        width: 40,
        height: 20,
      });
      const box = page.addCheckBox({
        top: padding,
        left: padding + 86,
        enabled: true,
        width: 80,
        height: 20,
      });
      box.height = 160;
      box.borderColor = [0, 1, 0];
      box.backgroundColor = [0, 0, 0.5];
      box.borderWidth = 1;
      box.foreColor = [0, 0.5, 0.5];
      const boxw = page.addCheckBox({
        top: padding,
        left: padding + 166,
        enabled: true,
        width: 80,
        height: 20,
      });
      boxw.width = 160;

      const pdf = await doc.save();
      writeFile(pdf);

      assert.ok(page.target.annots);
      assert.strictEqual(page.target.annots.length, 5);
    });

    it("Change position", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const padding = core.TypographyConverter.toPoint("5mm");
      const checkBox = page.addCheckBox({
        top: padding,
        left: padding,
        enabled: false,
      });

      await doc.save();

      checkBox.print = true;

      const pdf = await doc.save();
      writeFile(pdf);

      assert.ok(page.target.annots);
      assert.strictEqual(page.target.annots.length, 1);
    });

    it("Change checked", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const padding = core.TypographyConverter.toPoint("5mm");
      const checkBox = page.addCheckBox({
        top: padding,
        left: padding,
        enabled: false,
      });

      assert.strictEqual(checkBox.checked, false);

      await doc.save();

      checkBox.checked = true;
      assert.strictEqual(checkBox.checked, true);

      // const pdf = await doc.save();
      // writeFile(pdf);
    });

  });

  context("RadioButton", () => {

    it("Add", async () => {
      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      // Group
      const padding = core.TypographyConverter.toPoint("5mm");
      page.addRadioButton({
        value: "btn1",
        top: padding,
        left: padding,
        enabled: true,
        group: "group-1",
      });
      page.addRadioButton({
        value: "btn2",
        top: padding,
        left: padding + 22,
        width: 30,
        height: 60,
        foreColor: [0, 0.5, 1],
        borderWidth: 2,
        borderColor: [1, 0.5, 0],
        backgroundColor: [0, 1, 0.5],
        group: "group-1",
      });
      page.addRadioButton({
        value: "btn3",
        top: padding,
        left: padding + 54,
        group: "group-1",
        borderColor: [0.5, 1, 0],
        backgroundColor: [0, 0.5, 1],
        foreColor: [1, 0, 0.5],
        borderWidth: 3,
        width: 60,
        height: 30,
      });
      const rbh = page.addRadioButton({
        value: "btn4",
        top: padding + 70,
        left: padding,
        group: "group-1",
        borderColor: [0.5, 1, 0],
        backgroundColor: [0, 0.5, 1],
        foreColor: [1, 0, 0.5],
        borderWidth: 3,
        width: 30,
        height: 30,
      });
      rbh.height = 60;

      const rbw = page.addRadioButton({
        value: "btn5",
        top: padding + 70,
        left: padding + 32,
        group: "group-1",
        borderColor: [0.5, 1, 0],
        backgroundColor: [0, 0.5, 1],
        foreColor: [1, 0, 0.5],
        borderWidth: 3,
        width: 30,
        height: 30,
      });

      rbw.width = 60;

      const pdf = await doc.save();
      writeFile(pdf);

      assert.ok(page.target.annots);
      // assert.strictEqual(page.target.annots.length, 2);
    });

    it("Change checked", async () => {
      const doc = await PDFDocument.create();

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const padding = core.TypographyConverter.toPoint("5mm");
      const rb1 = page.addRadioButton({
        group: "group-1",
        value: "rb1",
        top: padding,
        left: padding,
        enabled: true,
      });
      const rb2 = page.addRadioButton({
        group: "group-1",
        value: "rb2",
        top: padding,
        left: padding + 2 + rb1.width,
      });

      assert.strictEqual(rb1.checked, true);
      assert.strictEqual(rb2.checked, false);

      await doc.save();

      rb2.checked = true;
      assert.strictEqual(rb1.checked, false);
      assert.strictEqual(rb2.checked, true);

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("Change checked", async () => {
      const doc = await PDFDocument.create();

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const padding = core.TypographyConverter.toPoint("5mm");
      const rb1 = page.addRadioButton({
        group: "group-1",
        value: "rb1",
        top: padding,
        left: padding,
        enabled: true,
      });
      rb1.readOnly = true;
      rb1.readOnlyAnnot = true;

      const rb2 = page.addRadioButton({
        group: "group-1",
        value: "rb2",
        top: padding,
        left: padding + 2 + rb1.width,
      });

      const pdf = await doc.save();
      const doc2 = await PDFDocument.load(pdf);

      const rb21 = doc2.getComponentById(rb1.id, 0, RadioButton)!;
      const rb22 = doc2.getComponentById(rb2.id, 0, RadioButton)!;

      assert.strictEqual(rb21.readOnly, true, "rb21 field");
      assert.strictEqual(rb22.readOnly, true, "rb22 field");

      assert.strictEqual(rb21.readOnlyAnnot, true, "rb21 annot");
      assert.strictEqual(rb22.readOnlyAnnot, false, "rb22 annot");

      writeFile(pdf);
    });

    it("Change group", async () => {
      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const padding = core.TypographyConverter.toPoint("5mm");
      const rb1 = page.addRadioButton({
        group: "group-1",
        value: "rb1",
        top: padding,
        left: padding,
        enabled: true,
      });
      const rb2 = page.addRadioButton({
        group: "group-1",
        value: "rb2",
        top: padding,
        left: padding + 2 + rb1.width,
      });

      let pdf = await doc.save();
      writeFile(pdf);

      const doc2 = await PDFDocument.load(pdf);

      doc2.getComponentById(rb2.id, 0, RadioButton)!.groupName = "group-2";
      doc2.getComponentById(rb2.id, 0, RadioButton)!.checked = true;
      doc2.getComponentById(rb1.id, 0, RadioButton)!.groupName = "group-2";

      pdf = await doc2.save();

      writeFile(pdf);
    });

  });

  context("TextEdit", () => {

    it("Add default Font", async () => {
      const doc = await PDFDocument.create(options);
      const font = doc.addFont();

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      const edit = page.addTextEditor({
        top: "10mm",
        left: "5mm",
        text: "Default font",
        font,
        fontSize: 12,
        width: "2cm",
        height: "2cm",
      });

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("Add custom Font", async () => {
      const filesPath = path.join(__dirname, "..", "..", "font", "fonts", "TimesRoman.ttf");
      const file = fs.readFileSync(filesPath);

      const doc = await PDFDocument.create(options);

      const sFont = FontFactory.subsetFont(file, "Hello world Привет");
      const customFont = doc.addFont(sFont);
      const defaultFont = doc.addFont();

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      const edit = page.addTextEditor({
        top: "10mm",
        left: "10mm",
        text: "Привет",
        height: "40mm",
        font: customFont,
        width: "2cm",
      });

      page.addTextEditor({
        top: "10mm",
        left: "40mm",
        height: "40mm",
        text: "Hello world",
        font: defaultFont,
        width: "2cm",
      });

      await doc.save();
      edit.textColor = 0.5;
      const pdf = await doc.save();
      writeFile(pdf);

      assert.ok(page.target.annots);
      assert.strictEqual(page.target.annots.length, 2);
    });

  });

  context("Watermark", () => {
    it("Add watermark", async () => {
      const doc = await PDFDocument.create(options);

      const page = doc.pages.create();

      const image = doc.createImage(imagePngRaw);

      page
        .graphics()
        .translate("4cm", "4cm")
        .rotate(15)
        .drawImage(image, "4cm", "4cm");
      const matrix = core.Metrics.createWithoutDocument();
      matrix.rotate(15);

      const formWatermark = doc.createForm(100, 20);
      formWatermark.graphics()
        .opacity(.5)
        .fillColor(1)
        .rect(0, 0, formWatermark.width, formWatermark.height)
        .fill()
        .strokeColor(0.5)
        .rect(0, 0, formWatermark.width, formWatermark.height)
        .stroke();

      const watermarkText = doc.createWatermark({
        flags: core.AnnotationFlags.print,
        appearance: formWatermark,
        pageHeight: page.height,
        left: "4cm",
        top: "4cm",
        matrix,
      });

      const watermarkImage = doc.createWatermark({
        flags: core.AnnotationFlags.print,
        appearance: formWatermark,
        pageHeight: page.height,
        left: "4cm",
        top: "6cm",
      });

      page.addWatermark(watermarkText);
      page.addWatermark(watermarkImage);

      const pdf = await doc.save();
      writeFile(pdf);
    });
  });

  context("Image", () => {

    it("Add simple PNG image", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const image = doc.createImage(imagePngRaw);

      page.graphics()
        .translate("1cm", "1cm")
        .drawImage(image, "20mm", "20mm");

      page.graphics()
        .translate("3.5cm", "1cm")
        .rotate(45)
        .drawImage(image, "30mm", "30mm");

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("Add simple JPEG image", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const image = doc.createImage(imageJpegRaw);

      const page = doc.pages.create();

      page.graphics()
        .translate("5mm", "5mm")
        .drawImage(image, "5mm", "5mm");

      page.graphics()
        .translate("15mm", "5mm")
        .drawImage(image, "10mm", "15mm");

      page.graphics()
        .translate("30mm", "5mm")
        .scale(2, 2)
        .drawImage(image);

      const pdf = await doc.save();
      writeFile(pdf);
    });

  });

  context("SignatureBox", () => {

    it("Hidden signature", async () => {
      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      const box = page.addSignatureBox({
        groupName: "box1",
      });

      assert.strictEqual(box.width, 0);
      assert.strictEqual(box.height, 0);

      const boxGroup = box.findGroup();
      assert.ok(boxGroup);
      assert.strictEqual(boxGroup.length, 1);

      const pdf = await doc.save();

      writeFile(pdf);
    });

    it("Signature with box", async () => {
      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      const box = page.addSignatureBox({
        left: 10,
        top: 10,
        width: 200,
        height: 50,
        groupName: "box1",
      });

      assert.strictEqual(box.width, 200);
      assert.strictEqual(box.height, 50);

      const boxGroup = box.findGroup();
      assert.ok(boxGroup);
      assert.strictEqual(boxGroup.length, 1);

      const pdf = await doc.save();

      writeFile(pdf);
    });

    it("Add multiple signatures and change group", async () => {
      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      // const image = doc.createImage(imagePngRaw);

      const page = doc.pages.create();
      const img1 = page.addSignatureBox({
        left: "5mm",
        top: "5mm",
        width: "3cm",
        height: "2cm",
        groupName: "stepan",
      });

      const img2 = page.addSignatureBox({
        left: "40mm",
        top: "5mm",
        width: "3cm",
        height: "2cm",
        groupName: "ryan",
      });

      const page2 = doc.pages.create();
      const img3 = page2.addSignatureBox({
        left: "5mm",
        top: "5mm",
        width: "3cm",
        height: "2cm",
        groupName: "stepan",
      });

      const img4 = page2.addSignatureBox({
        left: "40mm",
        top: "5mm",
        width: "3cm",
        height: "2cm",
        groupName: "ryan",
      });

      assert.strictEqual(img1.groupName, "stepan");

      await doc.save();

      img1.groupName = "ryan";

      const comp = doc.getComponentByName("ryan");
      assert.ok(comp instanceof SignatureBoxGroup);
      assert.strictEqual(comp.length, 3);

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("Sign hidden signature", async () => {
      const crypto = new Crypto() as globalThis.Crypto;
      pkijs.setEngine("PDF crypto", crypto, new core.PDFCryptoEngine({ crypto: crypto, subtle: crypto.subtle }));

      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      page.addSignatureBox({
        groupName: "box1",
      });

      await doc.save();

      const box = doc.getComponentByName("box1");
      assert.ok(box instanceof SignatureBoxGroup);

      await box.sign({
        dictionaryUpdate: async (dict) => {
          dict.subFilter = "ETSI.CAdES.detached";
          dict.Reason.get().text = "Описание причины";
          dict.Location.get().text = "56.632N 47.928E";
        },
        containerCreate: async (data) => {

          //#region Create certificate
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
          //#endregion

          //#region Create CMS
          const messageDigest = await crypto.subtle.digest(alg.hash, data);
          const signedData = new cms.CMSSignedData();
          const signer = signedData.createSigner(cert, {
            digestAlgorithm: alg.hash,
            signedAttributes: [
              new cms.ContentTypeAttribute(cms.CMSContentType.data),
              new cms.SigningTimeAttribute(new Date()),
              new cms.MessageDigestAttribute(messageDigest),
            ]
          });

          signedData.certificates.push(cert);

          await signedData.sign(keys.privateKey!, signer);
          //#endregion

          return signedData.toBER();
        }
      });

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("Sign visual signature", async () => {
      const crypto = new Crypto() as globalThis.Crypto;
      pkijs.setEngine("PDF crypto", crypto, new core.PDFCryptoEngine({ crypto: crypto, subtle: crypto.subtle }));

      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      page.addSignatureBox({
        groupName: "box1",
        left: 10,
        top: 10,
        height: 100,
        width: 100,
      });

      await doc.save();

      const box = doc.getComponentByName("box1");
      assert.ok(box instanceof SignatureBoxGroup);

      await box.sign({
        createImage: () => {
          const image = doc.createImage(imageJpegRaw);
          const form = doc.createForm(100, 100);
          form.graphics()
            .translate(0, 0)
            .scale(100 / image.width, 100 / image.height)
            .drawImage(image);

          return form;
        },
        dictionaryUpdate: async (dict) => {
          dict.subFilter = "ETSI.CAdES.detached";
          dict.Reason.get().text = "Описание причины";
          dict.Location.get().text = "56.632N 47.928E";
        },
        containerCreate: async (data) => {
          //#region Create certificate
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
          //#endregion

          //#region Create CMS
          const messageDigest = await crypto.subtle.digest(alg.hash, data);
          const signedData = new cms.CMSSignedData();
          const signer = signedData.createSigner(cert, {
            digestAlgorithm: alg.hash,
            signedAttributes: [
              new cms.ContentTypeAttribute(cms.CMSContentType.data),
              new cms.SigningTimeAttribute(new Date()),
              new cms.MessageDigestAttribute(messageDigest),
            ]
          });

          signedData.certificates.push(cert);

          await signedData.sign(keys.privateKey!, signer);
          //#endregion

          return signedData.toBER();
        }
      });

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("Sign multiple signature boxes ", async () => {
      const crypto = new Crypto() as globalThis.Crypto;
      pkijs.setEngine("PDF crypto", crypto, new core.PDFCryptoEngine({ crypto: crypto, subtle: crypto.subtle }));

      const doc = await PDFDocument.create(options);

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();
      page.addSignatureBox({
        groupName: "box1",
        left: 10,
        top: 10,
        height: 100,
        width: 100,
      });
      page.addSignatureBox({
        groupName: "box1",
        left: 120,
        top: 10,
        height: 80,
        width: 50,
      });
      page.addSignatureBox({
        groupName: "box1",
        left: 180,
        top: 10,
        height: 50,
        width: 100,
      });

      await doc.save();
      // writeFile(await doc.save(), "tmp1");

      const box = doc.getComponentByName("box1");
      assert.ok(box instanceof SignatureBoxGroup);

      await box.sign({
        createImage: () => {
          const image = doc.createImage(imageJpegRaw);
          const form = doc.createForm(100, 100);
          form.graphics()
            .translate(0, 0)
            .scale(100 / image.width, 100 / image.height)
            .drawImage(image);

          return form;
        },
        dictionaryUpdate: async (dict) => {
          dict.subFilter = "ETSI.CAdES.detached";
          dict.Reason.get().text = "Описание причины";
          dict.Location.get().text = "56.632N 47.928E";
        },
        containerCreate: async (data) => {
          //#region Create certificate
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
          //#endregion

          //#region Create CMS
          const messageDigest = await crypto.subtle.digest(alg.hash, data);
          const signedData = new cms.CMSSignedData();
          const signer = signedData.createSigner(cert, {
            digestAlgorithm: alg.hash,
            signedAttributes: [
              new cms.ContentTypeAttribute(cms.CMSContentType.data),
              new cms.SigningTimeAttribute(new Date()),
              new cms.MessageDigestAttribute(messageDigest),
            ]
          });

          signedData.certificates.push(cert);

          await signedData.sign(keys.privateKey!, signer);
          //#endregion

          return signedData.toBER();
        }
      });

      const pdf = await doc.save();
      writeFile(pdf);
    });

  });

  it("Form", async () => {
    const doc = await PDFDocument.create(options);

    const page = doc.pages.create();

    const form = FormObject.create(doc, "2cm", "2cm");

    form.graphics()
      .fillColor([0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff])
      .rect(0, 0, form.width, form.height)
      .fill();

    form.graphics()
      .fillColor(0.25)
      .circle(form.width / 2 + 2, form.height / 2 - 2, "0.75cm")
      .fill();

    form.graphics()
      .fillColor(0)
      .circle(form.width / 2, form.height / 2, "0.75cm")
      .fill();

    const helv = doc.addFont(DefaultFonts.Helvetica);

    page.graphics()
      .strokeColor(0)
      .line("1cm", 0, "1cm", "3cm")
      .stroke();
    page.graphics()
      .strokeColor(0)
      .line("0cm", "1cm", "3cm", "1cm")
      .stroke();


    page.graphics()
      .drawText({
        width: "2cm",
        blocks: [
          {
            font: helv,
            text: "Some text for example, some text, some text, some text, some text, some text, some text",
          }
        ]
      }, "1cm", "1cm");

    page.graphics()
      .translate("1cm", "4cm")
      .drawObject(form);

    page.graphics()
      .translate("5cm", "4cm")
      .drawObject(form);

    const pdf = await doc.save();
    writeFile(pdf);
  });

  context("Rectangle", () => {
    it("simple", async () => {
      const doc = await PDFDocument.create(options);

      const page = doc.pages.create();

      const graphics = page.graphics()
        .fillColor([0x66 / 0xff, 0xb2 / 0xff, 0xff / 0xff]);

      graphics.graphics()
        .translate(100, 100)
        .rotate(45)
        .rect(-50, -50, 100, 100, true)
        .fill();

      graphics.graphics()
        .strokeColor(0)
        .pathTo(100, 0)
        .pathLine(100, 200)
        .stroke();

      graphics.graphics()
        .strokeColor(0)
        .pathTo(0, 100)
        .pathLine(200, 100)
        .stroke();

      // graphics.rect("5cm", "5cm", "2cm", "2cm")
      //   .fill();

      const pdf = await doc.save();
      writeFile(pdf);
    });

    it("with transformations", async () => {
      const doc = await PDFDocument.create(options);

      const page = doc.pages.create();
      page.graphics()
        .fillColor(0)
        .translate("2cm", "2cm")
        .rotate(45)
        .scale(2, 2)
        .rect("2cm", "2cm")
        .fill();

      page.graphics()
        .fillColor(0)
        .rect("1cm", "1cm", "1cm", "1cm")
        .fill();

      const pdf = await doc.save();
      writeFile(pdf);
    });
  });

  context("InputImageBox", () => {

    it("Add", async () => {
      const doc = await PDFDocument.create({
        version: 1.5,
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const imageBox = page.addInputImageBox({
        top: "5mm",
        left: "5mm",
        width: "5cm",
        height: "10cm",
        // image,
        alt: "Click here to add image"
      });
      imageBox.print = true;
      imageBox.locked = true;
      imageBox.lockedContents = true;

      const pdf = await doc.save();
      writeFile(pdf);

      const doc2 = await PDFDocument.load(pdf);

      const component = doc2.getComponentByName(imageBox.name);
      assert.ok(component instanceof SignatureBox);

      const pdf2 = await doc2.save();
      writeFile(pdf2);
    });

  });

});


it("PDF/A", async () => {
  const doc = await PDFDocument.create({
    version: 1.5,
    useXrefTable: true,
    // disableAscii85Encoding: true,
    disableCompressedStreams: true,
  });

  const metadata = doc.target.createStream(Convert.FromUtf8String(`
<?xpacket begin="\xEF\xBB\xBF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.6-c017 91.164464, 2020/06/15-10:20:05        ">
   <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description rdf:about=""
            xmlns:xmp="http://ns.adobe.com/xap/1.0/"
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
            xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#"
            xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
            xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
            xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"
            xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"
            xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
         <xmp:CreateDate>2022-12-21T21:06:51+03:00</xmp:CreateDate>
         <xmp:CreatorTool>Acrobat Pro DC 21.1.20155</xmp:CreatorTool>
         <xmp:ModifyDate>2022-12-21T21:08:51+03:00</xmp:ModifyDate>
         <xmp:MetadataDate>2022-12-21T21:08:51+03:00</xmp:MetadataDate>
         <dc:format>application/pdf</dc:format>
         <xmpMM:DocumentID>uuid:7cfeec28-3077-8b4d-bd4d-30f38a656e11</xmpMM:DocumentID>
         <xmpMM:InstanceID>uuid:231d262e-3e1f-4144-accb-777d566d6ca2</xmpMM:InstanceID>
         <xmpMM:RenditionClass>default</xmpMM:RenditionClass>
         <xmpMM:VersionID>1</xmpMM:VersionID>
         <xmpMM:History>
            <rdf:Seq>
               <rdf:li rdf:parseType="Resource">
                  <stEvt:action>converted</stEvt:action>
                  <stEvt:instanceID>uuid:8436d2f7-c20f-2545-9d97-0cb84e44854d</stEvt:instanceID>
                  <stEvt:parameters>converted to PDF/A-2b</stEvt:parameters>
                  <stEvt:softwareAgent>Preflight</stEvt:softwareAgent>
                  <stEvt:when>2022-12-21T21:08:51+03:00</stEvt:when>
               </rdf:li>
            </rdf:Seq>
         </xmpMM:History>
         <pdf:Producer>Acrobat Pro DC 21.1.20155</pdf:Producer>
         <pdfaid:part>2</pdfaid:part>
         <pdfaid:conformance>B</pdfaid:conformance>
         <pdfaExtension:schemas>
            <rdf:Bag>
               <rdf:li rdf:parseType="Resource">
                  <pdfaSchema:namespaceURI>http://ns.adobe.com/xap/1.0/mm/</pdfaSchema:namespaceURI>
                  <pdfaSchema:prefix>xmpMM</pdfaSchema:prefix>
                  <pdfaSchema:schema>XMP Media Management Schema</pdfaSchema:schema>
                  <pdfaSchema:property>
                     <rdf:Seq>
                        <rdf:li rdf:parseType="Resource">
                           <pdfaProperty:category>internal</pdfaProperty:category>
                           <pdfaProperty:description>UUID based identifier for specific incarnation of a document</pdfaProperty:description>
                           <pdfaProperty:name>InstanceID</pdfaProperty:name>
                           <pdfaProperty:valueType>URI</pdfaProperty:valueType>
                        </rdf:li>
                        <rdf:li rdf:parseType="Resource">
                           <pdfaProperty:category>internal</pdfaProperty:category>
                           <pdfaProperty:description>The common identifier for all versions and renditions of a document.</pdfaProperty:description>
                           <pdfaProperty:name>OriginalDocumentID</pdfaProperty:name>
                           <pdfaProperty:valueType>URI</pdfaProperty:valueType>
                        </rdf:li>
                     </rdf:Seq>
                  </pdfaSchema:property>
               </rdf:li>
               <rdf:li rdf:parseType="Resource">
                  <pdfaSchema:namespaceURI>http://ns.adobe.com/pdf/1.3/</pdfaSchema:namespaceURI>
                  <pdfaSchema:prefix>pdf</pdfaSchema:prefix>
                  <pdfaSchema:schema>Adobe PDF Schema</pdfaSchema:schema>
                  <pdfaSchema:property>
                     <rdf:Seq>
                        <rdf:li rdf:parseType="Resource">
                           <pdfaProperty:category>internal</pdfaProperty:category>
                           <pdfaProperty:description>A name object indicating whether the document has been modified to include trapping information</pdfaProperty:description>
                           <pdfaProperty:name>Trapped</pdfaProperty:name>
                           <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                        </rdf:li>
                     </rdf:Seq>
                  </pdfaSchema:property>
               </rdf:li>
               <rdf:li rdf:parseType="Resource">
                  <pdfaSchema:namespaceURI>http://www.aiim.org/pdfa/ns/id/</pdfaSchema:namespaceURI>
                  <pdfaSchema:prefix>pdfaid</pdfaSchema:prefix>
                  <pdfaSchema:schema>PDF/A ID Schema</pdfaSchema:schema>
                  <pdfaSchema:property>
                     <rdf:Seq>
                        <rdf:li rdf:parseType="Resource">
                           <pdfaProperty:category>internal</pdfaProperty:category>
                           <pdfaProperty:description>Part of PDF/A standard</pdfaProperty:description>
                           <pdfaProperty:name>part</pdfaProperty:name>
                           <pdfaProperty:valueType>Integer</pdfaProperty:valueType>
                        </rdf:li>
                        <rdf:li rdf:parseType="Resource">
                           <pdfaProperty:category>internal</pdfaProperty:category>
                           <pdfaProperty:description>Amendment of PDF/A standard</pdfaProperty:description>
                           <pdfaProperty:name>amd</pdfaProperty:name>
                           <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                        </rdf:li>
                        <rdf:li rdf:parseType="Resource">
                           <pdfaProperty:category>internal</pdfaProperty:category>
                           <pdfaProperty:description>Conformance level of PDF/A standard</pdfaProperty:description>
                           <pdfaProperty:name>conformance</pdfaProperty:name>
                           <pdfaProperty:valueType>Text</pdfaProperty:valueType>
                        </rdf:li>
                     </rdf:Seq>
                  </pdfaSchema:property>
               </rdf:li>
            </rdf:Bag>
         </pdfaExtension:schemas>
      </rdf:Description>
   </rdf:RDF>
</x:xmpmeta>
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                                                                                                    
                           
<?xpacket end="w"?>
`));

  doc.target.update.catalog!.Metadata = metadata;

  const rgb = doc.target.createStream(Buffer.from("00000c484c696e6f021000006d6e74725247422058595a2007ce00020009000600310000616373704d5346540000000049454320735247420000000000000000000000000000f6d6000100000000d32d4850202000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001163707274000001500000003364657363000001840000006c77747074000001f000000014626b707400000204000000147258595a00000218000000146758595a0000022c000000146258595a0000024000000014646d6e640000025400000070646d6464000002c400000088767565640000034c0000008676696577000003d4000000246c756d69000003f8000000146d6561730000040c0000002474656368000004300000000c725452430000043c0000080c675452430000043c0000080c625452430000043c0000080c7465787400000000436f70797269676874202863292031393938204865776c6574742d5061636b61726420436f6d70616e790000646573630000000000000012735247422049454336313936362d322e31000000000000000000000012735247422049454336313936362d322e31000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000058595a20000000000000f35100010000000116cc58595a200000000000000000000000000000000058595a200000000000006fa2000038f50000039058595a2000000000000062990000b785000018da58595a2000000000000024a000000f840000b6cf64657363000000000000001649454320687474703a2f2f7777772e6965632e636800000000000000000000001649454320687474703a2f2f7777772e6965632e63680000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064657363000000000000002e4945432036313936362d322e312044656661756c742052474220636f6c6f7572207370616365202d207352474200000000000000000000002e4945432036313936362d322e312044656661756c742052474220636f6c6f7572207370616365202d20735247420000000000000000000000000000000000000000000064657363000000000000002c5265666572656e63652056696577696e6720436f6e646974696f6e20696e2049454336313936362d322e3100000000000000000000002c5265666572656e63652056696577696e6720436f6e646974696f6e20696e2049454336313936362d322e31000000000000000000000000000000000000000000000000000076696577000000000013a4fe00145f2e0010cf140003edcc0004130b00035c9e0000000158595a2000000000004c09560050000000571fe76d6561730000000000000001000000000000000000000000000000000000028f0000000273696720000000004352542063757276000000000000040000000005000a000f00140019001e00230028002d00320037003b00400045004a004f00540059005e00630068006d00720077007c00810086008b00900095009a009f00a400a900ae00b200b700bc00c100c600cb00d000d500db00e000e500eb00f000f600fb01010107010d01130119011f0125012b01320138013e0145014c0152015901600167016e0175017c0183018b0192019a01a101a901b101b901c101c901d101d901e101e901f201fa0203020c0214021d0226022f02380241024b0254025d02670271027a0284028e029802a202ac02b602c102cb02d502e002eb02f50300030b03160321032d03380343034f035a03660372037e038a039603a203ae03ba03c703d303e003ec03f9040604130420042d043b0448045504630471047e048c049a04a804b604c404d304e104f004fe050d051c052b053a05490558056705770586059605a605b505c505d505e505f6060606160627063706480659066a067b068c069d06af06c006d106e306f507070719072b073d074f076107740786079907ac07bf07d207e507f8080b081f08320846085a086e0882089608aa08be08d208e708fb09100925093a094f09640979098f09a409ba09cf09e509fb0a110a270a3d0a540a6a0a810a980aae0ac50adc0af30b0b0b220b390b510b690b800b980bb00bc80be10bf90c120c2a0c430c5c0c750c8e0ca70cc00cd90cf30d0d0d260d400d5a0d740d8e0da90dc30dde0df80e130e2e0e490e640e7f0e9b0eb60ed20eee0f090f250f410f5e0f7a0f960fb30fcf0fec1009102610431061107e109b10b910d710f511131131114f116d118c11aa11c911e81207122612451264128412a312c312e31303132313431363138313a413c513e5140614271449146a148b14ad14ce14f01512153415561578159b15bd15e0160316261649166c168f16b216d616fa171d17411765178917ae17d217f7181b18401865188a18af18d518fa19201945196b199119b719dd1a041a2a1a511a771a9e1ac51aec1b141b3b1b631b8a1bb21bda1c021c2a1c521c7b1ca31ccc1cf51d1e1d471d701d991dc31dec1e161e401e6a1e941ebe1ee91f131f3e1f691f941fbf1fea20152041206c209820c420f0211c2148217521a121ce21fb22272255228222af22dd230a23382366239423c223f0241f244d247c24ab24da250925382568259725c725f726272657268726b726e827182749277a27ab27dc280d283f287128a228d429062938296b299d29d02a022a352a682a9b2acf2b022b362b692b9d2bd12c052c392c6e2ca22cd72d0c2d412d762dab2de12e162e4c2e822eb72eee2f242f5a2f912fc72ffe3035306c30a430db3112314a318231ba31f2322a3263329b32d4330d3346337f33b833f1342b3465349e34d83513354d358735c235fd3637367236ae36e937243760379c37d738143850388c38c839053942397f39bc39f93a363a743ab23aef3b2d3b6b3baa3be83c273c653ca43ce33d223d613da13de03e203e603ea03ee03f213f613fa23fe24023406440a640e74129416a41ac41ee4230427242b542f7433a437d43c044034447448a44ce45124555459a45de4622466746ab46f04735477b47c04805484b489148d7491d496349a949f04a374a7d4ac44b0c4b534b9a4be24c2a4c724cba4d024d4a4d934ddc4e254e6e4eb74f004f494f934fdd5027507150bb51065150519b51e65231527c52c75313535f53aa53f65442548f54db5528557555c2560f565c56a956f75744579257e0582f587d58cb591a596959b85a075a565aa65af55b455b955be55c355c865cd65d275d785dc95e1a5e6c5ebd5f0f5f615fb36005605760aa60fc614f61a261f56249629c62f06343639763eb6440649464e9653d659265e7663d669266e8673d679367e9683f689668ec6943699a69f16a486a9f6af76b4f6ba76bff6c576caf6d086d606db96e126e6b6ec46f1e6f786fd1702b708670e0713a719571f0724b72a67301735d73b87414747074cc7528758575e1763e769b76f8775677b37811786e78cc792a798979e77a467aa57b047b637bc27c217c817ce17d417da17e017e627ec27f237f847fe5804780a8810a816b81cd8230829282f4835783ba841d848084e3854785ab860e867286d7873b879f8804886988ce8933899989fe8a648aca8b308b968bfc8c638cca8d318d988dff8e668ece8f368f9e9006906e90d6913f91a89211927a92e3934d93b69420948a94f4955f95c99634969f970a977597e0984c98b89924999099fc9a689ad59b429baf9c1c9c899cf79d649dd29e409eae9f1d9f8b9ffaa069a0d8a147a1b6a226a296a306a376a3e6a456a4c7a538a5a9a61aa68ba6fda76ea7e0a852a8c4a937a9a9aa1caa8fab02ab75abe9ac5cacd0ad44adb8ae2daea1af16af8bb000b075b0eab160b1d6b24bb2c2b338b3aeb425b49cb513b58ab601b679b6f0b768b7e0b859b8d1b94ab9c2ba3bbab5bb2ebba7bc21bc9bbd15bd8fbe0abe84beffbf7abff5c070c0ecc167c1e3c25fc2dbc358c3d4c451c4cec54bc5c8c646c6c3c741c7bfc83dc8bcc93ac9b9ca38cab7cb36cbb6cc35ccb5cd35cdb5ce36ceb6cf37cfb8d039d0bad13cd1bed23fd2c1d344d3c6d449d4cbd54ed5d1d655d6d8d75cd7e0d864d8e8d96cd9f1da76dafbdb80dc05dc8add10dd96de1cdea2df29dfafe036e0bde144e1cce253e2dbe363e3ebe473e4fce584e60de696e71fe7a9e832e8bce946e9d0ea5beae5eb70ebfbec86ed11ed9cee28eeb4ef40efccf058f0e5f172f1fff28cf319f3a7f434f4c2f550f5def66df6fbf78af819f8a8f938f9c7fa57fae7fb77fc07fc98fd29fdbafe4bfedcff6dffff", "hex"));
  rgb.set("N", doc.target.createNumber(3));
  rgb.set("Range", doc.target.createArray(
    doc.target.createNumber(0), doc.target.createNumber(1),
    doc.target.createNumber(0), doc.target.createNumber(1),
    doc.target.createNumber(0), doc.target.createNumber(1),
  ));

  const outputIntents = doc.target.createArray(
    doc.target.createDictionary(
      ["DestOutputProfile", rgb.makeIndirect()],
      ["Info", doc.target.createString("sRGB IEC61966-2.1")],
      ["OutputCondition", doc.target.createString("sRGB")],
      ["OutputConditionIdentifier", doc.target.createString("Custom")],
      ["RegistryName", doc.target.createString("")],
      ["S", doc.target.createName("GTS_PDFA1")],
      ["Type", doc.target.createName("OutputIntent")],
    )
  );
  doc.target.update.catalog!.OutputIntents = outputIntents.makeIndirect();


  (doc.target.update.xref as any).set("ID", doc.target.createArray(
    doc.target.createHexString(Convert.FromHex("72DF99E9FA2D34488694317BED27C5DB")),
    doc.target.createHexString(Convert.FromHex("42D281D9E6C7FA419393A29183E62767")),
  ));

  metadata.set("Subtype", doc.target.createName("XML"));
  metadata.set("Type", doc.target.createName("Metadata"));


  let c = 0;
  while (++c < 2) {
    const page = doc.pages.create();
    const image = doc.createImage(fs.readFileSync(`/Users/microshine/Downloads/page-${c} (2).jpg`));
    page.graphics()
      .translate("0", "0")
      .drawImage(image, page.width, page.height);

    page.addSignatureBox({
      top: 10,
      left: 10,
      width: 400,
      height: 100,
      backgroundColor: [.5]
    });
  }

  const pdf = await doc.save();

  writeFile(pdf);
});


it("info", async () => {
  const doc = await PDFDocument.load(fs.readFileSync("/Users/microshine/Downloads/5_Тестовый документ_подписание_ФР/5_Т•бвЃҐл© §Ѓ™гђ•≠в_ѓЃ§ѓ®б†≠®•_ФР.pdf"));
  const log = await doc.target.toString();

  const strm = doc.target.getObject(3).value;
  assert.ok(strm instanceof core.PDFStream);
  const buf = await strm.decode();
  console.log(Convert.ToHex(buf));

  const box = doc.getSignatures() as SignatureBox[];
  const signature = new Uint8Array(box[0].getGroup().target.V!.Contents.toArrayBuffer());
  const content = box[0].getGroup().getContent();
  fs.writeFileSync("/Users/microshine/Downloads/gost.pdf.p7s", signature.subarray(0, 35254));
  fs.writeFileSync("/Users/microshine/Downloads/gost.pdf", content);

  fs.writeFileSync("/Users/microshine/Downloads/gost.log", log);
});

it("create document for encryption", async () => {
  const doc = await PDFDocument.create({
    version: PDFVersion.v1_5,
    useXrefTable: true,
  });
  const page = doc.pages.create();
  page.content
    .setColor(0.5)
    .drawRectangle(10, 10, 40, 40)
    .fill();

  page.target.set("LiteralString", doc.target.createString("Literal string"));
  page.target.set("HexString", doc.target.createHexString(Buffer.from("Hex string")));

  const pdf = await doc.save();
  writeFile(pdf);
});

it("read encrypted doc", async () => {
  pkijs.setEngine("PDF", new core.PDFCryptoEngine({
    name: "PDF",
    crypto: new Crypto(),
  }));

  // const path = "/Users/microshine/github/pv/pdf/resources/standard_encryption_view.pdf"; // Error: Not implemented
  // const path = "/Users/microshine/github/pv/pdf/resources/standard_encryption_edit.pdf";
  const path = "/Users/microshine/tmp/pdf-test/pdf/application_form_english.1.pdf";
  // const path = "/Users/microshine/Downloads/pdf-example-password.original.pdf";
  // const path = "/Users/microshine/Downloads/passphrase - Stephen Davidson Water Boat Sky Cloud.pdf";
  // const path = "/Users/microshine/Downloads/DiplomaRequestForm (2).pdf";

  const doc = await PDFDocument.load(fs.readFileSync(path));

  // const box = doc.getComponentById(388);
  // assert.ok(box instanceof TextEditor);

  // // Null
  // console.log(box.target.AP.get().get("N").toString());

  // // Null -> Dictionary
  // box.target.AP.get().get("N", PDFDictionary);
  // console.log(box.target.AP.get().get("N").toString());

  // box.width = 300;


  doc.target.options.password = {
    owner: "1234567890",
  };

  const handler = doc.target.encryptHandler;
  assert.ok(handler instanceof core.StandardEncryptionHandler);
  const o = handler.dictionary.O.toArrayBuffer();
  const u = BufferSourceConverter.toUint8Array(handler.dictionary.U.toArrayBuffer());
  // handler.checkOwnerPassword(Convert.FromUtf8String("1234567890"), o, u, u);

  // const o = doc.target.getObject(3).value;
  // assert.ok(o instanceof PDFDictionary);
  // const da = o.get("DA", PDFTextString);

  // console.log(Convert.FromBinary(da.text));
  // console.log(await da.decode());
  // console.log(Convert.FromBinary(await da.encode()));

  await doc.target.decrypt();

  const p = doc.pages.create();
  p.addTextEditor({
    left: 10,
    top: 10,
    width: 200,
    height: 40,
    text: "Hello world",
  });

  doc.target.encrypt();

  const pdf = await doc.save();
  writeFile(pdf);

  const doc2 = await PDFDocument.load(pdf);
  doc2.target.options.password = {
    user: "1234567890",
  };

  await doc2.target.decrypt();
});

it("create encrypted document", async () => {
  const crypto = new Crypto();

  pkijs.setEngine("PDF", new core.PDFCryptoEngine({
    name: "PDF",
    crypto,
  }));

  const doc = await PDFDocument.create({
    useXrefTable: true,
  });
  const page = doc.pages.create();
  page.addCheckBox({
    left: 10,
    top: 10,
  });

  const password = "1234567890";
  doc.crypto = crypto;
  doc.target.options.password = {
    owner: password,
  };
  const xref = doc.target.update.xref;
  assert.ok(xref instanceof PDFDictionary);

  const enc = new StandardEncryptionHandler(core.StandardEncryptDictionary.create(doc.target));
  enc.crypto = pkijs.getCrypto(true);
  const params = await enc.makeGlobalCryptoParameters({
    ownerPassword: Convert.FromUtf8String(password),
    revision: 4,
    keyLength: 128,
    algorithmType: "AES",
    permission: -1084,
  });
  xref.Encrypt = params.dictionary.makeIndirect();

  xref.set("ID", doc.target.createArray(
    doc.target.createHexString(params.id),
    doc.target.createHexString(params.id),
  ));

  // const encrypt = StandardEncryptDictionary.create(doc.target).makeIndirect();
  // encrypt.cf = doc.target.createDictionary(
  //   ["StdCF", doc.target.createDictionary(
  //     ["AuthEvent", doc.target.createName("DocOpen")],
  //     ["CFM", doc.target.createName("AESV2")],
  //     ["Length", doc.target.createNumber(16)],
  //   )],
  // );

  // encrypt.set("Filter", doc.target.createName("Standard"));
  // encrypt.set("Length", doc.target.createNumber(128));
  // encrypt.set("O", doc.target.createString(Convert.ToBinary(crypto.getRandomValues(new Uint8Array(32)))));
  // encrypt.set("P", doc.target.createNumber(-1084));
  // encrypt.set("R", doc.target.createNumber(4));
  // encrypt.set("StmF", doc.target.createName("StdCF"));
  // encrypt.set("StrF", doc.target.createName("StdCF"));
  // encrypt.set("U", doc.target.createString(Convert.ToBinary(crypto.getRandomValues(new Uint8Array(32)))));
  // encrypt.set("V", doc.target.createNumber(4));

  // xref.Encrypt = encrypt;

  await doc.target.encrypt();

  const pdf = await doc.save();
  writeFile(pdf);
});
