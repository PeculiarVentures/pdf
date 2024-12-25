import * as core from "@peculiarventures/pdf-core";
import {
  createPdfWithPage,
  reopenPdfDocument
} from "@peculiarventures/pdf-tests";
import { SignatureBox, SignatureBoxGroup } from "@peculiarventures/pdf-doc";
import * as pkijs from "pkijs";

describe("SignatureBox", () => {
  beforeAll(() => {
    pkijs.setEngine("newEngine", new core.PDFCryptoEngine({ crypto }));
  });

  describe("Basic functionality", () => {
    it("should create signature box with correct properties", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);
      const box = page.addSignatureBox({ groupName: "test" });

      expect(box).toBeInstanceOf(SignatureBox);
      expect(box.groupName).toBe("test");
      expect(box.target.rect.toString()).toBe("[ 0, 0, 0, 0 ]");
      expect(box.left).toBe(0);
      expect(box.top).toBe(841.89); // Page position
      expect(box.width).toBe(0);
      expect(box.height).toBe(0);
      expect(box.target.f).toBe(4);

      expect(doc.target.catalog.AcroForm.get(true).SigFlags).toBe(3);
    });

    it("should update size correctly", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);
      const box = page.addSignatureBox();

      const newWidth = 200;
      const newHeight = 100;
      box.width = newWidth;
      box.height = newHeight;

      expect(box.width).toBe(newWidth);
      expect(box.height).toBe(newHeight);
    });
  });

  describe("Group management", () => {
    it("should find group when assigned", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);
      page.addSignatureBox({ groupName: "test" });

      const doc2 = await reopenPdfDocument(doc);
      const groups = doc2.getSignatures();
      const group = groups[0];
      expect(group).toBeInstanceOf(SignatureBoxGroup);
      const sigGroup = group as SignatureBoxGroup;
      const kids = sigGroup.target.Kids.get(true);
      expect(kids.length).toBe(1);
    });

    it("should split single widget correctly", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);

      const targetDoc = doc.target;
      const singleWidget = targetDoc
        .createDictionary(
          ["T", targetDoc.createString("test")],
          ["FT", targetDoc.createName("Sig")],
          ["Type", targetDoc.createName("Annot")],
          ["Subtype", targetDoc.createName("Widget")],
          ["Rect", targetDoc.createRectangle(0, 0, 0, 0)],
          ["F", targetDoc.createNumber(4)]
        )
        .makeIndirect();
      page.target.addAnnot(singleWidget.to(core.AnnotationDictionary));

      const box = new SignatureBox(singleWidget.to(core.WidgetDictionary), doc);
      const group = box.split();
      expect(group).toBeInstanceOf(SignatureBoxGroup);
      expect(singleWidget.has("Parent")).toBe(true);
      expect(singleWidget.get("Parent", core.PDFDictionary).toString()).toBe(
        group.target.toString()
      );
      const groupDict = group.target.to(core.PDFField);
      expect(groupDict.Kids.get(true).length).toBe(1);
      expect(groupDict.t.text).toBe("test");
      expect(groupDict.ft).toBe("Sig");
    });
  });

  describe("Delete functionality", () => {
    it("should remove signature box and clean up when last one", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);
      const box = page.addSignatureBox({ groupName: "test" });
      const box2 = page.addSignatureBox({ groupName: "test2" });
      const acroForm = doc.target.update.catalog?.AcroForm.get(true);
      let signatures = doc.getSignatures();
      expect(acroForm?.SigFlags).toBe(3);
      expect(signatures.length).toBe(2);

      // Delete first box
      box.delete();
      signatures = doc.getSignatures();
      expect(signatures.length).toBe(1);
      expect(acroForm?.SigFlags).toBe(3);

      // Delete second box
      box2.delete();
      signatures = doc.getSignatures();
      expect(signatures.length).toBe(0);
      expect(acroForm?.has("SigFlags")).toBe(false);
    });

    it("should keep field when other widgets exist", async () => {
      const doc = await createPdfWithPage();
      const page = doc.pages.get(0);
      const box1 = page.addSignatureBox({ groupName: "test" });
      const box2 = page.addSignatureBox({ groupName: "test" });
      const acroForm = doc.target.catalog.AcroForm.get(true);
      expect(acroForm.SigFlags).toBe(3);
      box1.delete();

      const field = box2.getGroup().target;
      expect(field.Kids.has()).toBe(true);
      expect(field.Kids.get().length).toBe(1);
      expect(acroForm.SigFlags).toBe(3);

      box2.delete();
      expect(acroForm.has("SigFlags")).toBe(false);
    });
  });
});
