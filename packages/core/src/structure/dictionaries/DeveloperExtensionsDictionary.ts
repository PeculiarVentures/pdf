import { PDFDictionary, PDFNameField, PDFNumberField, PDFTextString, PDFTextStringField } from "../../objects";

export class DeveloperExtensionsDictionary extends PDFDictionary {

  public static readonly TYPE = "DeveloperExtensions";

  /**
   * The type of PDF object that this dictionary describes; if present, shall
   * be DeveloperExtensions.
   * @remarks
   * - Optional
   */
  @PDFNameField("Type", true, DeveloperExtensionsDictionary.TYPE)
  public Type!: typeof DeveloperExtensionsDictionary.TYPE;
  
  /**
   * The name of the PDF version to which this extension applies. The name
   * shall be consistent with the syntax used for the Version entry of the catalog
   * dictionary (see 7.7.2, "Document catalog dictionary"). 
   * @remarks
   * - Required
   */
  @PDFNameField("BaseVersion")
  public BaseVersion!: string;
  
  /**
   * An integer defined by the developer to denote the extension being
   * used. If the developer introduces more than one extension to a
   * given BaseVersion the extension level numbers assigned by that developer shall
   * increase over time.
   * @remarks
   * - Required
   */
  @PDFNumberField("ExtensionLevel")
  public ExtensionLevel!: number;
  
  /**
   * A URL that refers to the documentation for this extension (see Annex E,
   * "PDF Name Registry").
   * @remarks
   * - Optional
   */
  @PDFTextStringField("URL", true)
  URL!: PDFTextString | null;
  
  protected override onCreate(): void {
    super.onCreate();
    
    this.BaseVersion = "";
    this.ExtensionLevel = 0;
  }

}
