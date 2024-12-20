import {
  PDFDocument,
  PDFDocumentLoadParameters
} from "@peculiarventures/pdf-doc";
import * as fs from "node:fs";
import * as path from "node:path";
import { BufferSourceConverter } from "pvtsutils";

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
  return PDFDocument.load(buffer, params);
}
