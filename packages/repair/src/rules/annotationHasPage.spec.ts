import { PDFDocument } from "@peculiar/pdf-doc";
import { PDFRepair, globalRepairRegistry } from "@peculiar/pdf-repair";

describe("PDFRepair:AnnotationHasPage", () => {
  it("should add page reference to annotation", async () => {
    const doc = await PDFDocument.create();
    const page = doc.pages.create();
    const annot = page.addCheckBox();
    annot.target.delete("P");
    expect(annot.target.has("P")).toBe(false);

    const repair = new PDFRepair(
      globalRepairRegistry.filter((o) => o.id === "annotationHasPage")
    );
    const notes = await repair.repairDocument(doc);
    expect(Object.keys(notes).length).toBe(1);
    expect(
      /Annotation '(\d+) (\d+) R' has no P. Set P to page '(\d+) (\d+) R'/.test(
        notes.annotationHasPage[0]
      )
    ).toBe(true);
    expect(annot.target.has("P")).toBe(true);
  });

  it("should not add page reference to annotation", async () => {
    const doc = await PDFDocument.create();
    const page = doc.pages.create();
    const annot = page.addCheckBox();
    expect(annot.target.has("P")).toBe(true);

    const repair = new PDFRepair(
      globalRepairRegistry.filter((o) => o.id === "annotationHasPage")
    );
    const notes = await repair.repairDocument(doc);
    expect(Object.keys(notes).length).toBe(0);
  });
});
