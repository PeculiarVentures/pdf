import * as assert from "node:assert";
import { PDFDocument } from "@peculiarventures/pdf-doc";
import { PDFRepair, PDFRepairStatus, globalRepairRegistry } from "@peculiarventures/pdf-repair";

context("PDFRepair:AnnotationHasPage", () => {
  it("should add page reference to annotation", async () => {
    const doc = await PDFDocument.create();
    const page = doc.pages.create();
    const annot = page.addCheckBox();
    annot.target.delete("P");
    assert.strictEqual(annot.target.has("P"), false);

    const repair = new PDFRepair(globalRepairRegistry.filter(o => o.id === "annotationHasPage"));

    const report = await repair.checkDocument(doc);
    assert.strictEqual(report.status, PDFRepairStatus.repairable);

    const notes = await repair.repairDocument(doc);
    assert.strictEqual(Object.keys(notes).length, 1);
    assert.strictEqual(/Annotation '(\d+) (\d+) R' has no P. Set P to page '(\d+) (\d+) R'/.test(notes.annotationHasPage[0]), true);
    assert.strictEqual(annot.target.has("P"), true);
  });

  it("should not add page reference to annotation", async () => {
    const doc = await PDFDocument.create();
    const page = doc.pages.create();
    const annot = page.addCheckBox();
    assert.strictEqual(annot.target.has("P"), true);

    const repair = new PDFRepair(globalRepairRegistry.filter(o => o.id === "annotationHasPage"));

    const report = await repair.checkDocument(doc);
    assert.strictEqual(report.status, PDFRepairStatus.notNeeded);

    const notes = await repair.repairDocument(doc);
    assert.strictEqual(Object.keys(notes).length, 0);
  });
});
