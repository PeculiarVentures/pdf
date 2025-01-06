import { PDFDocument } from "@peculiar/pdf-doc";
import { PDFRepair, globalRepairRegistry } from "@peculiar/pdf-repair";

describe("PDFRepair:RemoveNeedAppearances", () => {
  it("should remove NeedAppearances flag", async () => {
    const doc = await PDFDocument.create();
    doc.pages.create();

    const acroForm = doc.target.update.catalog!.AcroForm.get();
    acroForm.needAppearances = true;

    const repair = new PDFRepair(
      globalRepairRegistry.filter((o) => o.id === "removeNeedAppearances")
    );
    const notes = await repair.repairDocument(doc);
    expect(Object.keys(notes).length).toBe(1);
    expect(notes.removeNeedAppearances[0]).toBe(
      "Removed NeedAppearances from AcroForm."
    );
    expect(acroForm.has("NeedAppearances")).toBe(false);
  });

  describe("should not remove NeedAppearances flag", () => {
    it("if it is set and equal to `false`", async () => {
      const doc = await PDFDocument.create();
      doc.pages.create();

      const acroForm = doc.target.update.catalog!.AcroForm.get();
      acroForm.needAppearances = false;

      const repair = new PDFRepair(
        globalRepairRegistry.filter((o) => o.id === "removeNeedAppearances")
      );
      const notes = await repair.repairDocument(doc);
      expect(Object.keys(notes).length).toBe(0);
    });

    it("if it is not set", async () => {
      const doc = await PDFDocument.create();
      doc.pages.create();

      const repair = new PDFRepair(
        globalRepairRegistry.filter((o) => o.id === "removeNeedAppearances")
      );
      const notes = await repair.repairDocument(doc);
      expect(Object.keys(notes).length).toBe(0);
    });

    it("if AcroForm is not set", async () => {
      const doc = await PDFDocument.create();
      doc.pages.create();

      const repair = new PDFRepair(
        globalRepairRegistry.filter((o) => o.id === "removeNeedAppearances")
      );
      const notes = await repair.repairDocument(doc);
      expect(Object.keys(notes).length).toBe(0);
    });
  });
});
