import { PDFDate } from "../../structure/common/Date";
import { PDFDictionaryField } from "./field";

export function PDFDateField(name: string, optional = false, defaultValue?: Date): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFDate,
    optional,
    defaultValue,
  });
}
