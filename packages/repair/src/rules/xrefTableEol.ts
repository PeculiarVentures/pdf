import { PDFDocument } from "@peculiarventures/pdf-doc";
import { CrossReferenceTable, PDFDocumentUpdate } from "@peculiarventures/pdf-core";
import { globalRepairRegistry } from "../PDFRepairRegistry";
import { PDFRepairStatus } from "../PDFRepairStatus";

/**
 * Some PDF documents use 19 bytes for each entry instead of 20 bytes. In this case Acrobat Reader edits the file
 * on opening and shows a save dialog on closing. This also breaks the verification result for signed documents.
 * It's impossible to fix this issue without rewriting the whole file.
 */

globalRepairRegistry.addRule({
  id: "xrefTableEol",
  description: "Checks if xref table item has incorrect size of cross-reference entries",
  apply: async (_doc: PDFDocument) => {
    return [];
  },
  check: async (doc: PDFDocument) => {
    let update: PDFDocumentUpdate | null = doc.target.update;
    while (update) {
      const xref = update.xref;
      if (xref instanceof CrossReferenceTable && xref.hasIncorrectEol) {
        return PDFRepairStatus.requireClone;
      }

      update = update.previous;
    }

    return PDFRepairStatus.notNeeded;
  },
});
