import * as assert from "node:assert";
import { CrossReferenceStream, CrossReferenceTable, PDFIndirectObject } from "@peculiarventures/pdf-core";
import { PDFDocument } from "@peculiarventures/pdf-doc";
import { PDFRepair, PDFRepairStatus, globalRepairRegistry } from "@peculiarventures/pdf-repair";

context("PDFRepair:xrefHybrid", () => {
  it("should return requireClone", async () => {
    const doc = await PDFDocument.create({
      useXrefTable: true,
    });
    doc.pages.create();
    const xref = doc.target.update.xref;
    assert(xref instanceof CrossReferenceTable);
    const xRefStm = doc.target.createNumber(0, 5);
    xref.set("XRefStm", xRefStm);
    const xRefStream = CrossReferenceStream.create(doc.target).makeIndirect();
    xRefStream.Size = xref.Size;
    xRefStream.objects = xref.objects;
    xRefStream.W = [1, 2, 1];
    const raw = await doc.save();

    const xRefStreamOffset = (xRefStream.getIndirect() as PDFIndirectObject).view.byteOffset.toString();
    xRefStm.view.set(Buffer.from(xRefStreamOffset), 0);

    const doc2 = await PDFDocument.load(raw);
    const repair = new PDFRepair(globalRepairRegistry, ["xrefHybrid"]);
    const report = await repair.checkDocument(doc2);
    assert.strictEqual(report.status, PDFRepairStatus.requireClone);
  });

  it("should return notNeeded", async () => {
    const doc = await PDFDocument.create();
    doc.pages.create();
    const raw = await doc.save();

    const doc2 = await PDFDocument.load(raw);
    const repair = new PDFRepair(globalRepairRegistry, ["xrefHybrid"]);
    const report = await repair.checkDocument(doc2);
    assert.strictEqual(report.status, PDFRepairStatus.notNeeded);
  });
});
