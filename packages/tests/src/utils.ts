import {
  PDFDocument,
  PDFDocumentLoadParameters
} from "@peculiarventures/pdf-doc";
import * as fs from "node:fs";
import * as path from "node:path";
import { BufferSourceConverter } from "pvtsutils";
import { xrefTableOptions } from "./options";

export async function writePdfFile(
  data: BufferSource | PDFDocument,
  name = "tmp"
): Promise<string> {
  if (data instanceof PDFDocument) {
    data = await data.save();
  }

  const buffer = BufferSourceConverter.toArrayBuffer(data);
  const filePath = path.resolve(__dirname, `../../../${name}.pdf`);
  fs.writeFileSync(filePath, Buffer.from(buffer), { flag: "w+" });
  return filePath;
}

export async function reopenPdfDocument(
  doc: PDFDocument,
  params?: PDFDocumentLoadParameters
): Promise<PDFDocument> {
  const buffer = await doc.save();
  const doc2 = await PDFDocument.load(buffer, params);
  doc2.target.options.disableAscii85Encoding =
    doc.target.options.disableAscii85Encoding;
  doc2.target.options.disableCompressedStreams =
    doc.target.options.disableCompressedStreams;
  doc2.target.options.disableCompressedObjects =
    doc.target.options.disableCompressedObjects;

  return doc2;
}

export async function createPdfWithPage(
  options = xrefTableOptions
): Promise<PDFDocument> {
  const doc = await PDFDocument.create(options);
  doc.pages.create();
  return doc;
}
