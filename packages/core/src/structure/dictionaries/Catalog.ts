import { DocumentSecurityStoreDictionary } from "../../forms/DocumentSecurityStore";
import * as objects from "../../objects";
import { ExtensionsDictionary } from "./ExtensionsDictionary";
import { InteractiveFormDictionary } from "./InteractiveForm";
import { NameDictionary } from "./Name";
import { PageTreeNodesDictionary } from "./PageTreeNodes";

/**
 * Page layout enum
 */
export enum PageLayout {
  /**
   * Display one page at a time
   */
  singlePage = "SinglePage",
  /**
   * Display the pages in one column
   */
  oneColumn = "OneColumn",
  /**
   * Display the pages in two columns,
   * with odd-numbered pages on the left
   */
  twoColumnLeft = "TwoColumnLeft",
  /**
   * Display the pages in two columns,
   * with odd-numbered pages on the right
   */
  twoColumnRight = "TwoColumnRight",
  /**
   * (PDF 1.5) Display the pages two at a time,
   * with odd-numbered pages on the left
   */
  twoPageLeft = "TwoPageLeft",
  /**
   * (PDF 1.5) Display the pages two at a time,
   * with odd - numbered pages on the right
   */
  twoPageRight = "TwoPageRight"
}

/**
 * Page mode enum
 */
export enum PageMode {
  /**
   * Neither document outline nor thumbnail images visible
   */
  useNone = "UseNone",
  /**
   * Document outline visible
   */
  useOutlines = "UseOutlines",
  /**
   * Thumbnail images visible
   */
  useThumbs = "UseThumbs",
  /**
   * Full-screen mode, with no menu bar, window controls,
   * or any other window visible
   */
  fullScreen = "FullScreen",
  /**
   * (PDF 1.5) Optional content group panel visible
   */
  useOC = "UseOC",
  /**
   * (PDF 1.6) Attachments panel visible
   */
  useAttachments = "UseAttachments"
}

export class CatalogDictionary extends objects.PDFDictionary {
  public static readonly TYPE = "Catalog";
  /**
   * The type of PDF object that this dictionary describes
   */
  @objects.PDFNameField("Type")
  public Type!: typeof CatalogDictionary.TYPE;

  /**
   * The version of the PDF specification to which the document conforms
   * @remarks PDF 1.4
   */
  @objects.PDFNameField("Version", true)
  public Version!: string | null;

  /**
   * An extensions dictionary containing developer prefix identification
   * and version numbers for developer extensions
   */
  @objects.PDFMaybeField("Extensions", ExtensionsDictionary, true)
  public Extensions!: objects.Maybe<ExtensionsDictionary>;

  /**
   * The page tree node that shall be the root of the document’s page tree
   */
  @objects.PDFDictionaryField({
    name: "Pages",
    type: PageTreeNodesDictionary,
    indirect: true
  })
  public Pages!: PageTreeNodesDictionary;

  /**
   * A number tree defining the page labelling for the document
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "PageLabels",
    // TODO add number tree type
    optional: true
  })
  public PageLabels!: objects.PDFObjectTypes | null;

  /**
   * The document’s name dictionary
   * @remarks PDF 1.2
   */
  @objects.PDFMaybeField("Names", NameDictionary)
  public Names!: objects.Maybe<NameDictionary>;

  /**
   * A dictionary of names and corresponding destinations.
   * @remarks PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "Dests",
    type: objects.PDFDictionary,
    optional: true,
    indirect: true
  })
  public Dests!: objects.PDFDictionary | null;

  /**
   * A viewer preferences dictionary
   * @remarks PDF 1.2
   */
  @objects.PDFDictionaryField({
    name: "ViewerPreferences",
    type: objects.PDFDictionary,
    optional: true
  })
  public ViewerPreferences!: objects.PDFDictionary | null;

  /**
   * A name object specifying the page layout shall be used when the document is opened
   */
  @objects.PDFDictionaryField({
    name: "PageLayout",
    type: objects.PDFName,
    get: (o) => o.text as PageLayout,
    optional: true,
    defaultValue: PageLayout.singlePage
  })
  public PageLayout!: PageLayout;

  /**
   * A name object specifying how the document shall be displayed when opened
   */
  @objects.PDFDictionaryField({
    name: "PageMode",
    type: objects.PDFName,
    get: (o) => o.text as PageMode,
    optional: true,
    defaultValue: PageMode.useNone
  })
  public PageMode!: PageMode;

  /**
   * The outline dictionary that shall be the root of the document’s outline hierarchy
   */
  @objects.PDFDictionaryField({
    name: "Outlines",
    type: objects.PDFDictionary,
    optional: true,
    indirect: true
  })
  public Outlines!: objects.PDFDictionary | null;

