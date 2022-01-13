import { PDFDictionary, PDFDictionaryField, PDFNumberField, PDFNameField } from "../../objects";

export class EncryptDictionary extends PDFDictionary {

  @PDFNameField("Filter")
  public filter!: string;

  @PDFNameField("SubFilter", true)
  public subFilter!: null | string;

  @PDFNumberField("V", true, 0)
  public v!: number;

  @PDFNumberField("Length", true, 40)
  public length!: number;

  @PDFDictionaryField({
    name: "CF",
    optional: true,
    type: PDFDictionary,
  })
  public cf!: null | PDFDictionary;

  @PDFNameField("StmF", true, "Identity")
  public stmF!: string;

  @PDFNameField("StrF", true, "Identity")
  public strF!: string;

  @PDFNameField("EFF", true)
  public eff!: null | string;
}
