import { PDFArray, PDFArrayField, PDFDictionary, PDFNameField } from "../../objects";

export class PointDataDictionary extends PDFDictionary {

  public static readonly TYPE = "PtData";
  public static readonly SUBTYPE = "Cloud";

  /**
   * The type of PDF object that this dictionary describes; shall be PtData for a point data dictionary
   * @remarks PDF 2.0
   */
  @PDFNameField("Type")
  public type!: typeof PointDataDictionary.TYPE;
  
  /**
   * Shall be Cloud
   * @remarks PDF 2.0
   */
  @PDFNameField("Subtype")
  public subtype!: typeof PointDataDictionary.SUBTYPE;
  
  /**
   * An array of names that identify the internal data elements of the individual point arrays in the XPTS array.
   * 
   * There are three predefined names:
   * - LAT latitude in degrees. The XPTS value is a number type.
   * - LON longitude in degrees. The XPTS value is a number type.
   * - ALT altitude in metres. The XPTS value is a number type. 
   * @remarks PDF 2.0
   */
  @PDFArrayField("Names")
  public names!: PDFArray;
  
  /**
   * An array of arrays of values. The number of members in each
   * interior array shall correspond to the size of the Names array; each member in the
   * interior arrays is of a type defined by the corresponding name in the Names array.
   * 
   * The XPTS array is a collection of tuples without any guaranteed ordering or
   * relationship from point to point. 
   * @remarks PDF 2.0
   */
  @PDFArrayField("XPTS")
  public xpts!: PDFArray;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();

    this.type = PointDataDictionary.TYPE;
    this.subtype = PointDataDictionary.SUBTYPE;
    this.names = document.createArray();
    this.xpts = document.createArray();
  }

}
