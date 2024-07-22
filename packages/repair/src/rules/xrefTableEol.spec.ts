import * as assert from "node:assert";
import { CrossReferenceTable } from "@peculiarventures/pdf-core";
import { PDFDocument } from "@peculiarventures/pdf-doc";
import { PDFRepair, PDFRepairStatus, globalRepairRegistry } from "@peculiarventures/pdf-repair";

context("PDFRepair:xrefTableEol", () => {
  after(() => {
    CrossReferenceTable.EOL = "\r\n";
  });
  it("should return requireClone", async () => {
    CrossReferenceTable.EOL = "\n"; // incorrect EOL
    const doc = await PDFDocument.create({
      useXrefTable: true,
    });
    doc.pages.create();
    const raw = await doc.save();

    const doc2 = await PDFDocument.load(raw);
    const repair = new PDFRepair(globalRepairRegistry, ["xrefTableEol"]);
    const report = await repair.checkDocument(doc2);
    assert.strictEqual(report.status, PDFRepairStatus.requireClone);
  });

  it("should return notNeeded", async () => {
    CrossReferenceTable.EOL = "\r\n"; // correct EOL
    const doc = await PDFDocument.create({
      useXrefTable: true,
    });
    doc.pages.create();
    const raw = await doc.save();

    const doc2 = await PDFDocument.load(raw);
    const repair = new PDFRepair(globalRepairRegistry, ["xrefTableEol"]);
    const report = await repair.checkDocument(doc2);
    assert.strictEqual(report.status, PDFRepairStatus.notNeeded);
  });
});
