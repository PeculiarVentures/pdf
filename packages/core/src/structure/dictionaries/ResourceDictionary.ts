import { PDFArray, PDFDictionary, PDFDictionaryField } from "../../objects";

export class ResourceDictionary extends PDFDictionary {

  /**
   * A dictionary that maps resource names to graphics state
   * parameter dictionaries (see 8.4.5, "Graphics state parameter
   * dictionaries"). 
   */
  @PDFDictionaryField({
    name: "ExtGState",
    type: PDFDictionary,
    optional: true,
  })
  public extGState!: PDFDictionary | null;
  
  /**
   * A dictionary that maps each resource name to either the name
   * of a device-dependent colour space or an array describing a colour space
   */
  @PDFDictionaryField({
    name: "ColorSpace",
    type: PDFDictionary,
    optional: true,
  })
  public colorSpace!: PDFDictionary | null;
  
  /**
   * A dictionary that maps resource names to pattern object
   */
  @PDFDictionaryField({
    name: "Pattern",
    type: PDFDictionary,
    optional: true,
  })
  public pattern!: PDFDictionary | null;
  
  /**
   * A dictionary that maps resource names to shading dictionaries 
   */
  @PDFDictionaryField({
    name: "Shading",
    type: PDFDictionary,
    optional: true,
  })
  public Shading!: PDFDictionary | null;
  
  /**
   * A dictionary that maps resource names to external objects
   */
  @PDFDictionaryField({
    name: "XObject",
    type: PDFDictionary,
    optional: true,
  })
  public XObject!: PDFDictionary | null;
  
  /**
   * A dictionary that maps resource names to font dictionaries
   */
  @PDFDictionaryField({
    name: "Font",
    type: PDFDictionary,
    optional: true,
  })
  public font!: PDFDictionary | null;
  
  /**
   * An array of predefined procedure set names
   * @deprecated Deprecated in PDF 2.0
   */
  @PDFDictionaryField({
    name: "ProcSet",
    type: PDFDictionary,
    optional: true,
  })
  public procSet!: PDFArray | null;
  
  /**
   * A dictionary that maps resource names to property list dictionaries for marked content
   */
  @PDFDictionaryField({
    name: "Properties",
    type: PDFDictionary,
    optional: true,
  })
  public properties!: PDFDictionary | null;

}
