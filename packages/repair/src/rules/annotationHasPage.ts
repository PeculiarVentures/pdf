import { PDFDocument } from "@peculiar/pdf-doc";
import { globalRepairRegistry } from "../PDFRepairRegistry";
import { PDFDictionary } from "@peculiar/pdf-core";

globalRepairRegistry.addRule({
  id: "annotationHasPage",
  description: "Checks if Annotation has /P (Page) field",
  apply: async (doc: PDFDocument) => {
    const notes: string[] = [];
    for (const page of doc.pages) {
      for (const annot of page.target.annots || []) {
        if (!(annot instanceof PDFDictionary)) {
          continue;
        }

        if (!annot.has("P")) {
          const objRef = annot.getIndirect();
          const pageRef = page.target.getIndirect();
          annot.set("P", page.target);

          notes.push(
            `Annotation '${objRef.id} ${objRef.generation} R' has no P. Set P to page '${pageRef.id} ${pageRef.generation} R'`
          );
        }
      }
    }

    return notes;
  }
});
