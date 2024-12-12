import { PDFDocument } from "../structure";

describe("PDFField", () => {
  describe("addKid", () => {
    it("should add kid to Kids array and set kid's Parent to this field", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const parentField = acroForm.findOrCreateField("foo");
      const childField = acroForm.findOrCreateField("bar");

      const ok = parentField.addKid(childField);
      expect(ok).toBeTruthy();
      const kids = parentField.Kids.get();
      expect(kids.length).toBe(1);
      expect(kids.get(0)).toBe(childField);
      expect(childField.Parent).toBe(parentField);
      // check that childField was removed from the AcroForm's Fields array
      expect(acroForm.Fields.length).toBe(1);
    });

    it("should not add kid to Kids array if kid is already a kid of this field", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const parentField = acroForm.findOrCreateField("foo.bar");
      const childField = acroForm.findOrCreateField("bar");

      const ok1 = parentField.addKid(childField);
      expect(ok1).toBeTruthy();
      const ok2 = parentField.addKid(childField);
      expect(ok2).toBeFalsy();
      const kids = parentField.Kids.get();
      expect(kids.length).toBe(1);
      expect(kids.get(0)).toBe(childField);
      expect(childField.Parent).toBe(parentField);
    });

    it("should move kid from its current parent to this field", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      // create fields
      const parentField1 = acroForm.findOrCreateField("foo");
      const parentField2 = acroForm.findOrCreateField("bar");
      const childField = acroForm.findOrCreateField("baz");

      // add childField to parentField1
      parentField1.addKid(childField);
      expect(parentField1.Kids.get().length).toBe(1);
      expect(parentField2.Kids.get().length).toBe(0);
      expect(childField.Parent).toBe(parentField1);

      // move childField to parentField2
      const ok = parentField2.addKid(childField);
      expect(ok).toBeTruthy();
      expect(parentField1.Kids.get().length).toBe(0);
      expect(parentField2.Kids.get().length).toBe(1);
      expect(childField.Parent).toBe(parentField2);
    });
  });

  describe("removeKid", () => {
    it("should remove kid from Kids array and delete kid's Parent", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const parentField = acroForm.findOrCreateField("foo");
      const childField = acroForm.findOrCreateField("bar");

      parentField.addKid(childField);
      expect(parentField.Kids.get().length).toBe(1);
      expect(childField.Parent).toBe(parentField);

      const ok = parentField.removeKid(childField);
      expect(ok).toBeTruthy();
      expect(parentField.Kids.get().length).toBe(0);
      expect(childField.Parent).toBeNull();
    });

    it("should not remove kid from Kids array if kid is not a kid of this field", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const parentField1 = acroForm.findOrCreateField("foo");
      const parentField2 = acroForm.findOrCreateField("bar");
      const childField = acroForm.findOrCreateField("baz");

      parentField1.addKid(childField);
      expect(parentField1.Kids.get().length).toBe(1);
      expect(childField.Parent).toBe(parentField1);

      const ok = parentField2.removeKid(childField);
      expect(ok).toBeFalsy();
      expect(parentField1.Kids.get().length).toBe(1);
      expect(childField.Parent).toBe(parentField1);
    });
  });

  describe("getFullName", () => {
    it("should return the full name of this field", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const field = acroForm.findOrCreateField("foo.bar.baz");
      expect(field.getFullName()).toBe("foo.bar.baz");
      expect(field.Parent!.getFullName()).toBe("foo.bar");
      expect(field.Parent!.Parent!.getFullName()).toBe("foo");
    });
  });

  describe("removeFromParent", () => {
    it("should remove this field from its parent", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const parentField = acroForm.findOrCreateField("foo");
      const childField = acroForm.findOrCreateField("bar");

      parentField.addKid(childField);
      expect(parentField.Kids.get().length).toBe(1);
      expect(childField.Parent).toBe(parentField);

      childField.removeFromParent();
      expect(parentField.Kids.get().length).toBe(0);
      expect(childField.Parent).toBeNull();
    });

    it("should not remove kid from AcroForm.Fields if it's there", () => {
      // initialize document
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const field = acroForm.findOrCreateField("foo");
      expect(acroForm.Fields.length).toBe(1);

      field.removeFromParent();
      expect(acroForm.Fields.length).toBe(0);
    });
  });
});
