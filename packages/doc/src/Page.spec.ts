import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";
import * as core from "@peculiarventures/pdf-core";
import * as x509 from "@peculiar/x509";
import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";
import { PDFDocument, PDFDocumentCreateParameters } from "./Document";
import { PDFVersion } from "./Version";
import { writeFile } from "./Document.spec";
import { Convert } from "pvtsutils";
import { FontFactory, DefaultFonts } from "@peculiarventures/pdf-font";
import { FormObject } from "./FormObject";
import { SignatureBoxGroup } from "./forms/SignatureBox.Group";
import { SignatureBox } from "./forms/SignatureBox";
import { RadioButton } from "./forms/RadioButton";
import * as cms from "./cms";


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
      page2.addSignatureBox({
        left: "5mm",
        top: "5mm",
        width: "3cm",
        height: "2cm",
        groupName: "stepan",
      });

      page2.addSignatureBox({
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
      page.addSignatureBox({
        groupName: "box2",
      });

      await doc.save();

      const box1 = doc.getComponentByName("box1");
      assert.ok(box1 instanceof SignatureBoxGroup);
      const box2 = doc.getComponentByName("box2");
      assert.ok(box2 instanceof SignatureBoxGroup);

      const boxes = [
        box1,
        // box2,
      ];
      for (const box of boxes) {
        const cn = `CN=${box.name}`;
        await box.sign({
          dictionaryUpdate: async (dict) => {
            dict.subFilter = "adbe.pkcs7.detached";
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
              name: cn,
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
      }

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

    context("Algorithms", () => {
      const rsaKeyGenParams = { publicExponent: new Uint8Array([1, 0, 1]), modulusLength: 2048 };
      const algorithms = [
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-1", ...rsaKeyGenParams },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256", ...rsaKeyGenParams },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384", ...rsaKeyGenParams },
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512", ...rsaKeyGenParams },
        { name: "RSA-PSS", hash: "SHA-1", saltLength: 20, ...rsaKeyGenParams },
        { name: "RSA-PSS", hash: "SHA-256", saltLength: 32, ...rsaKeyGenParams },
        { name: "RSA-PSS", hash: "SHA-384", saltLength: 48, ...rsaKeyGenParams },
        { name: "RSA-PSS", hash: "SHA-512", saltLength: 64, ...rsaKeyGenParams },
      ];
      algorithms.forEach((alg) => {
        it(`Sign with ${alg.name} and ${alg.hash}`, async () => {
          const crypto = new Crypto() as globalThis.Crypto;
          pkijs.setEngine("PDF crypto", crypto, new core.PDFCryptoEngine({ crypto: crypto, subtle: crypto.subtle }));

          const doc = await PDFDocument.create(options);

          assert.strictEqual(doc.pages.length, 0);

          const page = doc.pages.create();
          page.addSignatureBox({
            groupName: "box1",
          });

          await doc.save();

          const box1 = doc.getComponentByName("box1");
          assert.ok(box1 instanceof SignatureBoxGroup);

          const boxes = [
            box1,
          ];
          for (const box of boxes) {
            const cn = `CN=${box.name}`;
            await box.sign({
              dictionaryUpdate: async (dict) => {
                dict.subFilter = "adbe.pkcs7.detached";
                dict.Reason.get().text = "Описание причины";
                dict.Location.get().text = "56.632N 47.928E";
              },
              containerCreate: async (data) => {

                //#region Create certificate
                const keys = await crypto.subtle.generateKey(alg, false, ["sign", "verify"]);
                const cert = await x509.X509CertificateGenerator.createSelfSigned({
                  name: cn,
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
          }

          const pdf = await doc.save();
          // writeFile(pdf, `sign-${alg.name}-${alg.hash}`);

          const doc2 = await PDFDocument.load(pdf);
          const verify = await doc2.verify();
          assert.strictEqual(verify.items.length, 1);
          assert.ok(verify.items[0].states.some(state => state.code === "document_modification" && state.type === "valid"), "Document has been modified");
        });
      });
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

  it("Padding", async () => {
    const doc = await PDFDocument.create(options);

    const page = doc.pages.create({
      width: 200,
      height: 400,
    });

    page.leftPadding = 10;
    page.topPadding = 15;
    page.rightPadding = 20;
    page.bottomPadding = 25;

    assert.strictEqual(page.target.CropBox?.llX, 10);
    assert.strictEqual(page.leftPadding, 10);
    assert.strictEqual(page.target.CropBox?.llY, 25);
    assert.strictEqual(page.bottomPadding, 25);
    assert.strictEqual(page.target.CropBox?.urX, 180);
    assert.strictEqual(page.rightPadding, 20);
    assert.strictEqual(page.target.CropBox?.urY, 385);
    assert.strictEqual(page.topPadding, 15);
  });

});
