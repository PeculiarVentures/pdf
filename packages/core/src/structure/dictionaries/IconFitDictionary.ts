import { PDFArray, PDFArrayField, PDFBooleanField, PDFDictionary, PDFNameField } from "../../objects";



export class IconFitDictionary extends PDFDictionary {

  /**
   * The circumstances under which the icon shall be scaled inside the
   * annotation rectangle:
   * - A Always scale.
   * - B Scale only when the icon is bigger than the annotation rectangle.
   * - S Scale only when the icon is smaller than the annotation rectangle.
   * - N Never scale.
   * 
   * Default value: A. 
   */
  @PDFNameField("SW", true, "A")
  public sw!: "A" | "B" | "S" | "N";

  /**
   * The type of scaling that shall be used:
   * - A Anamorphic scaling: Scale the icon to fill the annotation rectangle exactly,
   * without regard to its original aspect ratio (ratio of width to height).
   * - P Proportional scaling: Scale the icon to fit the width or height of the annotation
   * rectangle while maintaining the icon’s original aspect ratio. If the required
   * horizontal and vertical scaling factors are different, use the smaller of the two,
   * centring the icon within the annotation rectangle in the other dimension.
   * 
   * Default value: P. 
   */
  @PDFNameField("S", true, "P")
  public s!: "A" | "P";

  /**
   * An array of two numbers that shall be between 0.0 and 1.0 indicating the
   * fraction of leftover space to allocate at the left and bottom of the icon. A value of [0.0
   * 0.0] shall position the icon at the bottom-left corner of the annotation rectangle. A
   * value of [0.5 0.5] shall centre it within the rectangle. This entry shall be used only if
   * the icon is scaled proportionally. 
   * 
   * Default value: [0.5 0.5].
   */
  @PDFArrayField("A", true)
  public a!: PDFArray | null;

  /**
   * If true, indicates that the button appearance shall be scaled to fit
   * fully within the bounds of the annotation without taking into consideration the line
   * width of the border. Default value: false. 
   * @remarks PDF 1.5
   */
  @PDFBooleanField("FB", true, false)
  public fb!: boolean;

}
