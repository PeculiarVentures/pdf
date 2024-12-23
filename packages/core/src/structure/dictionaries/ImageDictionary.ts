import * as objects from "../../objects";
import { XObjectDictionary, XOBJECT_TYPE } from "./XObjectDictionary";

export class ImageDictionary
  extends objects.PDFStream
  implements XObjectDictionary
{
  public static readonly SUBTYPE = "Image";
  public static readonly WIDTH = 0;
  public static readonly HEIGHT = 0;

  /**
   * The type of PDF object that this dictionary describes. If present, shall be XObject for a form XObject.
   */
  @objects.PDFNameField("Type", true, XOBJECT_TYPE)
  public Type!: typeof XOBJECT_TYPE;

  /**
   * The type of XObject that this dictionary describes. Shall be Image for an image XObject.
   */
  @objects.PDFNameField("Subtype")
  public Subtype!: typeof ImageDictionary.SUBTYPE;

  /**
   * The width of the image, in samples
   */
  @objects.PDFNumberField("Width")
  public Width!: number;

  /**
   * The height of the image, in samples
   */
  @objects.PDFNumberField("Height")
  public Height!: number;

  /**
   * The colour space in which image samples shall be specified; it can be any type of colour space except Pattern.
   * If the image uses the JPXDecode filter, this entry may be present:
   * - If ColorSpace is present, any colour space specifications in the
   *   JPEG2000 data shall be ignored.
   * - If ColorSpace is absent, the colour space specifications in the
   *   JPEG2000 data shall be used. The Decode array shall also be
   *   ignored unless ImageMask is true.
   * @remarks
   * - Required for images, except those that use the JPXDecode filter
   * - Not permitted for image masks
   */
  @objects.PDFDictionaryField({
    name: "ColorSpace",
    optional: true
  })
  public ColorSpace!: objects.PDFArray | objects.PDFName | null;

  /**
   * The number of bits used to represent each colour component. Only
   * a single value shall be specified; the number of bits shall be the same for
   * all colour components. The value shall be 1, 2, 4, 8, or (in PDF 1.5) 16. If
   * ImageMask is true, this entry is optional, but if specified, its value shall
   * be 1.
   * If the image stream uses a filter, the value of BitsPerComponent shall be
   * consistent with the size of the data samples that the filter delivers. In
   * particular, a CCITTFaxDecode or JBIG2Decode filter shall always
   * deliver 1-bit samples, a RunLengthDecode or DCTDecode filter shall
   * always deliver 8-bit samples, and an LZWDecode or FlateDecode filter
   * shall deliver samples of a specified size if a predictor function is used.
   * If the image stream uses the JPXDecode filter, this entry is optional and
   * shall be ignored if present. The bit depth is determined by the PDF
   * processor in the process of decoding the JPEG2000 image.
   * @remarks
   * - Required except for image masks and images that use the JPXDecode
   * filter
   */
  @objects.PDFNumberField("BitsPerComponent", true)
  public BitsPerComponent!: number | null;

  /**
   * The name of a colour rendering intent that shall be
   * used in rendering any image that is not an image mask (see 8.6.5.8,
   * "Rendering intents"). This value is ignored if ImageMask is true. Default
   * value: the current rendering intent in the graphics state.
   * @remarks PDF 1.1
   */
  @objects.PDFNameField("Intent", true)
  public Intent!: string | null;

  /**
   * A flag indicating whether the image shall be treated as an
   * image mask (see 8.9.6, "Masked images"). If this flag is true, the value of
   * BitsPerComponent, if present, shall be 1 and Mask and
   * ColorSpace shall not be specified; unmasked areas shall be painted using
   * the current non-stroking colour.
   *
   * Default value: false.
   */
  @objects.PDFBooleanField("ImageMask", true, false)
  public ImageMask!: boolean;

  /**
   * An image XObject defining an image mask to be applied to this image (see 8.9.6.3,
   * "Explicit masking"),or an array specifying a range of colours to be applied
   * to it as a colour key mask (see 8.9.6.4, "Colour key masking"). If
   * ImageMask is true, this entry shall not be present.
   * @remarks
   * - Shall not be present for image masks
   * - PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "Mask",
    optional: true
  })
  public Mask!: objects.PDFStream | objects.PDFArray | null;

  /**
   * An array of numbers describing how to map image samples
   * into the range of values appropriate for the image’s colour space (see
   * 8.9.5.2, "Decode arrays"). If ImageMask is true, the array shall be either
   * [0 1] or [1 0]; otherwise, its length shall be twice the number of colour
   * components required by ColorSpace. If the image uses the
   * JPXDecode filter and ImageMask is false, Decode shall be ignored by a
   * PDF processor.
   * Default value: see Table 88.
   */
  @objects.PDFArrayField("Decode", true)
  public Decode!: objects.PDFArray | null;

  /**
   * A flag indicating whether image interpolation shall be
   * performed by a PDF processor (see 8.9.5.3, "Image interpolation").
   *
   * Default value: false.
   */
  @objects.PDFBooleanField("Interpolate", true, false)
  public Interpolate!: boolean;

  /**
   * An array of alternate image dictionaries for this image
   * (see 8.9.5.4, "Alternate images"). This entry shall not be present in an
   * image XObject that is itself an alternate image.
   * @remarks PDF 1.3
   */
  @objects.PDFArrayField("Alternates", true)
  public Alternates!: objects.PDFArray | null;

  /**
   * A subsidiary image XObject defining a soft-mask
   * image (see 11.6.5.2, "Soft-mask images") that shall be used as a source of
   * mask shape or mask opacity values in the transparent imaging model.
   * The alpha source parameter in the graphics state determines whether the
   * mask values shall be interpreted as shape or opacity.
   *
   * If present, this entry shall override the current soft mask in the graphics
   * state, as well as the image’s Mask entry, if any. However, the other
   * transparency-related graphics state parameters — blend mode and alpha
   * constant — shall remain in effect. If SMask is absent, the image shall have
   * no associated soft mask (although the current soft mask in the graphics
   * state may still apply).
   * @remarks PDF 1.4
   */
  @objects.PDFStreamField("SMask", false)
  public SMask!: objects.PDFStream | null;

  /**
   * A code specifying how soft-mask information (see 11.6.5.2,
   * "Soft-mask images") encoded with image samples shall be used:
   *
   * 0 If present, encoded soft-mask image information shall be ignored.
   *
   * 1 The image’s data stream includes encoded soft-mask values. A PDF
   *   processor shall create a soft-mask image from the information to be
   *   used as a source of mask shape or mask opacity in the transparency
   *   imaging model.
   *
   * 2 The image’s data stream includes colour channels that have been
   *   preblended with a background; the image data also includes an
   *   opacity channel. A PDF processor shall create a soft-mask image
   *   with a Matte entry from the opacity channel information to be used
   *   as a source of mask shape or mask opacity in the transparency
   *   model.
   *
   * If this entry has a non-zero value, SMask shall not be specified. See also
   * 7.4.9, "JPXDecode filter".
   *
   * Default value: 0.
   *
   * @remarks
   * - Optional for images that use the JPXDecode filter, meaningless otherwise
   * - PDF 1.5
   */
  @objects.PDFNumberField("SMaskInData", true)
  public SMaskInData!: number | null;

  /**
   * The name by which this image XObject is referenced in the XObject subdictionary of
   * the current resource dictionary (see 7.8.3, "Resource dictionaries").
   * @remarks
   * - Required in PDF 1.0
   * - Optional otherwise
   * - Deprecated in PDF 2.0
   * @deprecated
   */
  @objects.PDFNameField("Name", false)
  public Name!: objects.PDFName | null;

  /**
   * The integer key of the image’s entry in the structural parent tree (see 14.7.5.4,
   * "Finding structure elements from content items").
   * @remarks
   * - Required if the image is a structural content item
   * - PDF 1.3
   */
  @objects.PDFNumberField("StructParent", true)
  public StructParent!: number | null;

  /**
   * The digital identifier of the image’s parent Web Capture content set (see 14.10.6, "Object
   * attributes related to web capture").
   * @remarks
   * - PDF 1.3
   * - indirect reference preferred
   */
  @objects.PDFDictionaryField({
    name: "ID",
    optional: true,
    indirect: true
  })
  public ID!: objects.PDFHexString | null;

  /**
   * An OPI version dictionary for
   * the image; see 14.11.7, "Open prepress interface (OPI)". If ImageMask is
   * true, this entry shall be ignored.
   * @remarks
   * - PDF 1.2
   * - Deprecated in PDF 2.0
   * @deprecated
   */
  @objects.PDFDictionaryField({
    name: "OPI",
    type: objects.PDFDictionary,
    optional: true
  })
  public OPI!: objects.PDFDictionary | null;

  /**
   * A metadata stream containing metadata for the image
   * (see 14.3.2, "Metadata streams").
   * @remarks PDF 1.4
   */
  @objects.PDFStreamField("Metadata", true)
  public Metadata!: objects.PDFStream | null;

  /**
   * An optional content group or optional content
   * membership dictionary (see 8.11, "Optional content"), specifying the
   * optional content properties for this image XObject. Before the image is
   * processed by a PDF processor, its visibility shall be determined based on
   * this entry. If it is determined to be invisible, the entire image shall be
   * skipped, as if there were no Do operator to invoke it.
   * @remarks PDF 1.5
   */
  @objects.PDFDictionaryField({
    name: "OC",
    type: objects.PDFDictionary,
    optional: true
  })
  public OC!: objects.PDFDictionary | null;

  /**
   * An array of one or more file specification dictionaries
   * (7.11.3, "File specification dictionaries") which denote the associated
   * files for this Image XObject. See 14.13, "Associated files" and 14.13.7,
   * "Associated files linked to XObjects" for more details.
   * @remarks PDF 2.0
   */
  @objects.PDFArrayField("AF", true)
  public AF!: objects.PDFArray | null;

  /**
   * A measure dictionary (see "Table 265: Entries in a
   * measure dictionary") that specifies the scale and units which shall apply
   * to the image.
   * @remarks PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "Measure",
    type: objects.PDFDictionary,
    optional: true
  })
  public Measure!: objects.PDFDictionary | null;

  /**
   * A point data dictionary (see "Table 271: Entries in a
   * point data dictionary") that specifies the extended geospatial data that
   * shall apply to the image.
   * @remarks PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "PtData",
    type: objects.PDFDictionary,
    optional: true
  })
  public PtData!: objects.PDFDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    this.Type = this.Type = XOBJECT_TYPE;
    this.Subtype = ImageDictionary.SUBTYPE;
    this.Width = ImageDictionary.WIDTH;
    this.Height = ImageDictionary.HEIGHT;
  }
}
