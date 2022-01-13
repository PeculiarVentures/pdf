import { PDFDateField, PDFDictionary, PDFLiteralStringField, PDFNameField } from "../../objects";
import { PDFDate } from "../common/Date";

export class InformationDictionary extends PDFDictionary {

  @PDFLiteralStringField("Title", true)
  public title!: null | string;

  @PDFLiteralStringField("Author", true)
  public author!: null | string;

  @PDFLiteralStringField("Subject", true)
  public subject!: null | string;

  @PDFLiteralStringField("Keywords", true)
  public keywords!: null | string;

  @PDFLiteralStringField("Creator", true)
  public creator!: null | string;

  @PDFLiteralStringField("Producer", true)
  public producer!: null | string;

  @PDFDateField("CreationDate", true)
  public creationDate!: null | PDFDate;

  @PDFDateField("ModDate")
  public modDate!: PDFDate;

  @PDFNameField("Trapped", true, "Unknown")
  public trapped!: string;
}
