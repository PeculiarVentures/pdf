import { PDFDocument } from "@peculiarventures/pdf-doc";
import { globalRepairRegistry } from "../PDFRepairRegistry";

globalRepairRegistry.addRule({
  id: "removeNeedAppearances",
  description: "Removes the NeedAppearances field from AcroForm to prevent unintended modifications by Adobe Acrobat.",
  apply: async (doc: PDFDocument) => {
    const notes: string[] = [];
    const catalog = doc.target.update.catalog;
    if (!catalog || !catalog.AcroForm.has()) {
      return notes;
    }
    const acroForm = catalog.AcroForm.get();
    if (acroForm.needAppearances) {
      acroForm.delete("NeedAppearances");

      notes.push("Removed NeedAppearances from AcroForm.");
    }

    return notes;
  }
});


