import { PDFDocument } from "@peculiarventures/pdf-doc";
import { globalRepairRegistry } from "../PDFRepairRegistry";
import { PDFRepairStatus } from "../PDFRepairStatus";

globalRepairRegistry.addRule({
  id: "xrefHybrid",
  description: "Checks if the PDF document uses hybrid xref tables",
  apply: async (_doc: PDFDocument) => {
    return [];
  },
  check: async (doc: PDFDocument) => {
    if (doc.hasHybridReference()) {
      return PDFRepairStatus.requireClone;
    }

    return PDFRepairStatus.notNeeded;
  },
});
