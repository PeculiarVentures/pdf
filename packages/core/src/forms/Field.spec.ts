import * as assert from "node:assert";
import { PDFDocument } from "../structure";

context("PDFField", () => {
  context("addKid", () => {
    it("should add kid to Kids array and set kid's Parent to this field", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const parentField = acroForm.findOrCreateField("foo");
      const childField = acroForm.findOrCreateField("bar");

      const ok = parentField.addKid(childField);
      assert.ok(ok);
      const kids = parentField.Kids.get();
      assert.equal(kids.length, 1);
      assert.equal(kids.get(0), childField);
      assert.equal(childField.Parent, parentField);
      // check that childField was removed from the AcroForm's Fields array
      assert.equal(acroForm.Fields.length, 1);
    });

    it("should not add kid to Kids array if kid is already a kid of this field", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const parentField = acroForm.findOrCreateField("foo.bar");
      const childField = acroForm.findOrCreateField("bar");

      const ok1 = parentField.addKid(childField);
      assert.ok(ok1);
      const ok2 = parentField.addKid(childField);
      assert.ok(!ok2);
      const kids = parentField.Kids.get();
      assert.equal(kids.length, 1);
      assert.equal(kids.get(0), childField);
      assert.equal(childField.Parent, parentField);
    });

    it("should move kid from its current parent to this field", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      // create fields
      const parentField1 = acroForm.findOrCreateField("foo");
      const parentField2 = acroForm.findOrCreateField("bar");
      const childField = acroForm.findOrCreateField("baz");

      // add childField to parentField1
      parentField1.addKid(childField);
      assert.equal(parentField1.Kids.get().length, 1);
      assert.equal(parentField2.Kids.get().length, 0);
      assert.equal(childField.Parent, parentField1);

      // move childField to parentField2
      const ok = parentField2.addKid(childField);
      assert.ok(ok);
      assert.equal(parentField1.Kids.get().length, 0);
      assert.equal(parentField2.Kids.get().length, 1);
      assert.equal(childField.Parent, parentField2);
    });
  });

  context("removeKid", () => {
    it("should remove kid from Kids array and delete kid's Parent", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const parentField = acroForm.findOrCreateField("foo");
      const childField = acroForm.findOrCreateField("bar");

      parentField.addKid(childField);
      assert.equal(parentField.Kids.get().length, 1);
      assert.equal(childField.Parent, parentField);

      const ok = parentField.removeKid(childField);
      assert.ok(ok);
      assert.equal(parentField.Kids.get().length, 0);
      assert.equal(childField.Parent, undefined);
    });

    it("should not remove kid from Kids array if kid is not a kid of this field", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const parentField1 = acroForm.findOrCreateField("foo");
      const parentField2 = acroForm.findOrCreateField("bar");
      const childField = acroForm.findOrCreateField("baz");

      parentField1.addKid(childField);
      assert.equal(parentField1.Kids.get().length, 1);
      assert.equal(childField.Parent, parentField1);

      const ok = parentField2.removeKid(childField);
      assert.ok(!ok);
      assert.equal(parentField1.Kids.get().length, 1);
      assert.equal(childField.Parent, parentField1);
    });
  });

  context("getFullName", () => {
    it("should return the full name of this field", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const field = acroForm.findOrCreateField("foo.bar.baz");
      assert.equal(field.getFullName(), "foo.bar.baz");
      assert.equal(field.Parent!.getFullName(), "foo.bar");
      assert.equal(field.Parent!.Parent!.getFullName(), "foo");
    });
  });

  context("removeFromParent", () => {
    it("should remove this field from its parent", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const parentField = acroForm.findOrCreateField("foo");
      const childField = acroForm.findOrCreateField("bar");

      parentField.addKid(childField);
      assert.equal(parentField.Kids.get().length, 1);
      assert.equal(childField.Parent, parentField);

      childField.removeFromParent();
      assert.equal(parentField.Kids.get().length, 0);
      assert.equal(childField.Parent, undefined);
    });

    it("should not remove kid from AcroForm.Fields if it's there", () => {
      // initialize document
      const doc = new PDFDocument();
      const catalog = doc.update.addCatalog();
      const acroForm = catalog.AcroForm.get();
      assert.ok(acroForm);
      assert.equal(acroForm.Fields.length, 0);

      const field = acroForm.findOrCreateField("foo");
      assert.equal(acroForm.Fields.length, 1);

      field.removeFromParent();
      assert.equal(acroForm.Fields.length, 0);
    });
  });
});
