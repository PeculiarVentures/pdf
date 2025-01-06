import { PDFDocumentCreateParameters } from "@peculiar/pdf-doc";

export const xrefTableOptions: PDFDocumentCreateParameters = {
  useXrefTable: true,
  disableCompressedStreams: true,
  disableAscii85Encoding: true
};
