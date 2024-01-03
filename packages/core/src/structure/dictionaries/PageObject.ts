import * as objects from "../../objects";
import { PDFContent } from "../../content";
import { PDFDate, PDFRectangle } from "../common";
import type { AnnotationDictionary } from "./Annotation";
import { ResourceDictionary } from "./ResourceDictionary";
import { PageTreeNodesDictionary } from "./PageTreeNodes";
import { PageDictionary } from "./Page";

export enum PageTabsOrders {
  /**
   * Row order
   */
  row = "R",
  /**
   * Column order
   */
  column = "C",
  /**
   * Structure order
   */
  structure = "S",
  /**
   * Annotation array order.
   * @remarks PDF 2.0
   */
  annotationsArray = "A",
  /**
   * Widget order
   * @remarks PDF 2.0
   */
  widget = "order",
}

export class PageObjectDictionary extends PageDictionary {

  public static readonly TYPE = "Page";

  /**
   * The type of PDF object that this dictionary describes
   */
  @objects.PDFNameField("Type")
  public type!: string;

  /**
   * The page tree node (see {@link PageTreeNodesDictionary}) that is the immediate parent of this page object.
   * Objects of Type Template shall have no Parent key.
   */
  @objects.PDFDictionaryField({
    name: "Parent",
    type: PageTreeNodesDictionary,
    indirect: true
  })
  public Parent!: PageTreeNodesDictionary;

  /**
   * The date and time when the page’s contents were most recently modified.
   * @remarks Required if PieceInfo is present; optional otherwise; PDF 1.3
   */
  @objects.PDFDateField("LastModified", true)
  public lastModified!: PDFDate | null;

  /**
   * A rectangle, expressed in default user space units, that shall define
   * the region to which the contents of the page shall be clipped
   * when output in a production environment
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    type: objects.PDFArray,
    name: "BleedBox",
    optional: true,
    get: o => new PDFRectangle(o),
  })
  public bleedBox!: PDFRectangle | null;

  /**
   * A rectangle, expressed in default user space units, that shall define
   * the intended dimensions of the finished page after trimming
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    type: objects.PDFArray,
    name: "TrimBox",
    optional: true,
    get: o => new PDFRectangle(o),
  })
  public trimBox!: PDFRectangle | null;

  /**
   * A rectangle, expressed in default user space units, that shall define
   * the extent of the page’s meaningful content (including potential white-space)
   * as intended by the page’s creator
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    type: objects.PDFArray,
    name: "ArtBox",
    optional: true,
    get: o => new PDFRectangle(o),
  })
  public artBox!: PDFRectangle | null;

  /**
   * A box colour information dictionary that shall specify the colours
   * and other visual characteristics that should be used in displaying
   * guidelines on the screen for the various page boundaries
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    type: objects.PDFDictionary,
    name: "BoxColorInfo",
    optional: true,
  })
  public boxColorInfo!: objects.PDFDictionary | null;

  /**
   * A content stream that shall describe the contents of this page
   */
  @objects.PDFDictionaryField({
    name: "Contents",
    optional: true,
  })
  public contents!: objects.PDFStream | objects.PDFArray | null;

  /**
   * A group attributes dictionary that shall specify the attributes
   * of the page’s page group for use in the transparent imaging model
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "Group",
    type: objects.PDFDictionary,
    optional: true,
  })
  public group!: objects.PDFDictionary | null;

  /**
   * A group attributes dictionary that shall specify the attributes
   * of the page’s page group for use in the transparent imaging model
   */
  @objects.PDFDictionaryField({
    name: "Thumb",
    type: objects.PDFStream,
    optional: true,
  })
  public thumb!: objects.PDFStream | null;

  /**
   * An array that shall contain indirect references to all article beads
   * appearing on the page
   * @remarks PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "B",
    type: objects.PDFArray,
    optional: true,
  })
  public b!: objects.PDFArray | null;

  /**
   * The page’s display duration (also called its advance timing):
   * the maximum length of time, in seconds, that the page shall be
   * displayed during presentations before the viewer application shall
   * automatically advance to the next page
   * @remarks PDF 1.1
   */
  @objects.PDFNumberField("Dur", true)
  public dur!: objects.PDFNumeric | null;

  /**
   * A transition dictionary describing the transition effect
   * that shall be used when displaying the page during presentations
   * @remarks PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "Trans",
    type: objects.PDFDictionary,
    optional: true,
  })
  public trans!: objects.PDFDictionary | null;

  /**
   * An array of annotation dictionaries that shall contain indirect references
   * to all annotations associated with the page
   */
  @objects.PDFDictionaryField({
    name: "Annots",
    type: objects.PDFArray,
    optional: true,
  })
  public annots!: objects.PDFArray | null;

