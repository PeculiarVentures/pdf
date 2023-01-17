import { PDFDateField, PDFDictionary, PDFLiteralStringField, PDFNameField } from "../../objects";
import { PDFDate } from "../common/Date";

export class InformationDictionary extends PDFDictionary {

  @PDFLiteralStringField("Title", true)
  public Title!: null | string;

  @PDFLiteralStringField("Author", true)
  public Author!: null | string;

  @PDFLiteralStringField("Subject", true)
  public Subject!: null | string;

  @PDFLiteralStringField("Keywords", true)
  public Keywords!: null | string;

  @PDFLiteralStringField("Creator", true)
  public Creator!: null | string;

  @PDFLiteralStringField("Producer", true)
  public Producer!: null | string;

  @PDFDateField("CreationDate", true)
  public CreationDate!: null | PDFDate;

  @PDFDateField("ModDate")
  public ModDate!: PDFDate;

  @PDFNameField("Trapped", true, "Unknown")
  public Trapped!: string;
}
