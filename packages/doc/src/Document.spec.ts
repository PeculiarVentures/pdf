import * as core from "@peculiar/pdf-core";
import { PageFilter } from "@peculiar/pdf-copy";
import { PdfRenderingHelper } from "@peculiar/pdf-tests";

import { PDFDocument } from "./Document";
import { PDFVersion } from "./Version";
import { SignatureBox } from "./forms/SignatureBox";
import { SignatureBoxGroup } from "./forms/SignatureBox.Group";

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

      const hash = await PdfRenderingHelper.getPageHash(raw, 1);
      expect(hash).toBe(
        "f724162d629d671000f9dcaf9e81be20f45f8060b5f84b4a5d5b9794e096595e"
      );
    });
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
          // eslint-disable-next-line no-sparse-arrays
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
          expect(pages).toEqual(t.want);
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
        const catalog = doc.target.update.catalog!;
        catalog.set(
          "AcroForm",
          context.createDictionary(["Fields", context.createArray(dict)])
        );

        const sig = doc.getComponentByName("sig", SignatureBox);

        // rename signature box
        sig.groupName = "sig1";

        // check signature box
        doc.getComponentByName("sig1", SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = catalog
          .get("AcroForm", core.PDFDictionary)
          .get("Fields", core.PDFArray);
        expect(fields.length).toBe(1);

        // check AcroForm.Fields.Field
        const field = fields.get(0, core.PDFDictionary);
        expect(field.get("FT", core.PDFName).text).toBe("Sig");
        expect(field.get("T", core.PDFString).text).toBe("sig1");

        // check AcroForm.Fields.Field.Widget
        const widget = field
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        expect(widget.get("Subtype", core.PDFName).text).toBe("Widget");
        expect(widget.get("P").equal(page.target)).toBe(true);
        expect(widget.get("F", core.PDFNumeric).value).toBe(4);
        expect(widget.get("Parent").equal(field)).toBe(true);
      });

      it("split signature field to two fields, AcroForm.Fields has Field(form)::Field(sig1) only", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();

        const context = doc.target;
        const catalog = context.update.catalog!;

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

        // add sig to form
        formDict.set("Kids", context.createArray(sigDict));

        // add form to catalog
        catalog.set(
          "AcroForm",
          context.createDictionary(["Fields", context.createArray(formDict)])
        );

        // check signature box
        const sig = doc.getComponentByName("form.sig", SignatureBox);

        // rename signature box
        // sig.get(0).groupName = "form.sig1";
        sig.groupName = "form.sig1";

        // check signature box
        doc.getComponentByName("form.sig1", SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = catalog
          .get("AcroForm", core.PDFDictionary)
          .get("Fields", core.PDFArray);
        expect(fields.length).toBe(1);

        // check form
        const form = fields.get(0, core.PDFDictionary);
        expect(form.get("Kids", core.PDFArray).length).toBe(1);

        // check sig1
        const sig1Dict = form
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        expect(sig1Dict.get("FT", core.PDFName).text).toBe("Sig");
        expect(sig1Dict.get("T", core.PDFString).text).toBe("sig1");

        // check sig1 widget
        const sig1Widget = sig1Dict
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        expect(sig1Widget.get("Subtype", core.PDFName).text).toBe("Widget");
        expect(sig1Widget.get("P").equal(page.target)).toBe(true);
        expect(sig1Widget.get("F", core.PDFNumeric).value).toBe(4);
        expect(sig1Widget.get("Parent").equal(sig1Dict)).toBe(true);
      });

      it("move signature box to another non-existing field", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();
        const catalog = doc.target.update.catalog!;

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
        const sig = doc.getComponentByName("sig", SignatureBoxGroup);

        // rename signature box
        sig.get(0).groupName = "sig1";

        // check signature box
        doc.getComponentByName("sig1", SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = catalog
          .get("AcroForm", core.PDFDictionary)
          .get("Fields", core.PDFArray);
        expect(fields.length).toBe(1);

        // check AcroForm.Fields.Field
        const field = fields.get(0, core.PDFDictionary);
        expect(field.get("FT", core.PDFName).text).toBe("Sig");
        expect(field.get("T", core.PDFString).text).toBe("sig1");

        // check AcroForm.Fields.Field.Widget
        const widget = field
          .get("Kids", core.PDFArray)
          .get(0, core.PDFDictionary);
        expect(widget.get("Subtype", core.PDFName).text).toBe("Widget");
        expect(widget.get("P").equal(page.target)).toBe(true);
        expect(widget.get("F", core.PDFNumeric).value).toBe(4);
        expect(widget.get("Parent").equal(field)).toBe(true);
      });

      it("move FieldWidget signature box to another existing FieldWidget signature box", async () => {
        // create document
        const doc = await PDFDocument.create();
        const page = doc.pages.create();
        const catalog = doc.target.update.catalog!;
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
        const sig = doc.getComponentByName("sig", SignatureBox);

        // rename signature box
        sig.groupName = "sig1";

        // check signature box
        doc.getComponentByName("sig1", SignatureBoxGroup);

        // check AcroForm.Fields
        const fields = acroForm.Fields;
        expect(fields.length).toBe(1);

        // check AcroForm.Fields.Field
        const field = fields.get(0, core.PDFDictionary);
        expect(field.get("FT", core.PDFName).text).toBe("Sig");
        expect(field.get("T", core.PDFString).text).toBe("sig1");
        expect(field.get("Kids", core.PDFArray).length).toBe(2);

        // check page has 2 widgets
        const annots = page.target.get("Annots", core.PDFArray);
        expect(annots.length).toBe(2);
        expect(
          annots.get(0).equal(field.get("Kids", core.PDFArray).get(1))
        ).toBe(true);
        expect(
          annots.get(1).equal(field.get("Kids", core.PDFArray).get(0))
        ).toBe(true);
      });
    });
  });
});