  /**
   * An additional-actions dictionary that shall define actions to be performed
   * when the page is opened or closed
   * @remarks PDF 1.2
   */
  @objects.PDFDictionaryField({
    name: "AA",
    type: objects.PDFDictionary,
    optional: true,
  })
  public aa!: objects.PDFDictionary | null;

  /**
   * A metadata stream that shall contain metadata for the page
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "Metadata",
    type: objects.PDFStream,
    optional: true,
  })
  public metadata!: objects.PDFStream | null;

  /**
   * A page-piece dictionary associated with the page
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "PieceInfo",
    type: objects.PDFDictionary,
    optional: true,
  })
  public pieceInfo!: objects.PDFDictionary | null;

  /**
   * The integer key of the page’s entry in the structural parent tree
   * @remarks PDF 1.3
   */
  @objects.PDFNumberField("StructParents", true)
  public structParents!: number | null;

  /**
   * The digital identifier of the page’s parent Web Capture content set
   * @remarks PDF 1.3
   */
  @objects.PDFTextField("ID", objects.PDFHexString, true)
  public ID!: objects.PDFTextString | null;

  /**
   * The page’s preferred zoom (magnification) factor: the factor by which
   * it shall be scaled to achieve the natural display magnification
   * @remarks PDF 1.3
   */
  @objects.PDFNumberField("PZ", true)
  public pz!: number | null;

  /**
   * A separation dictionary that shall contain information needed
   * to generate colour separations for the page
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "SeparationInfo",
    type: objects.PDFDictionary,
    optional: true,
  })
  public separationInfo!: objects.PDFDictionary | null;

  /**
   * A name specifying the tab order that shall be used for annotations on the page
   * @remarks PDF 1.5
   */
  @objects.PDFNameField("Tabs", true)
  public tabs!: PageTabsOrders | null;

  /**
   * The name of the originating page object
   * @remarks PDF 1.5
   */
  @objects.PDFNameField("TemplateInstantiated", true)
  public templateInstantiated!: PageTabsOrders | null;

  /**
   * A navigation node dictionary that shall represent the first node on the page
   * @remarks PDF 1.5
   */
  @objects.PDFDictionaryField({
    name: "PresSteps",
    type: objects.PDFDictionary,
    optional: true,
  })
  public presSteps!: objects.PDFDictionary | null;

  /**
   * A positive number that shall give the size of default user space units,
   * in multiples of 1 ⁄ 72 inch. The range of supported values shall be
   * implementation-dependent. Default value: 1.0
   * @remarks PDF 1.6
   */
  @objects.PDFNumberField("UserUnit", true, 1.0)
  public userUnit!: number;

  /**
   * An array of viewport dictionaries that shall specify rectangular regions of the page
   * @remarks PDF 1.6
   */
  @objects.PDFArrayField("VP", true)
  public vp!: objects.PDFArray | null;

  /**
   * An array of one or more file specification dictionaries which denote the
   * associated files for this page
   * @remarks PDF 2.0
   */
  @objects.PDFArrayField("AF", true)
  public af!: objects.PDFArray | null;

  /**
   * An array of output intent dictionaries that shall specify the colour characteristics
   * of output devices on which this page might be rendered
   * @remarks PDF 2.0
   */
  @objects.PDFArrayField("OutputIntents", true)
  public outputIntents!: objects.PDFArray | null;

  /**
   * The DPart dictionary whose range of pages includes this page object
   * @remarks PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "DPart",
    type: objects.PDFDictionary,
    optional: true,
    indirect: true
  })
  public dPart!: objects.PDFDictionary | null;

  protected override onCreate(): void {
    const update = this.getDocumentUpdate();

    this.type = PageObjectDictionary.TYPE;
    this.Resources = ResourceDictionary.create(update);
    this.MediaBox = this.createMediaBox("210mm", "297mm"); // A4
  }

  protected getOrCreateContents(): objects.PDFArray | objects.PDFStream {
    if (!this.contents) {
      this.modify();

      this.contents = objects.PDFArray.create(this.getDocumentUpdate());
    }

    return this.contents;
  }

  /**
   * Adds annotation and links it with the page
   * @param annot Annotation dictionary
   * @remarks If PageObject doesn't have a list of annotation creates it
   */
  public addAnnot(annot: AnnotationDictionary): void {
    if (!this.annots) {
      this.annots = this.getDocument().createArray();
    }

    this.annots.push(annot.makeIndirect());
    annot.p = this;
  }

  public addContent(content: PDFContent): void {
    this.modify();

    const contents = this.getOrCreateContents();
    if (contents instanceof objects.PDFArray) {
      // TODO Maybe add document.createContentStream
      const contentStream = this.getDocumentUpdate().document.createStream(content.toArrayBuffer());
      contents.items.push(contentStream.makeIndirect());
    } else {
      throw new Error("Stream is not supported yet");
    }
  }

}
