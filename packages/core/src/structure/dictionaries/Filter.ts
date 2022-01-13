import { PDFDictionary, PDFNumberField, PDFNameField } from "../../objects";

export class FilterDictionary extends PDFDictionary {

  @PDFNumberField("Type", true)
  public type!: null | string;

  @PDFNameField("CFM", true, "None")
  public cfm!: string;

  @PDFNameField("AuthEvent", true, "DocOpen")
  public authEvent!: string;

  @PDFNumberField("Length", true)
  public length!: null | number;

}
