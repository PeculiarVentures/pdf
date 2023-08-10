import * as assert from "node:assert";
import { PDFDocument } from "../Document";
import { PDFField } from "../../forms";

context("InteractiveFormDictionary", () => {
  context("findOrCreateField", () => {
    it("should create a new field if it doesn't exist", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      const field = acroForm.findOrCreateField("foo");
      assert.ok(field);

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      assert.equal(fields.length, 1);
    });

    it("should return an existing field if it already exists", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      // create a field
      const field1 = acroForm.findOrCreateField("foo");
      assert.ok(field1);

      // find the field
      const field2 = acroForm.findOrCreateField("foo");
      assert.ok(field2);

      // check that the field is the same
      assert.equal(field1, field2);

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      assert.equal(fields.length, 1);
    });

    it("should create intermediate fields if necessary", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      const field = acroForm.findOrCreateField("foo.bar.baz");
      assert.ok(field);

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      assert.equal(fields.length, 1);

      // check that the intermediate fields were created
      const foo = fields.get(0, PDFField);
      assert.equal(foo.getFullName(), "foo");

      const bar = foo.Kids.get().get(0, PDFField);
      assert.equal(bar.getFullName(), "foo.bar");

      const baz = bar.Kids.get().get(0, PDFField);
      assert.equal(baz.getFullName(), "foo.bar.baz");
    });

    it("should not create intermediate fields if they already exist", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      // create the intermediate fields
      const foo = acroForm.findOrCreateField("foo");
      assert.ok(foo);
      const bar = acroForm.findOrCreateField("foo.bar");
      assert.ok(bar);

      // find the field
      const field = acroForm.findOrCreateField("foo.bar.baz");
      assert.ok(field);

      assert.equal(field.getFullName(), "foo.bar.baz");
      assert.equal(field.Parent?.getFullName(), "foo.bar");
      assert.equal(field.Parent?.Parent?.getFullName(), "foo");

      // check that the field was added to AcroForm.Fields
      const fields = acroForm.Fields;
      assert.equal(fields.length, 1);
    });
  });

  context("findField", () => {
    it("should return null if the field does not exist", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      const field = acroForm.findField("foo");
      assert.equal(field, null);
    });

    it("should return the field if it exists", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      // create the field
      const field1 = acroForm.findOrCreateField("foo");
      assert.ok(field1);

      // find the field
      const field2 = acroForm.findField("foo");
      assert.equal(field1, field2);
    });

    it("should return the field if it exists and its name is qualified", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);

      // create the field
      const field1 = acroForm.findOrCreateField("foo.bar");
      assert.ok(field1);

      // find the field
      const field2 = acroForm.findField("foo.bar");
      assert.equal(field1, field2);
    });
  });

  context("addField", () => {
    it("should add the field to the form's Fields array", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok = acroForm.addField(field);
      assert.ok(ok);
      assert.equal(acroForm.Fields.length, 1);
    });

    it("should make the field indirect", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok = acroForm.addField(field);
      assert.ok(ok);
      assert.ok(field.isIndirect());
    });

    it("should not add the field if it is already part of another form", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const parentField = PDFField.create(doc);
      parentField.set("T", doc.createString("foo"));

      const childField = PDFField.create(doc);
      childField.set("T", doc.createString("bar"));

      parentField.addKid(childField);

      const ok = acroForm.addField(childField);
      assert.ok(!ok);
    });

    it("should not add the field if it is already part of this form", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok1 = acroForm.addField(field);
      assert.ok(ok1);
      assert.equal(acroForm.Fields.length, 1);

      const ok2 = acroForm.addField(field);
      assert.ok(!ok2);
      assert.equal(acroForm.Fields.length, 1);
    });
  });

  context("removeField", () => {
    it("should remove the field from the form", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      acroForm.addField(field);
      assert.equal(acroForm.Fields.length, 1);

      const ok = acroForm.removeField(field);
      assert.ok(ok);
      assert.equal(acroForm.Fields.length, 0);
    });

    it("should not remove the field form the form if it is not there", () => {
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();

      const field = PDFField.create(doc);
      field.set("T", doc.createString("foo"));

      const ok = acroForm.removeField(field);
      assert.ok(!ok);
    });
  });
});
