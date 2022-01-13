import { PDFContentStream } from "../../content";
import * as objects from "../../objects";
import { Metrics, PDFDate, PDFRectangle } from "../common";
import { FileSpecificationDictionary } from "./FileSpecificationDictionary";
import { MeasureDictionary, MeasureFactory } from "./MeasureDictionary";
import { OPIDictionary } from "./OPIDictionary";
import { PointDataDictionary } from "./PointDataDictionary";
import { ResourceDictionary } from "./ResourceDictionary";
import { XObjectDictionary, XOBJECT_TYPE } from "./XObjectDictionary";

export class FormDictionary extends PDFContentStream implements XObjectDictionary {

  public static readonly SUBTYPE = "Form";

  /**
   * The type of PDF object that this dictionary describes. If present, shall be XObject for a form XObject. 
   */
  @objects.PDFNameField("Type", true, XOBJECT_TYPE)
  public Type!: typeof XOBJECT_TYPE;

  /**
   * The type of XObject that this dictionary describes. Shall be
   * Form for a form XObject.
   */
  @objects.PDFNameField("Subtype", false, FormDictionary.SUBTYPE)
  public Subtype!: typeof FormDictionary.SUBTYPE;

  /**
   * A code identifying the type of form XObject that this dictionary describes. 
   * The only valid value is 1. 
   * 
   * Default value: 1. 
   */
  @objects.PDFNumberField("FormType", true, 1)
  public formType!: number;

  /**
   * An array of four numbers in the form coordinate system (see
   * above), giving the coordinates of the left, bottom, right, and top edges,
   * respectively, of the form XObject’s bounding box. These boundaries shall
   * be used to clip the form XObject and to determine its size for caching. 
   */
  @objects.PDFDictionaryField({
    name: "BBox",
    type: PDFRectangle,
  })
  public bBox!: PDFRectangle;

  /**
   * An array of six numbers specifying the form matrix, which
   * maps form space into user space (see 8.3.4, "Transformation matrices").
   * 
   * Default value: the identity matrix [1 0 0 1 0 0]. 
   */
  @objects.PDFMaybeField("Matrix", Metrics)
  public matrix!: objects.Maybe<Metrics>;

  /**
   * A dictionary specifying any resources (such as fonts and images) required 
   * by the form XObject (see 7.8, "Content streams and resources").
   * 
   * In a PDF whose version is 1.1 and earlier, all named resources used in the
   * form XObject shall be included in the resource dictionary of each page
   * object on which the form XObject appears, regardless of whether they
   * also appear in the resource dictionary of the form XObject. These
   * resources should also be specified in the form XObject’s resource
   * dictionary as well, to determine which resources are used inside the form
   * XObject. If a resource is included in both dictionaries, it shall have the
   * same name in both locations.
   * 
   * In PDF 1.2 and later versions, form XObjects may be independent of the
   * content streams in which they appear, and this is strongly recommended
   * although not required. In an independent form XObject, the resource
   * dictionary of the form XObject is required and shall contain all named
   * resources used by the form XObject. These resources shall not be
   * promoted to the outer content stream’s resource dictionary, although
   * that stream’s resource dictionary refers to the form XObject. 
   * @remarks 
   * - Optional but strongly recommended
   * - PDF 1.2
   */
  @objects.PDFMaybeField("Resources", ResourceDictionary)
  public Resources!: objects.Maybe<ResourceDictionary>;

  /**
   * A group attributes dictionary indicating that the
   * contents of the form XObject shall be treated as a group and specifying
   * the attributes of that group (see 8.10.3, "Group XObjects").
   * 
   * If a Ref entry (see below) is present, the group attributes shall also apply
   * to the external page imported by that entry, which allows such an
   * imported page to be treated as a group without further modification.
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "Group",
    type: objects.PDFDictionary,
    optional: true,
  })
  public group!: objects.PDFDictionary | null;

  /**
   * A reference dictionary identifying a page to be
   * imported from another PDF file, and for which the form XObject serves as
   * a proxy (see 8.10.4, "Reference XObjects"). 
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "Ref",
    type: objects.PDFDictionary,
    optional: true,
  })
  public ref!: objects.PDFDictionary | null;
  
  /**
   * A metadata stream containing metadata for the form
   * XObject (see 14.3.2, "Metadata streams"). 
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "Metadata",
    type: objects.PDFStream,
    optional: true,
  })
  public metadata!: objects.PDFStream | null;

  /**
   * A page-piece dictionary associated with the form XObject (see 14.5, "Page-piece dictionaries").
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "PieceInfo",
    type: objects.PDFDictionary,
    optional: true,
  })
  public pieceInfo!: objects.PDFDictionary | null;

  /**
   * The date and time (see 7.9.4, "Dates") when the form XObject’s contents were
   * most recently modified. If a page-piece dictionary (PieceInfo) is present,
   * the modification date shall be used to ascertain which of the application
   * data dictionaries it contains correspond to the current content of the
   * form (see 14.5, "Page-piece dictionaries").
   * @remarks
   * - Required if PieceInfo is present, optional otherwise
   * - PDF 1.3
   */
  @objects.PDFDateField("LastModified", true)
  public lastModified!: PDFDate | null;

