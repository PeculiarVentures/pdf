import { PDFDictionary, PDFDictionaryField } from "../../objects";

export class AdditionalActionsDictionary extends PDFDictionary {

  /**
   * An action that shall be performed when the cursor enters the
   * annotation’s active area.
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "E",
    optional: true,
    type: PDFDictionary,
  })
  public e!: PDFDictionary | null;

  /**
   * An action that shall be performed when the cursor exits the
   * annotation’s active area.
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "X",
    optional: true,
    type: PDFDictionary,
  })
  public x!: PDFDictionary | null;

  /**
   * An action that shall be performed when the mouse button is
   * pressed inside the annotation’s active area.
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "D",
    optional: true,
    type: PDFDictionary,
  })
  public d!: PDFDictionary | null;

  /**
   * An action that shall be performed when the mouse button is
   * released inside the annotation’s active area. 
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "U",
    optional: true,
    type: PDFDictionary,
  })
  public u!: PDFDictionary | null;

  /**
   * An action that shall be performed when the annotation receives the input focus. 
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "Fo",
    optional: true,
    type: PDFDictionary,
  })
  public fo!: PDFDictionary | null;

  /**
   * An action that shall be performed when the annotation loses the input focus
   * @remarks 
   * - PDF 1.2
   * - widget annotations only)
   */
  @PDFDictionaryField({
    name: "Bl",
    optional: true,
    type: PDFDictionary,
  })
  public bl!: PDFDictionary | null;

  /**
   * An action that shall be performed when the page containing the annotation is opened.
   * @remarks PDF 1.5
   */
  @PDFDictionaryField({
    name: "PO",
    optional: true,
    type: PDFDictionary,
  })
  public po!: PDFDictionary | null;

  /**
   * An action that shall be performed when the page containing the annotation is closed. 
   * @remarks PDF 1.5
   */
  @PDFDictionaryField({
    name: "PC",
    optional: true,
    type: PDFDictionary,
  })
  public pc!: PDFDictionary | null;

  /**
   * An action that shall be performed when the page containing the annotation becomes visible. 
   * @remarks PDF 1.5
   */
  @PDFDictionaryField({
    name: "PV",
    optional: true,
    type: PDFDictionary,
  })
  public pv!: PDFDictionary | null;

  /**
   * An action that shall be performed when the page containing the annotation is no longer visible 
   * in the interactive PDF processor’s user interface.
   * @remarks PDF 1.5
   */
  @PDFDictionaryField({
    name: "PI",
    optional: true,
    type: PDFDictionary,
  })
  public pi!: PDFDictionary | null;


}
