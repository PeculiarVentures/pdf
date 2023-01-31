import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import * as core from "@peculiarventures/pdf-core";
import { PDFDocument, PDFDocumentCreateParameters, PDFDocumentLoadParameters, PDFVersion } from "./Document";
import { CheckBox, RadioButtonGroup, TextEditor } from "./Form";
import { X509Certificate } from "@peculiar/x509";

export function writeFile(data: BufferSource, name = "tmp"): void {
  const filePath = path.resolve(__dirname, `../../../${name}.pdf`);
  fs.writeFileSync(filePath, Buffer.from(BufferSourceConverter.toArrayBuffer(data)), { flag: "w+" });
}

context("Document", () => {

  context("Create", () => {
    it("Create an empty PDF file", async () => {
      const doc = await PDFDocument.create({
        version: PDFVersion.v1_3,
      });

      assert.strictEqual(doc.pages.length, 0);
    });
    it("Create a PDF file with 1 page", async () => {
      const doc = await PDFDocument.create();

      const page = doc.pages.create();

      // writeFile(await doc.save());

      assert.strictEqual(doc.pages.length, 1);
    });
  });

  context("Components", () => {

    it("Get Checkbox by name", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const checkBox1 = page.addCheckBox({
        top: "5mm",
        left: "5mm",
        enabled: false,
      });
      const checkBox2 = page.addCheckBox({
        top: "5mm",
        left: checkBox1.left + checkBox1.width + 2,
        enabled: true,
      });

      let pdf = await doc.save();

      const doc2 = await PDFDocument.load(pdf);
      const components = doc2.getComponents();

      assert.strictEqual(components[0].name, checkBox1.name);
      assert.strictEqual(components[1].name, checkBox2.name);

      const checkBox = components[0];
      assert.ok(checkBox instanceof CheckBox);
      checkBox.checked = true;

      const checkBoxByName = doc2.getComponentByName(checkBox1.name);
      assert.ok(checkBoxByName instanceof CheckBox);

      pdf = await doc2.save();
      writeFile(pdf);
    });

    it("Get TextBox by name", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });
      const font = doc.addFont();

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const textBox = page.addTextEditor({
        top: "5mm",
        left: "5mm",
        text: "Hello",
        font,
        width: "2cm",
        height: "2cm",
      });

      let pdf = await doc.save();
      writeFile(pdf);

      const doc2 = await PDFDocument.load(pdf);
      const components = doc2.getComponents();

      assert.strictEqual(components[0].name, textBox.name);

      const textBoxByName = components[0];
      assert.ok(textBoxByName instanceof TextEditor);
      textBoxByName.left = "20mm";

      pdf = await doc2.save();
      writeFile(pdf);
    });

    it("Get RadioButtonGroup", async () => {
      const doc = await PDFDocument.create({
        useXrefTable: true,
        disableCompressedStreams: true,
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const rb1 = page.addRadioButton({
        top: "5mm",
        left: "5mm",
        value: "value1",
      });
      const rb2 = page.addRadioButton({
        group: rb1.name,
        top: "5mm",
        left: rb1.left + rb1.width + 2,
        value: "value2",
      });

      let pdf = await doc.save();
      writeFile(pdf);

      const doc2 = await PDFDocument.load(pdf);
      const components = doc2.getComponents();

      assert.strictEqual(components[0].name, rb1.name);

      const rbGroupByName = doc2.getComponentByName(rb1.name);
      assert.ok(rbGroupByName instanceof RadioButtonGroup);
      assert.strictEqual(rbGroupByName.length, 2);
      assert.strictEqual(rbGroupByName.selected, rb1.value);

      const item = rbGroupByName.get(1);
      item.checked = true;

      assert.strictEqual(rbGroupByName.selected, rb2.value);

      pdf = await doc2.save();
      writeFile(pdf);
    });

  });

  context("encryption", () => {

    const tests: {
      name: string;
      params: PDFDocumentCreateParameters;
      save?: boolean;
    }[] = [
        {
          name: "RC4",
          params: {
            algorithm: "RC4",
            userPassword: "12345",
          },
        },
        {
          name: "AES128",
          params: {
            algorithm: "AES128",
            userPassword: "12345",
          },
        },
        {
          name: "AES256",
          params: {
            algorithm: "AES256",
            userPassword: "12345",
          },
        },
        {
          name: "Public key RSA2048 + AS256",
          params: {
            algorithm: "AES256",
            recipients: [
              new X509Certificate("MIIDYjCCAkqgAwIBAgIKfLPvDVZqwJmrrDANBgkqhkiG9w0BAQsFADBfMRcwFQYDVQQDEw5BY3JvYmF0IFJTQSBJRDEJMAcGA1UEChMAMQkwBwYDVQQLEwAxITAfBgkqhkiG9w0BCQEWEm1pY3Jvc2hpbmVAbWFpbC5ydTELMAkGA1UEBhMCVVMwHhcNMjMwMTI2MTIwMzA2WhcNMjgwMTI2MTIwMzA2WjBfMRcwFQYDVQQDEw5BY3JvYmF0IFJTQSBJRDEJMAcGA1UEChMAMQkwBwYDVQQLEwAxITAfBgkqhkiG9w0BCQEWEm1pY3Jvc2hpbmVAbWFpbC5ydTELMAkGA1UEBhMCVVMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7WqzEg2jPbImxVV/tSJQbalHfywf4rzUOjVLY5w4Fs5CHEOPvj25vBymLywwP6Qrd6Tor14pon9hEiVG3pV2HBBduCfHVi2Sbe00/t6ENYbDrlHyxaHUttAcdH94hFawnhAy2ad4ZdsyShub5Vdd3jTE0/5gPar5RuMpH4JKCxzaj47nWKNRunLuBadybP4JEj2DZvrS9Ci8erlP3f7+fXM8Vt7rmlkFoKF74JDaw+hBDDzg2DX4abK0XCTFF0HhBlnjnCU+0mhOpa5hkbH3qhbYfbNoAtuDw5g0y3JcYZLzSnikaqC4j8Qq1Q1FQa7zbZeHh77GNG2wTVsvNouJZAgMBAAGjIDAeMA8GCSqGSIb3LwEBCgQCBQAwCwYDVR0PBAQDAgOYMA0GCSqGSIb3DQEBCwUAA4IBAQBsaEfb1dYL870/lfC2/4RMdcUVanytiUz3cQorDuKf/o538KtjpWsPv57pfeNM6rpiwwD5eOARvbHZCsNApxbAIZ1z2WOq6ws9i1e+o7bbgqkGAx8FJVxaZCbrW3OCmX6jxMynUislR+s8kxK7X81WNYa3IbaE7ZgKA3407hOD3Ensns738GkaLfpTQ95xckO/cE0bBkL/WWZHwoH0iYwEHdMSLeC21EGrnBNH1HO8iD+h+bBnNbzHpjaZqKKeK269GXJFr7C7tjQE+lCDB6+G3rygnUxSBghWfYVJQsmL6EIt2CHuOFnA6Li+b4CGDFuEJf5FQt2w70k2OL+gyIP3"),
            ],
          }
        }
      ];

    for (const t of tests) {
      it(t.name, async () => {
        const doc = await PDFDocument.create(t.params);

        const page = doc.pages.create();
        const checkBox = page.addCheckBox({
          left: 10,
          top: 10,
        });

        let pdf = await doc.save();
        writeFile(pdf);

        checkBox.checked = true;

        pdf = await doc.save();
        if (t.save) {
          writeFile(pdf);
        }

        const params: PDFDocumentLoadParameters = {};
        if ("userPassword" in t.params) {
          const userPassword = t.params.userPassword;
          params.onUserPassword = async (reason) => {
            if (reason === core.PasswordReason.incorrect) {
              throw new Error("Incorrect password");
            }
            assert.ok("algorithm" in t.params);

            return userPassword || "";
          };
        }
        if ("recipients" in t.params) {
          const certificate = t.params.recipients[0];
          params.onCertificate = async () => {
            return {
              certificate,
              key: Convert.FromBase64("MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7WqzEg2jPbImxVV/tSJQbalHfywf4rzUOjVLY5w4Fs5CHEOPvj25vBymLywwP6Qrd6Tor14pon9hEiVG3pV2HBBduCfHVi2Sbe00/t6ENYbDrlHyxaHUttAcdH94hFawnhAy2ad4ZdsyShub5Vdd3jTE0/5gPar5RuMpH4JKCxzaj47nWKNRunLuBadybP4JEj2DZvrS9Ci8erlP3f7+fXM8Vt7rmlkFoKF74JDaw+hBDDzg2DX4abK0XCTFF0HhBlnjnCU+0mhOpa5hkbH3qhbYfbNoAtuDw5g0y3JcYZLzSnikaqC4j8Qq1Q1FQa7zbZeHh77GNG2wTVsvNouJZAgMBAAECggEAM29JTwnklE1v38dYdoQeZQhjQdUzcwpmvn/95p5IMziAzRPN/86YutJ0jXRI83U/Dn0hAzhBP0fiz64DSS+U5aQx6nvAcKe8DxNiucNn64yOTZ6OPQY4ZTuvWEePa/XPNWoDM3ENEGCU+QUgFAOFC8UvZSVmUZU0eqsInYMBtfUR0MHq5hMDP2HaFRTWDh8fvSrasdA0WC6CqBMsUGJnHIW31p0cTnD+zf8cJ1qyzfi8SNVFPTIQjbdkkH8cSGH75JYGPZ5nuNhlNFdSdoJIFpc9I2ZqR2KNcqB0R+pE9Vvg2U0U9mxZ8QCh2sVscsEf09MZYQycJuLFz7yt8PiGoQKBgQDBLegF8oIlbPGOVtulYKIETOx7E7NW+rfR3n7vOnzQUgsa7+rLF/4CCprjUxr7xLrEX/ItwN+q5HNorqWL81SqHooiXA86/s1agKJMFhKaKA983vqdb/515yftptkkeuz32Y25WE02tjK/KYfQV3zofXMeM4CZNVtETIlFs0YSNwKBgQD4R9RhP/7hvWm0S7HpyJlst9sEU7gvFX1Z2yLsfCXF/2RPO+048rd5xhOn8h07tclztGvziwtA1Ka1jgOe11iSSJWTKVwf/WVlFir61feP2w7todUvu+gLHvHRHSpOw7PIUGZm1Km7BgJS5XCAg7loRgCw9FprC9emqNSdPlqn7wKBgEywTbj2seXrnuVz49R+TTNJ2mNtybdQ5uKA4oFUBbKpr1DtR5eCmcrzrNNr7X1fdwl4UWsKc4CjGpHHK18opUa3wvyq8TzpZFp2UHfGF3JtTuCyoGkZybnCn14/61oJFsO58QJQZK7Am9q5wPnbkXG2Q5oMthOcU/QEMkaiScH3AoGBAL4h49aFt58P+r8DqL+ryzKiqarqogYMou4JDvmjKRoztpGnBsexuCgdNDhNBW4QjLF63aCoPnnrX69xjfw6Va3QwBrudYpZ9ygujcOB0A/uZcQ9RpFDiTPbArxtZVTkMe2ZBJKDEWgT9fudkUYZmgbsdOMOfZ+0dfU/HXM9qRcpAoGASIYb2YG7Wk0Wb/RrnpZ5aPEOVfSigHSjlsR7PrhQon7mda2vnL2s4Qit7q6YMSOgBFUSYVEhTZIMKXWXbJx/nlvSxsRrPdVilooDnAsvMHOBuK/eeyIO0KHqklg22DXa2NdVTCKzfsiA2IJFLHhF1KxCznCQiAmdGOj3B4jBwXE="),
              crypto: doc.crypto,
            };
          };
        }

        const doc2 = await PDFDocument.load(pdf, params);
        const checkBox2 = doc2.getComponentById(checkBox.id, 0, CheckBox);
        assert.ok(checkBox2);
        assert.strictEqual(checkBox2.checked, true);

      });
    }

  });

  it("XY coordinates for CheckBox", async () => {
    const doc = await PDFDocument.create({
      useXrefTable: true,
      disableAscii85Encoding: true,
      disableCompressedStreams: true,
    });
    const page = doc.pages.create();
    const checkBox = page.addCheckBox({
      left: 10,
      top: 10,
      width: 100,
    });

    assert.equal(checkBox.left, 10);
    assert.equal(checkBox.top, 10);
    assert.equal(checkBox.width, 100);
    assert.equal(checkBox.height, 18, "Height shall be default 18");
  });

});