  /**
   * An array of thread dictionaries that shall represent the document’s article threads
   * @remarks PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "Threads",
    type: objects.PDFArray,
    optional: true,
    indirect: true
  })
  public Threads!: objects.PDFArray | null;

  /**
   * A value specifying a destination that shall be displayed or
   * an action that shall be performed when the document is opened
   * @remarks PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "OpenAction",
    optional: true
  })
  public OpenAction!: objects.PDFDictionary | objects.PDFArray | null;

  /**
   * An additional-actions dictionary defining the actions
   * that shall be taken in response to various trigger events
   * affecting the document as a whole
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "AA",
    type: objects.PDFDictionary,
    optional: true
  })
  public AA!: objects.PDFDictionary | null;

  /**
   * A URI dictionary containing document-level information for URI
   * @remarks PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "URI",
    type: objects.PDFDictionary,
    optional: true
  })
  public URI!: objects.PDFDictionary | null;

  /**
   * The document’s interactive form (AcroForm) dictionary
   * @remarks PDF 1.2
   */
  @objects.PDFMaybeField("AcroForm", InteractiveFormDictionary, true)
  public AcroForm!: objects.Maybe<InteractiveFormDictionary>;

  /**
   * A metadata stream that shall contain metadata for the document
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "Metadata",
    type: objects.PDFStream,
    optional: true,
    indirect: true
  })
  public Metadata!: objects.PDFStream | null;

  /**
   * The document’s structure tree root dictionary
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "StructTreeRoot",
    type: objects.PDFDictionary,
    optional: true
  })
  public StructTreeRoot!: objects.PDFDictionary | null;

  /**
   * A mark information dictionary that shall contain information
   * about the document’s usage of Tagged PDF conventions
   * @remarks PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "MarkInfo",
    type: objects.PDFDictionary,
    optional: true
  })
  public MarkInfo!: objects.PDFDictionary | null;

  /**
   * A language identifier that shall specify the natural language
   * for all text in the document except where overridden
   * by language specifications for structure elements or
   * marked content
   * @remarks PDF 1.4
   */
  @objects.PDFLiteralStringField("Lang", true)
  public Lang!: string | null;

  /**
   * A Web Capture information dictionary that shall contain
   * state information used by any Web Capture extension
   * @remarks PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "SpiderInfo",
    type: objects.PDFDictionary,
    optional: true
  })
  public SpiderInfo!: objects.PDFDictionary | null;

  /**
   * An array of output intent dictionaries that shall
   * specify the colour characteristics of output devices on which the
   * document might be rendered
   * @remarks PDF 1.4
   */
  @objects.PDFArrayField("OutputIntents", true)
  public OutputIntents!: objects.PDFArray | null;

  /**
   * A page-piece dictionary associated with the document
   * @remarks PDF 1.4; Deprecated in PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "PieceInfo",
    type: objects.PDFDictionary,
    optional: true
  })
  public PieceInfo!: objects.PDFDictionary | null;

  /**
   * The document’s optional content properties dictionary
   * @remarks PDF 1.5; required if a document contains optional content
   */
  @objects.PDFDictionaryField({
    name: "OCProperties",
    type: objects.PDFDictionary,
    optional: true
  })
  public OCProperties!: objects.PDFDictionary | null;

  /**
   * A permissions dictionary that shall specify user access permissions for the document
   * @remarks PDF 1.5
   */
  @objects.PDFDictionaryField({
    name: "Perms",
    type: objects.PDFDictionary,
    optional: true
  })
  public Perms!: objects.PDFDictionary | null;

  /**
   * A dictionary that shall contain attestations regarding the content
   * of a PDF document, as it relates to the legality of digital signatures
   * @remarks PDF 1.5
   */
  @objects.PDFDictionaryField({
    name: "Legal",
    type: objects.PDFDictionary,
    optional: true
  })
  public Legal!: objects.PDFDictionary | null;

  /**
   * An array of requirement dictionaries that shall
   * represent requirements for the document
   * @remarks PDF 1.7
   */
  @objects.PDFArrayField("Requirements", true)
  public Requirements!: objects.PDFArray | null;

  /**
   * A collection dictionary that a conforming
   * reader shall use to enhance the presentation of file attachments
   * stored in the PDF document
   * @remarks PDF 1.7
   */
  @objects.PDFDictionaryField({
    name: "Collection",
    type: objects.PDFDictionary,
    optional: true
  })
  public Collection!: objects.PDFDictionary | null;

  /**
   * A flag used to expedite the display of PDF
   * documents containing XFA forms
   * @remarks Deprecated in PDF 2.0
   */
  @objects.PDFBooleanField("NeedsRendering", true, false)
  public NeedsRendering!: boolean;

  /**
   * A DSS dictionary containing document-wide security information
   * @remarks PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "DSS",
    type: DocumentSecurityStoreDictionary,
    optional: true
  })
  public DSS!: DocumentSecurityStoreDictionary | null;

  protected override onCreate(): void {
    super.onCreate();

    const update = this.getDocumentUpdate();

    this.Type = CatalogDictionary.TYPE;

    this.Pages = PageTreeNodesDictionary.create(update);
  }
}
