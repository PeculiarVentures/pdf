import * as assert from "node:assert";
import { PDFDocument } from "@peculiarventures/pdf-doc";
import { PDFRepair, PDFRepairStatus, globalRepairRegistry } from "@peculiarventures/pdf-repair";

context("PDFRepair:RemoveNeedAppearances", () => {
  it("should remove NeedAppearances flag", async () => {
    const doc = await PDFDocument.create();
    doc.pages.create();

    const acroForm = doc.target.update.catalog!.AcroForm.get();
    acroForm.needAppearances = true;

    const repair = new PDFRepair(globalRepairRegistry.filter(o => o.id === "removeNeedAppearances"));
    const report = await repair.checkDocument(doc);
    assert.strictEqual(report.status, PDFRepairStatus.repairable);
    const notes = await repair.repairDocument(doc);
    assert.strictEqual(Object.keys(notes).length, 1);
    assert.strictEqual(notes.removeNeedAppearances[0], "Removed NeedAppearances from AcroForm.");
    assert.strictEqual(acroForm.has("NeedAppearances"), false);
  });

  context("should not remove NeedAppearances flag", async () => {
    it("if it is set and equal to `false`", async () => {
      const doc = await PDFDocument.create();
      doc.pages.create();

      const acroForm = doc.target.update.catalog!.AcroForm.get();
      acroForm.needAppearances = false;

      const repair = new PDFRepair(globalRepairRegistry.filter(o => o.id === "removeNeedAppearances"));

      const report = await repair.checkDocument(doc);
      assert.strictEqual(report.status, PDFRepairStatus.notNeeded);

      const notes = await repair.repairDocument(doc);
      assert.strictEqual(Object.keys(notes).length, 0);
    });

    it("if it is not set", async () => {
      const doc = await PDFDocument.create();
      doc.pages.create();

      const repair = new PDFRepair(globalRepairRegistry.filter(o => o.id === "removeNeedAppearances"));

      const report = await repair.checkDocument(doc);
      assert.strictEqual(report.status, PDFRepairStatus.notNeeded);

      const notes = await repair.repairDocument(doc);
      assert.strictEqual(Object.keys(notes).length, 0);
    });

    it("if AcroForm is not set", async () => {
      const doc = await PDFDocument.create();
      doc.pages.create();

      const repair = new PDFRepair(globalRepairRegistry.filter(o => o.id === "removeNeedAppearances"));

      const report = await repair.checkDocument(doc);
      assert.strictEqual(report.status, PDFRepairStatus.notNeeded);

      const notes = await repair.repairDocument(doc);
      assert.strictEqual(Object.keys(notes).length, 0);
    });
  });
});


