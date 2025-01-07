import { PDFDocument } from "../Document";
import { PDFField } from "../../forms";

describe("InteractiveFormDictionary", () => {
  describe("findOrCreateField", () => {
    it("should create a new field if it doesn't exist", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      const field = acroForm.findOrCreateField("foo");
      expect(field).toBeTruthy();

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      expect(fields.length).toBe(1);
    });

    it("should return an existing field if it already exists", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      // create a field
      const field1 = acroForm.findOrCreateField("foo");
      expect(field1).toBeTruthy();

      // find the field
      const field2 = acroForm.findOrCreateField("foo");
      expect(field1.equal(field2)).toBe(true);
      expect(field1).toBe(field2);

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      expect(fields.length).toBe(1);
    });

    it("should create intermediate fields if necessary", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      const field = acroForm.findOrCreateField("foo.bar.baz");
      expect(field).toBeTruthy();

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      expect(fields.length).toBe(1);

      // check that the intermediate fields were created
      const foo = fields.get(0, PDFField);
      expect(foo.getFullName()).toBe("foo");

      const bar = foo.Kids.get().get(0, PDFField);
      expect(bar.getFullName()).toBe("foo.bar");

      const baz = bar.Kids.get().get(0, PDFField);
      expect(baz.getFullName()).toBe("foo.bar.baz");
    });

    it("should not create intermediate fields if they already exist", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      // create the intermediate fields
      const foo = acroForm.findOrCreateField("foo");
      expect(foo).toBeTruthy();
      const bar = acroForm.findOrCreateField("foo.bar");
      expect(bar).toBeTruthy();

      // find the field
      const field = acroForm.findOrCreateField("foo.bar.baz");
      expect(field).toBeTruthy();

      expect(field.getFullName()).toBe("foo.bar.baz");
      expect(field.Parent?.getFullName()).toBe("foo.bar");
      expect(field.Parent?.Parent?.getFullName()).toBe("foo");

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      expect(fields.length).toBe(1);
    });
  });

  describe("findField", () => {
    it("should return null if the field does not exist", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      const field = acroForm.findField("foo");
      expect(field).toBeNull();
    });

    it("should return the field if it exists", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      // create the field
      const field1 = acroForm.findOrCreateField("foo");
      expect(field1).toBeTruthy();

      // find the field
      const field2 = acroForm.findField("foo");
      expect(field1).toBe(field2);
    });

    it("should return the field if it exists and its name is qualified", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();

      // create the field
      const field1 = acroForm.findOrCreateField("foo.bar");
      expect(field1).toBeTruthy();

      // find the field
      const field2 = acroForm.findField("foo.bar");
      expect(field1).toBe(field2);
    });
  });

  describe("addField", () => {
    it("should add the field to the form's Fields array", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok = acroForm.addField(field);
      expect(ok).toBeTruthy();
      expect(acroForm.Fields.length).toBe(1);
    });

    it("should make the field indirect", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok = acroForm.addField(field);
      expect(ok).toBeTruthy();
      expect(field.isIndirect()).toBeTruthy();
    });

    it("should not add the field if it is already part of another form", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      expect(acroForm).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);

      const parentField = PDFField.create(doc);
      parentField.set("T", doc.createString("foo"));

      const childField = PDFField.create(doc);
      childField.set("T", doc.createString("bar"));

      parentField.addKid(childField);

      const ok = acroForm.addField(childField);
      expect(ok).toBeFalsy();
    });

    it("should not add the field if it is already part of this form", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok1 = acroForm.addField(field);
      expect(ok1).toBeTruthy();
      expect(acroForm.Fields.length).toBe(1);

      const ok2 = acroForm.addField(field);
      expect(ok2).toBeFalsy();
      expect(acroForm.Fields.length).toBe(1);
    });
  });

  describe("removeField", () => {
    it("should remove the field from the form", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      acroForm.addField(field);
      expect(acroForm.Fields.length).toBe(1);

      const ok = acroForm.removeField(field);
      expect(ok).toBeTruthy();
      expect(acroForm.Fields.length).toBe(0);
    });

    it("should not remove the field from the form if it is not there", () => {
      const doc = PDFDocument.create();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok = acroForm.removeField(field);
      expect(ok).toBeFalsy();
    });
  });
});
