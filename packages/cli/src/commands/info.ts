import { PDFDocument } from "@peculiar/pdf-doc";
import { Command } from "commander";
import * as fs from "fs";

export const info = new Command("info").argument("<pdf file>");

info.description("Prints PDF document information");

info.action(async (file, _options, _command) => {
  const raw = fs.readFileSync(file);
  const doc = await PDFDocument.load(raw);

  const info = await doc.target.toString();

  console.log(info);
});
