import * as objects from "../../objects";
import { PDFRectangle } from "../common";

export class OPIv1_3Dictionary extends objects.PDFDictionary {

  public static readonly TYPE = "OPI";
  public static readonly VERSION = 1.3;

  /**
   * The type of PDF object that this dictionary describes; if
   * present, shall be OPI for an OPI dictionary
   */
  @objects.PDFNameField("Type", true, OPIv1_3Dictionary.TYPE)
  public type!: typeof OPIv1_3Dictionary.TYPE;

  /**
   * The version of OPI to which this dictionary refers; shall be the
   * number 1.3 (not the name 1.3, as in an OPI version dictionary). 
   */
  @objects.PDFNumberField("Version")
  public version!: typeof OPIv1_3Dictionary.VERSION;

  /**
   * The external file containing the image corresponding to this proxy.
   * 
   * OPI comment - %ALDImageFilename
   */
  @objects.PDFDictionaryField({
    name: "F",
  })
  public f!: objects.PDFObject; // TODO implement File specification

  /**
   * An identifying string denoting the image. 
   * 
   * OPI comment - %ALDImageID
   */
  @objects.PDFHexStringField("ID", true)
  public id!: objects.PDFHexString | null;

  /**
   * A human-readable comment, typically containing instructions
   * or suggestions to the operator of the OPI server on how to handle the
   * image.
   * 
   * OPI comment - %ALDObjectComments
   */
  @objects.PDFTextStringField("Comments", true)
  public comments!: objects.PDFTextString | null;

  /**
   * An array of two integers of the form
   * 
   * OPI comment - %ALDImageDimensions
   */
  @objects.PDFArrayField("Size", true)
  public sizeField!: objects.PDFArray | null;

  /**
   * An array of four integers of the form
   * 
   * [left top right bottom] 
   * 
   * specifying the portion of the image that shall be used.
   * 
   * OPI comment - %ALDImageCropRect
   */
  @objects.PDFDictionaryField({
    name: "CropRect",
    type: PDFRectangle,
  })
  public cropRect!: PDFRectangle;

  /**
   * An array with the same form and meaning as CropRect, but
   * expressed in real numbers instead of integers. Default value: the value
   * of CropRect.
   * 
   * OPI comment - %ALDImageCropFixed
   */
  @objects.PDFArrayField("CropFixed", true)
  public cropFixed!: objects.PDFArray | null;

  /**
   * An array of eight numbers of the form
   * 
   * [llx lly ulx uly urx ury lrx lry ]
   * 
   * specifying the location on the page of the cropped image, where (llx , lly )
   * are the user space coordinates of the lower-left corner, (ulx , uly ) are
   * those of the upper-left corner, (urx , ury ) are those of the upper-right
   * corner, and (lrx , lry ) are those of the lower-right corner. The specified
   * coordinates shall define a parallelogram; that is, they shall satisfy the
   * conditions
   * 
   * ul𝑥 − llx = urx − lrx
   * 
   * and
   * 
   * uly − lly = ury − lry
   * 
   * The combination of Position and CropRect determines the image’s
   * scaling, rotation, reflection, and skew. 
   * 
   * OPI comment - %ALDImagePosition
   */
  @objects.PDFArrayField("Position", true)
  public position!: objects.PDFArray | null;

  /**
   * An array of two numbers of the form
   * 
   * [horizRes vertRes]
   * 
   * specifying the resolution of the image in samples per inch. 
   * 
   * OPI comment - %ALDImageResolution
   */
  @objects.PDFArrayField("Resolution", true)
  public resolution!: objects.PDFArray | null;

  /**
   * The type of colour specified by the Color entry. Valid values
   * are Process, Spot, and Separation. Default value: Spot. 
   * 
   * OPI comment - %ALDImageColorType
   */
  @objects.PDFNameField("ColorType", true)
  public colorType!: string | null;

  /**
   * An array of four numbers and a byte string of the form
   * 
   * [C M Y K colorName]
   * 
   * specifying the value and name of the colour in which the image is to be
   * rendered. The values of C, M, Y, and K shall all be in the range 0.0 to 1.0.
   * 
   * Default value: [0.0 0.0 0.0 1.0 ( Black )]. 
   * 
   * OPI comment - %ALDImageColor
   */
  @objects.PDFArrayField("Color", true)
  public color!: objects.PDFArray | null;

  /**
   * A number in the range 0.0 to 1.0 specifying the concentration
   * of the colour specified by Color in which the image is to be rendered.
   * 
   * Default value: 1.0. 
   * 
   * OPI comment - %ALDImageTint
   */
  @objects.PDFNumberField("Tint", true, 1.0)
  public tint!: number;

  /**
   * A flag specifying whether the image is to overprint (true) or
   * knock out (false) underlying marks on other separations. 
   * 
   * Default value: false. 
   * 
   * OPI comment - %ALDImageOverprint
   */
  @objects.PDFBooleanField("Overprint", true, false)
  public overprint!: boolean;

  /**
   * An array of two integers of the form
   * 
   * [samples bits]
   * 
   * specifying the number of samples per pixel and bits per sample in the image.
   * 
   * OPI comment - %ALDImageTint
   */
  @objects.PDFArrayField("ImageType", true)
  public imageType!: objects.PDFArray | null;

  /**
   * An array of 2n integers in the range 0 to 65,535 (where n is the
   * number of bits per sample) recording changes made to the brightness or
   * contrast of the image. 
   * 
   * OPI comment - %ALDImageGrayMap
   */
  @objects.PDFArrayField("GrayMap", true)
  public grayMap!: objects.PDFArray | null;

  /**
   * A flag specifying whether white pixels in the image shall be
   * treated as transparent. Default value: true.
   * 
   * OPI comment - %ALDImageTransparency
   */
  @objects.PDFBooleanField("Transparency", true, true)
  public transparency !: boolean;

