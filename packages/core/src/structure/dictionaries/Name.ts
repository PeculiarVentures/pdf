import * as objects from "../../objects";
import * as common from "../common";

export class NameDictionary extends objects.PDFDictionary {
  /**
   * A name tree mapping name strings to destinations
   *
   * @since PDF 1.2
   */
  @objects.PDFDictionaryField({
    name: "Dests",
    type: common.NameTree,
    optional: true
  })
  public Dests!: common.NameTree | null;

  /**
   * A name tree mapping name strings to annotation appearance streams
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "AP",
    type: common.NameTree,
    optional: true
  })
  public AP!: common.NameTree | null;

  /**
   * A name tree mapping name strings to document-level ECMAScript actions
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "JavaScript",
    type: common.NameTree,
    optional: true
  })
  public JavaScript!: common.NameTree | null;

  /**
   * A name tree mapping name strings to visible pages for use in interactive forms
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "Pages",
    type: common.NameTree,
    optional: true
  })
  public Pages!: common.NameTree | null;

  /**
   * A name tree mapping name strings to invisible(template) pages for use in interactive forms
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "Templates",
    type: common.NameTree,
    optional: true
  })
  public Templates!: common.NameTree | null;

  /**
   * A name tree mapping digital identifiers to Web. Capture content sets
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "IDS",
    type: common.NameTree,
    optional: true
  })
  public IDS!: common.NameTree | null;

  /**
   * A name tree mapping uniform resource locators. (URLs) to Web Capture content sets
   *
   * @since PDF 1.3
   */
  @objects.PDFDictionaryField({
    name: "URLS",
    type: common.NameTree,
    optional: true
  })
  public URLS!: common.NameTree | null;

  /**
   * A name tree mapping name strings to file specifications for embedded file streams.
   *
   * All File Specification dictionaries referenced from this name tree shall contain
   * an EF key whose value is a dictionary which contains either an F or UF key whose
   * value is an embedded file stream.
   *
   * @remarks PDF 2.0
   *
   * For unencrypted wrapper documents for an encrypted payload document (see 7.6.7, "Unencrypted wrapper document")
   * the name strings provided in this tree shall not contain or be derived from the encrypted payload document’s
   * actual file name. This is to avoid potential disclosure of sensitive information in the original filename.
   * The name string should match the value of F or UF in the referenced File Specification dictionary.
   *
   * @since PDF 1.4
   */
  @objects.PDFDictionaryField({
    name: "EmbeddedFiles",
    type: common.NameTree,
    optional: true
  })
  public EmbeddedFiles!: common.NameTree | null;

  /**
   * A name tree mapping name strings to alternate presentations
   *
   * @since PDF 1.4
   * @deprecated PDF 2.0
   */
  @objects.PDFDictionaryField({
    name: "AlternatePresentations",
    type: common.NameTree,
    optional: true
  })
  public AlternatePresentations!: common.NameTree | null;

  /**
   * A name tree mapping name strings (which shall have Unicode encoding) to rendition objects
   *
   * @since PDF 1.5
   */
  @objects.PDFDictionaryField({
    name: "Renditions",
    type: common.NameTree,
    optional: true
  })
  public Renditions!: common.NameTree | null;
}
