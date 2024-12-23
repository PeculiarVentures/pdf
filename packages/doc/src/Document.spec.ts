/* eslint-disable no-sparse-arrays */
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { X509Certificate } from "@peculiar/x509";
import * as core from "@peculiarventures/pdf-core";
import { PageFilter } from "@peculiarventures/pdf-copy";
import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";

import {
  PDFDocument,
  PDFDocumentCreateParameters,
  PDFDocumentLoadParameters
} from "./Document";
import { PDFVersion } from "./Version";
import { TextEditor } from "./forms/TextEditor";
import { RadioButtonGroup } from "./forms/RadioButton.Group";
import { CheckBox } from "./forms/CheckBox";
import { SignatureBox } from "./forms/SignatureBox";
import { SignatureBoxGroup } from "./forms/SignatureBox.Group";
import {
  PdfRenderingHelper,
  xrefTableOptions
} from "@peculiarventures/pdf-tests";

describe("Document", () => {
  describe("Create", () => {
    it("Create an empty PDF file", async () => {
      const doc = await PDFDocument.create();
      expect(doc.pages.length).toBe(0);

      // NOTE: Acrobat Reader does not open such document. It requires at least one page.

      const raw = await doc.save();
      const doc2 = await PDFDocument.load(raw);
      expect(doc2.pages.length).toBe(0);
      expect(doc2.version).toBe(PDFVersion.v2_0);
    });

    it("Create a PDF file with 1 page", async () => {
      const doc = await PDFDocument.create();

      doc.pages.create();
      expect(doc.pages.length).toBe(1);

      const raw = await doc.save();
      writeFile(raw);

      const hash = await PdfRenderingHelper.getPageHash(raw, 1);
      expect(hash).toBe(
        "f724162d629d671000f9dcaf9e81be20f45f8060b5f84b4a5d5b9794e096595e"
      );
    });
  });

  describe("Components", () => {
    it("Draw", async () => {
      const doc = await PDFDocument.create(xrefTableOptions);
      const page = doc.pages.create();

      const checkBox1 = page.addCheckBox({
        top: "5mm",
        left: "5mm",
        enabled: false
      });
      page.addCheckBox({
        top: "5mm",
        left: checkBox1.left + checkBox1.width + 2,
        enabled: true
      });

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "93dc2ba7f8942d0a934035f603eac0f38cedd90526fd9e658006617c2337cef3"
      );
    });

    it("Draw and transform", async () => {
      const doc = await PDFDocument.create(xrefTableOptions);
      const page = doc.pages.create();

      let checkBox1 = page.addCheckBox({
        name: "checkBox1",
        top: "5mm",
        left: "5mm",
        enabled: false
      });
      page.addCheckBox({
        name: "checkBox2",
        top: "5mm",
        left: checkBox1.left + checkBox1.width + 2,
        enabled: true
      });

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "93dc2ba7f8942d0a934035f603eac0f38cedd90526fd9e658006617c2337cef3"
      );

      const doc2 = await PDFDocument.load(pdf);
      const component = doc2.getComponentByName("checkBox1");
      checkBox1 = component as CheckBox;

      // Move the checkbox
      checkBox1.top += core.TypographyConverter.toPoint("5mm");
      checkBox1.left += core.TypographyConverter.toPoint("5mm");

      // Resize the checkbox
      checkBox1.width = core.TypographyConverter.toPoint("10mm");
      checkBox1.height = core.TypographyConverter.toPoint("10mm");

      const pdf2 = await doc2.save();
      const pageHash2 = await PdfRenderingHelper.getPageHash(pdf2, 1);
      expect(pageHash2).toBe("f4b3c2d2b");
    });

    it("Get Checkbox by name", async () => {
      const doc = await PDFDocument.create(xrefTableOptions);
      const page = doc.pages.create();

      const checkBox1 = page.addCheckBox({
        top: "5mm",
        left: "5mm",
        enabled: false
      });
      const checkBox2 = page.addCheckBox({
        top: "5mm",
        left: checkBox1.left + checkBox1.width + 2,
        enabled: true
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
        disableCompressedStreams: true
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
        height: "2cm"
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
        disableCompressedStreams: true
      });

      assert.strictEqual(doc.pages.length, 0);

      const page = doc.pages.create();

      const rb1 = page.addRadioButton({
        top: "5mm",
        left: "5mm",
        value: "value1"
      });
      const rb2 = page.addRadioButton({
        group: rb1.name,
        top: "5mm",
        left: rb1.left + rb1.width + 2,
        value: "value2"
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

  describe("encryption", () => {
    const userPassword = "12345";
    const useXrefTable = false;
    const save = false;

    const tests: {
      name: string;
      params: PDFDocumentCreateParameters;
      save?: boolean;
    }[] = [
      {
        name: "RC4",
        save,
        params: {
          algorithm: "RC4",
          userPassword,
          useXrefTable
        }
      },
      {
        name: "AES128",
        save,
        params: {
          algorithm: "AES128",
          userPassword,
          useXrefTable
        }
      },
      {
        name: "AES256",
        save,
        params: {
          algorithm: "AES256",
          userPassword,
          useXrefTable
        }
      },
      {
        name: "Public key RSA2048 + AS256",
        save,
        params: {
          algorithm: "AES256",
          useXrefTable,
          recipients: [
            new X509Certificate(
              "MIIDYjCCAkqgAwIBAgIKfLPvDVZqwJmrrDANBgkqhkiG9w0BAQsFADBfMRcwFQYDVQQDEw5BY3JvYmF0IFJTQSBJRDEJMAcGA1UEChMAMQkwBwYDVQQLEwAxITAfBgkqhkiG9w0BCQEWEm1pY3Jvc2hpbmVAbWFpbC5ydTELMAkGA1UEBhMCVVMwHhcNMjMwMTI2MTIwMzA2WhcNMjgwMTI2MTIwMzA2WjBfMRcwFQYDVQQDEw5BY3JvYmF0IFJTQSBJRDEJMAcGA1UEChMAMQkwBwYDVQQLEwAxITAfBgkqhkiG9w0BCQEWEm1pY3Jvc2hpbmVAbWFpbC5ydTELMAkGA1UEBhMCVVMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7WqzEg2jPbImxVV/tSJQbalHfywf4rzUOjVLY5w4Fs5CHEOPvj25vBymLywwP6Qrd6Tor14pon9hEiVG3pV2HBBduCfHVi2Sbe00/t6ENYbDrlHyxaHUttAcdH94hFawnhAy2ad4ZdsyShub5Vdd3jTE0/5gPar5RuMpH4JKCxzaj47nWKNRunLuBadybP4JEj2DZvrS9Ci8erlP3f7+fXM8Vt7rmlkFoKF74JDaw+hBDDzg2DX4abK0XCTFF0HhBlnjnCU+0mhOpa5hkbH3qhbYfbNoAtuDw5g0y3JcYZLzSnikaqC4j8Qq1Q1FQa7zbZeHh77GNG2wTVsvNouJZAgMBAAGjIDAeMA8GCSqGSIb3LwEBCgQCBQAwCwYDVR0PBAQDAgOYMA0GCSqGSIb3DQEBCwUAA4IBAQBsaEfb1dYL870/lfC2/4RMdcUVanytiUz3cQorDuKf/o538KtjpWsPv57pfeNM6rpiwwD5eOARvbHZCsNApxbAIZ1z2WOq6ws9i1e+o7bbgqkGAx8FJVxaZCbrW3OCmX6jxMynUislR+s8kxK7X81WNYa3IbaE7ZgKA3407hOD3Ensns738GkaLfpTQ95xckO/cE0bBkL/WWZHwoH0iYwEHdMSLeC21EGrnBNH1HO8iD+h+bBnNbzHpjaZqKKeK269GXJFr7C7tjQE+lCDB6+G3rygnUxSBghWfYVJQsmL6EIt2CHuOFnA6Li+b4CGDFuEJf5FQt2w70k2OL+gyIP3"
            )
          ]
        }
      }
    ];

    for (const t of tests) {
      it(t.name, async () => {
        const doc = await PDFDocument.create(t.params);

        const page = doc.pages.create();
        const checkBox = page.addCheckBox({
          left: 10,
          top: 10
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
              key: Convert.FromBase64(
                "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7WqzEg2jPbImxVV/tSJQbalHfywf4rzUOjVLY5w4Fs5CHEOPvj25vBymLywwP6Qrd6Tor14pon9hEiVG3pV2HBBduCfHVi2Sbe00/t6ENYbDrlHyxaHUttAcdH94hFawnhAy2ad4ZdsyShub5Vdd3jTE0/5gPar5RuMpH4JKCxzaj47nWKNRunLuBadybP4JEj2DZvrS9Ci8erlP3f7+fXM8Vt7rmlkFoKF74JDaw+hBDDzg2DX4abK0XCTFF0HhBlnjnCU+0mhOpa5hkbH3qhbYfbNoAtuDw5g0y3JcYZLzSnikaqC4j8Qq1Q1FQa7zbZeHh77GNG2wTVsvNouJZAgMBAAECggEAM29JTwnklE1v38dYdoQeZQhjQdUzcwpmvn/95p5IMziAzRPN/86YutJ0jXRI83U/Dn0hAzhBP0fiz64DSS+U5aQx6nvAcKe8DxNiucNn64yOTZ6OPQY4ZTuvWEePa/XPNWoDM3ENEGCU+QUgFAOFC8UvZSVmUZU0eqsInYMBtfUR0MHq5hMDP2HaFRTWDh8fvSrasdA0WC6CqBMsUGJnHIW31p0cTnD+zf8cJ1qyzfi8SNVFPTIQjbdkkH8cSGH75JYGPZ5nuNhlNFdSdoJIFpc9I2ZqR2KNcqB0R+pE9Vvg2U0U9mxZ8QCh2sVscsEf09MZYQycJuLFz7yt8PiGoQKBgQDBLegF8oIlbPGOVtulYKIETOx7E7NW+rfR3n7vOnzQUgsa7+rLF/4CCprjUxr7xLrEX/ItwN+q5HNorqWL81SqHooiXA86/s1agKJMFhKaKA983vqdb/515yftptkkeuz32Y25WE02tjK/KYfQV3zofXMeM4CZNVtETIlFs0YSNwKBgQD4R9RhP/7hvWm0S7HpyJlst9sEU7gvFX1Z2yLsfCXF/2RPO+048rd5xhOn8h07tclztGvziwtA1Ka1jgOe11iSSJWTKVwf/WVlFir61feP2w7todUvu+gLHvHRHSpOw7PIUGZm1Km7BgJS5XCAg7loRgCw9FprC9emqNSdPlqn7wKBgEywTbj2seXrnuVz49R+TTNJ2mNtybdQ5uKA4oFUBbKpr1DtR5eCmcrzrNNr7X1fdwl4UWsKc4CjGpHHK18opUa3wvyq8TzpZFp2UHfGF3JtTuCyoGkZybnCn14/61oJFsO58QJQZK7Am9q5wPnbkXG2Q5oMthOcU/QEMkaiScH3AoGBAL4h49aFt58P+r8DqL+ryzKiqarqogYMou4JDvmjKRoztpGnBsexuCgdNDhNBW4QjLF63aCoPnnrX69xjfw6Va3QwBrudYpZ9ygujcOB0A/uZcQ9RpFDiTPbArxtZVTkMe2ZBJKDEWgT9fudkUYZmgbsdOMOfZ+0dfU/HXM9qRcpAoGASIYb2YG7Wk0Wb/RrnpZ5aPEOVfSigHSjlsR7PrhQon7mda2vnL2s4Qit7q6YMSOgBFUSYVEhTZIMKXWXbJx/nlvSxsRrPdVilooDnAsvMHOBuK/eeyIO0KHqklg22DXa2NdVTCKzfsiA2IJFLHhF1KxCznCQiAmdGOj3B4jBwXE="
              ),
              crypto
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
      disableCompressedStreams: true
    });
    const page = doc.pages.create();
    const checkBox = page.addCheckBox({
      left: 10,
      top: 10,
      width: 100
    });

    assert.equal(checkBox.left, 10);
    assert.equal(checkBox.top, 10);
    assert.equal(checkBox.width, 100);
    assert.equal(checkBox.height, 18, "Height shall be default 18");
  });

  describe("clone", () => {
    describe("pages", () => {
      let doc: PDFDocument;

      beforeEach(async () => {
        doc = await PDFDocument.create();

        // Add 10 pages and set Test filed with order number
        let counter = 0;
        while (counter++ < 10) {
          const page = doc.pages.create();
          page.target.set("Test", doc.target.createNumber(counter));
        }
      });

      const tests: {
        name: string;
        params?: PageFilter[];
        want: number[];
      }[] = [
        {
          name: "all pages",
          want: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        {
          name: "custom numbers + odd pages",
          params: [1, 3, 5, 7, 5, 3, 1, 1, 11, 100],
          want: [1, 3, 5, 7, 5, 3, 1, 1]
        },
        {
          name: "desc and asc ranges",
          params: [
            [3, 7],
            [5, 1]
          ],
          want: [3, 4, 5, 6, 7, 5, 4, 3, 2, 1]
        },
        {
          name: "range *-5",
          params: [[, 5]],
          want: [1, 2, 3, 4, 5]
        },
        {
          name: "range 5-*",
          params: [[5]],
          want: [5, 6, 7, 8, 9, 10]
        }
      ];

      for (const t of tests) {
        it(t.name, async () => {
          const clone = await doc.clone({
            pages: t.params
          });
          const pages = [...clone.pages].map(
            (o) => o.target.get("Test", core.PDFNumeric).value
          );
          assert.deepEqual(pages, t.want);
        });
      }
    });
  });

  describe("SignatureBox", () => {
    describe("groupName", () => {
      it("split signature field to two fields, AcroForm.Fields has Field(sig1) only", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();

        // create signature box like Field(sig)/Widget
        const context = doc.target;
        const dict = doc.target
          .createDictionary(
            // Field
            ["FT", context.createName("Sig")],
            ["T", context.createString("sig")],
            // Widget
            ["Subtype", context.createName("Widget")],
            ["Rect", context.createRectangle(0, 0, 0, 0)],
            ["P", page.target],
            ["F", context.createNumber(4)]
          )
          .makeIndirect();
        page.target.set("Annots", context.createArray(dict));
        const catalog = doc.target.update.catalog;
        assert.ok(catalog);
        catalog.set(
          "AcroForm",
          context.createDictionary(["Fields", context.createArray(dict)])
        );

        const sig = doc.getComponentByName("sig");
        assert.ok(sig instanceof SignatureBox);

        // rename signature box
        sig.groupName = "sig1";

        // check signature box
        const sig1 = doc.getComponentByName("sig1");
        assert.ok(sig1 instanceof SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = catalog
          .get("AcroForm", core.PDFDictionary)
          .get("Fields", core.PDFArray);
        assert.equal(fields.length, 1);

        // check AcroForm.Fields.Field
        const field = fields.get(0, core.PDFDictionary);
        assert.equal(field.get("FT", core.PDFName).text, "Sig");
        assert.equal(field.get("T", core.PDFString).text, "sig1");

        // check AcroForm.Fields.Field.Widget
        const widget = field
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        assert.equal(widget.get("Subtype", core.PDFName).text, "Widget");
        assert.equal(widget.get("P").equal(page.target), true);
        assert.equal(widget.get("F", core.PDFNumeric).value, 4);
        assert.equal(widget.get("Parent").equal(field), true);
      });

      it("split signature field to two fields, AcroForm.Fields has Field(form)::Field(sig1) only", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();

        const context = doc.target;
        const catalog = context.update.catalog;

        // create signature box like Field(form)::Field(sig)/Widget
        const formDict = doc.target
          .createDictionary(["T", context.createString("form")])
          .makeIndirect();

        const sigDict = doc.target
          .createDictionary(
            // Field
            ["FT", context.createName("Sig")],
            ["T", context.createString("sig")],
            // Widget
            ["Subtype", context.createName("Widget")],
            ["Rect", context.createRectangle(0, 0, 0, 0)],
            ["P", page.target],
            ["Parent", formDict],
            ["F", context.createNumber(4)]
          )
          .makeIndirect();

        // add signature box to page
        page.target.set("Annots", context.createArray(formDict));
        assert.ok(catalog);

        // add sig to form
        formDict.set("Kids", context.createArray(sigDict));

        // add form to catalog
        catalog.set(
          "AcroForm",
          context.createDictionary(["Fields", context.createArray(formDict)])
        );

        // check signature box
        const sig = doc.getComponentByName("form.sig");
        assert.ok(sig instanceof SignatureBox);

        // rename signature box
        // sig.get(0).groupName = "form.sig1";
        sig.groupName = "form.sig1";

        // check signature box
        const sig1 = doc.getComponentByName("form.sig1");
        assert.ok(sig1 instanceof SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = catalog
          .get("AcroForm", core.PDFDictionary)
          .get("Fields", core.PDFArray);
        assert.equal(fields.length, 1);

        // check form
        const form = fields.get(0, core.PDFDictionary);
        assert.equal(form.get("Kids", core.PDFArray).length, 1);

        // check sig1
        const sig1Dict = form
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        assert.equal(sig1Dict.get("FT", core.PDFName).text, "Sig");
        assert.equal(sig1Dict.get("T", core.PDFString).text, "sig1");

        // check sig1 widget
        const sig1Widget = sig1Dict
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        assert.equal(sig1Widget.get("Subtype", core.PDFName).text, "Widget");
        assert.equal(sig1Widget.get("P").equal(page.target), true);
        assert.equal(sig1Widget.get("F", core.PDFNumeric).value, 4);
        assert.equal(sig1Widget.get("Parent").equal(sig1Dict), true);
      });

      it("move signature box to another non-existing field", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();
        const catalog = doc.target.update.catalog;
        assert.ok(catalog);

        // create signature box like Field(form)::Field(sig)/Widget
        const context = doc.target;
        const fieldDict = doc.target
          .createDictionary(
            ["FT", context.createName("Sig")],
            ["T", context.createString("sig")],
            ["Kids", context.createArray()]
          )
          .makeIndirect();

        // create signature widget
        const widgetDict = doc.target
          .createDictionary(
            ["Type", context.createName("Annot")],
            ["Subtype", context.createName("Widget")],
            ["Rect", context.createRectangle(0, 0, 0, 0)],
            ["P", page.target],
            ["Parent", fieldDict],
            ["F", context.createNumber(4)]
          )
          .makeIndirect();
        fieldDict.get("Kids", core.PDFArray).push(widgetDict);

        // add signature widget to page
        page.target.set("Annots", context.createArray(widgetDict));
        catalog.set(
          "AcroForm",
          context.createDictionary(["Fields", context.createArray(fieldDict)])
        );

        // get signature box by name
        const sig = doc.getComponentByName("sig");
        assert.ok(sig instanceof SignatureBoxGroup);

        // rename signature box
        sig.get(0).groupName = "sig1";

        // check signature box
        const sig1 = doc.getComponentByName("sig1");
        assert.ok(sig1 instanceof SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = catalog
          .get("AcroForm", core.PDFDictionary)
          .get("Fields", core.PDFArray);
        assert.equal(fields.length, 1);

        // check AcroForm.Fields.Field
        const field = fields.get(0, core.PDFDictionary);
        assert.equal(field.get("FT", core.PDFName).text, "Sig");
        assert.equal(field.get("T", core.PDFString).text, "sig1");

        // check AcroForm.Fields.Field.Widget
        const widget = field
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        assert.equal(widget.get("Subtype", core.PDFName).text, "Widget");
        assert.equal(widget.get("P").equal(page.target), true);
        assert.equal(widget.get("F", core.PDFNumeric).value, 4);
        assert.equal(widget.get("Parent").equal(field), true);
      });

      it("move FieldWidget signature box to another existing FieldWidget signature box", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();
        const catalog = doc.target.update.catalog;
        assert.ok(catalog);
        const acroForm = catalog.AcroForm.get();

        // create signature box
        const context = doc.target;
        const sigDict1 = doc.target
          .createDictionary(
            // Field
            ["FT", context.createName("Sig")],
            ["T", context.createString("sig")],
            // Widget
            ["Type", context.createName("Annot")],
            ["Subtype", context.createName("Widget")],
            ["Rect", context.createRectangle(0, 0, 0, 0)],
            ["P", page.target],
            ["F", context.createNumber(4)]
          )
          .makeIndirect();

        // create another signature box
        const sigDict2 = doc.target
          .createDictionary(
            // Field
            ["FT", context.createName("Sig")],
            ["T", context.createString("sig1")],
            // Widget
            ["Type", context.createName("Annot")],
            ["Subtype", context.createName("Widget")],
            ["Rect", context.createRectangle(0, 0, 0, 0)],
            ["P", page.target],
            ["F", context.createNumber(4)]
          )
          .makeIndirect();

        // add signatures to page
        page.target.set("Annots", context.createArray(sigDict1, sigDict2));

        // add signatures to AcroForm
        acroForm.addField(sigDict1.to(core.PDFField));
        acroForm.addField(sigDict2.to(core.PDFField));

        // get signature box by name
        const sig = doc.getComponentByName("sig");
        assert.ok(sig instanceof SignatureBox);

        // rename signature box
        sig.groupName = "sig1";

        // check signature box
        const sig1 = doc.getComponentByName("sig1");
        assert.ok(sig1 instanceof SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = acroForm.Fields;
        assert.equal(fields.length, 1);

        // check AcroForm.Fields.Field
        const field = fields.get(0, core.PDFDictionary);
        assert.equal(field.get("FT", core.PDFName).text, "Sig");
        assert.equal(field.get("T", core.PDFString).text, "sig1");
        assert.equal(field.get("Kids", core.PDFArray).length, 2);

        // check page has 2 widgets
        const annots = page.target.get("Annots", core.PDFArray);
        assert.equal(annots.length, 2);
        assert.ok(annots.get(0).equal(field.get("Kids", core.PDFArray).get(1)));
        assert.ok(annots.get(1).equal(field.get("Kids", core.PDFArray).get(0)));
      });
    });
  });
});