  /**
   * An array of pairs of the form
   * 
   * [tagNum1 tagText1…tagNumn tagTextn]
   * 
   * where each tagNum is an integer representing a TIFF tag number and
   * each tagText is an ASCII string representing the corresponding ASCII tag
   * value. 
   * 
   * OPI comment - %ALDImageAsciiTag<NNN>
   */
  @objects.PDFArrayField("Tags", true)
  public tags!: objects.PDFArray | null;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();
    const update = document.update;

    this.type = OPIv1_3Dictionary.TYPE;
    this.version = OPIv1_3Dictionary.VERSION;
    this.cropRect = PDFRectangle.createWithData(update, 0, 0, 0, 0);
  }
}

export class OPIv2_0Dictionary extends objects.PDFDictionary {

  public static readonly TYPE = "OPI";
  public static readonly VERSION = 2.0;

  /**
   * The type of PDF object that this dictionary describes; if
   * present, shall be OPI for an OPI dictionary
   */
  @objects.PDFNameField("Type", true, OPIv2_0Dictionary.TYPE)
  public type!: typeof OPIv2_0Dictionary.TYPE;

  /**
   * The version of OPI to which this dictionary
   * refers; shall be the number 2 or 2.0 (not the name 2.0,
   * as in an OPI version dictionary). 
   */
  @objects.PDFNumberField("Version")
  public version!: typeof OPIv2_0Dictionary.VERSION;

  /**
   * The external file containing the image corresponding to this proxy.
   * 
   * OPI comment - %%ImageFilename
   */
  @objects.PDFDictionaryField({
    name: "F",
  })
  public f!: objects.PDFObject; // TODO implement File specification
  
  /**
   * The pathname of the file containing the
   * full-resolution image corresponding to this proxy, or
   * any other identifying string that uniquely identifies
   * the full-resolution image. 
   * 
   * OPI comment - %%MainImage
   */
  @objects.PDFHexStringField("MainImage", true)
  public mainImage!: objects.PDFHexString | null;
  
  /**
   * An array of pairs of the form
   * 
   * [tagNum1 tagText1…tagNumn tagTextn]
   * 
   * where each tagNum is an integer representing a TIFF
   * tag number and each tagText is an ASCII string or an
   * array of ASCII strings representing the corresponding
   * ASCII tag value
   * 
   * OPI comment - %%TIFFASCIITag
   */
  @objects.PDFArrayField("Tags", false)
  public tags!: objects.PDFArray | null;

  /**
   * An array of two numbers of the form
   * 
   * [width height]
   * 
   * specifying the dimensions of the image in pixels.
   * 
   * OPI comment - %%ImageDimensions
   */
  @objects.PDFArrayField("Size", true)
  public sizeField!: objects.PDFArray | null;
  
  /**
   * An array of four numbers of the form
   * 
   * [left top right bottom]
   * 
   * specifying the portion of the image that shall be used.
   * The Size and CropRect entries shall either both be
   * present or both be absent. If present, they shall satisfy
   * the conditions
   * 
   * 0 ≤ left <right ≤ width
   * 
   * and
   * 
   * 0 ≤ top <bottom ≤ height
   * 
   * In this coordinate space, the positive y axis extends
   * vertically downward; hence, the requirement that top
   * <bottom.
   * 
    * OPI comment - %%ImageCropRect
   */
  @objects.PDFDictionaryField({
    name: "CropRect",
    type: PDFRectangle,
    optional: true,
  })
  public cropRect!: PDFRectangle | null;

  /**
   * A flag specifying whether the image is to
   * overprint (true) or knock out (false) underlying
   * marks on other separations. Default value: false. 
   */
   @objects.PDFBooleanField("Overprint", true, false)
   public Overprint!: boolean;
  
  /**
   * A name object or array specifying the
   * colourants to be applied to the image. The value may
   * be the name full_color or registration or an array of
   * the form
   * 
   * [/monochrome name1 tint1…namen tintn]
   * 
   * where each name is a string representing the name of
   * a colourant and each tint is a real number in the range
   * 0.0 to 1.0 specifying the concentration of that
   * colourant to be applied. 
   * 
   * OPI comment - %%ImageInks
   */
  @objects.PDFDictionaryField({
    name: "Inks",
    optional: true,
  })
  public Inks!: objects.PDFName | objects.PDFArray | null;
  
  /**
   * An array of two integers of the form
   * 
   * [pixelsWide pixelsHigh]
   * 
   * specifying the dimensions of the included image in
   * pixels.
   * 
   * OPI comment - %%IncludedImageDimensions
   */
  @objects.PDFDictionaryField({
    name: "IncludedImageDimensions",
    type: objects.PDFArray,
    optional: true,
  })
  public includedImageDimensions!: objects.PDFArray | null; 
  
  /**
   * A number indicating the quality of the
   * included image. Valid values are 1, 2, and 3.
   * 
   * OPI comment - %%IncludedImageQuality
   */
  @objects.PDFNumberField("IncludedImageQuality", true)
  public includedImageQuality!: number | null;


  protected override onCreate(): void {
    super.onCreate();

    this.type = OPIv2_0Dictionary.TYPE;
    this.version = OPIv2_0Dictionary.VERSION;
  }

}

export class OPIDictionary extends objects.PDFDictionary {
  @objects.PDFDictionaryField({
    name: "1.3",
    optional: true,
    type: OPIv1_3Dictionary,
  })
  public v1_3!: OPIv1_3Dictionary | null;

  @objects.PDFDictionaryField({
    name: "1.3",
    optional: true,
    type: OPIv2_0Dictionary,
  })
  public v2_0!: OPIv2_0Dictionary | null;

}