  /**
   * The integer key of the form XObject’s entry in the structural parent tree (see
   * 14.7.5.4, "Finding structure elements from content items"). 
   * @remarks
   * - Required if the form XObject is a structural content item
   * - PDF 1.3
   */
  @objects.PDFNumberField("StructParent", true)
  public structParent!: number | null;

  /**
   * (Required if the form XObject contains marked-content sequences that are
   * structural content items; PDF 1.3) The integer key of the form XObject’s
   * entry in the structural parent tree (see 14.7.5.4, "Finding structure
   * elements from content items").
   * 
   * At most one of the entries StructParent or StructParents shall be
   * present. A form XObject shall be either a content item in its entirety or a
   * container for marked-content sequences that are content items, but not
   * both. 
   * @remarks
   * - Required if the form XObject contains marked-content sequences that are
   * structural content items
   * - PDF 1.3
   */
  @objects.PDFNumberField("StructParents", true)
  public structParents!: number | null;

  /**
   * An OPI version dictionary for the form XObject (see 14.11.7, "Open prepress interface (OPI)"). 
   * @remarks 
   * - PDF 1.2
   * - Deprecated in PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "OPI",
    optional: true,
    type: OPIDictionary,
  })
  public opi!: OPIDictionary;

  /**
   * An optional content group or optional content
   * membership dictionary (see 8.11, "Optional content") specifying the
   * optional content properties for the form XObject. Before the form is
   * processed, its visibility shall be determined based on this entry. If it is
   * determined to be invisible, the entire form shall be skipped, as if there
   * were no Do operator to invoke it. 
   * @remarks PDF 1.5
   */
  @objects.PDFDictionaryField({
    name: "OC",
    optional: true,
    type: objects.PDFDictionary, // TODO Implement "Optional content" (see 8.11)
  })
  public oc!: objects.PDFDictionary;

  /**
   * The name by which this form XObject is referenced in the XObject subdictionary of
   * the current resource dictionary (see 7.8.3, "Resource dictionaries"). 
   * @remarks 
   * - Required in PDF 1.0, optional otherwise
   * - Deprecated in PDF 2.0
   */
  @objects.PDFNameField("Name", true)
  public name!: string | null;

  /**
   * An array of one or more file specification dictionaries
   * ({@link FileSpecificationDictionary}}) which denote the associated
   * files for this Image XObject.
   * @remarks PDF 2.0
   */
  @objects.PDFArrayOrDictionaryField("AF", true)
  public af!: FileSpecificationDictionary | objects.PDFArray | null;

  /**
   * A measure dictionary (see {@link MeasureDictionary}) that specifies the scale and units which shall apply
   * to the image. 
   * @remarks PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "Measure",
    optional: true,
    type: MeasureDictionary,
    get: (v) => {
      const MeasureType = MeasureFactory.get(v.subtype);

      return new MeasureType(v);
    },
  })
  public measure!: MeasureDictionary | null;

  /**
   * A point data dictionary (see {@link PointDataDictionary}) that specifies the extended geospatial data that
   * shall apply to the form. 
   * @remarks PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "PtData",
    optional: true,
    type: PointDataDictionary,
  })
  public ptData!: PointDataDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    this.Type = XOBJECT_TYPE;
    this.Subtype = FormDictionary.SUBTYPE;
    this.bBox = PDFRectangle.createWithData(this.getDocumentUpdate(), 0, 0, 0, 0);
    this.formType = 1;
    this.Resources.set(ResourceDictionary.create(this.getDocumentUpdate()));
  }

}
