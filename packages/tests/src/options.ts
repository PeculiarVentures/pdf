import { PDFDocumentCreateParameters } from "@peculiarventures/pdf-doc";

export const xrefTableOptions: PDFDocumentCreateParameters = {
  useXrefTable: true,
  disableCompressedStreams: true,
  disableAscii85Encoding: true
};
