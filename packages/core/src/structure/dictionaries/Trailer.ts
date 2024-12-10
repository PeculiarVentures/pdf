import * as objects from "../../objects";
import { CatalogDictionary } from "./Catalog";
import { EncryptDictionary } from "./Encrypt";
import { InformationDictionary } from "./Information";
import { PublicKeyEncryptDictionary } from "./PublicKeyEncrypt";
import { StandardEncryptDictionary } from "./StandardEncrypt";

export class TrailerDictionary extends objects.PDFDictionary {

  /**
   * The total number of entries in the file’s cross-reference table,
   * as defined by the combination of the original section and all update sections
   * @remarks Shall not be an indirect reference
   */
  @objects.PDFNumberField("Size")
  public Size!: number;

  /**
   * The byte offset in the decoded stream from the beginning of the file
   * to the beginning of the previous cross-reference section
   * @remarks
   * - present only if the file has more than one cross-reference section
   * - shall be a direct object
   */
  @objects.PDFNumberField("Prev", true)
  public Prev!: null | number;

  /**
   * The catalog dictionary for the PDF document contained in the file
   * (see {@link CatalogDictionary})
   */
  @objects.PDFDictionaryField({
    name: "Root",
    type: CatalogDictionary,
    indirect: true,
  })
  public Root!: CatalogDictionary;

  /**
   * The document’s encryption dictionary
   * @remarks
   * - required if document is encrypted
   * - PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "Encrypt",
    type: objects.PDFDictionary,
    optional: true,
    cache: true,
    get: o => {
      const filter = o.get("Filter");
      // TODO Add EncryptDictionaryFactory
      if (filter instanceof objects.PDFName) {
        switch (filter.text) {
          case "Standard":
            return new StandardEncryptDictionary(o);
          default:
            return new PublicKeyEncryptDictionary(o);
        }
      }
      throw new Error("Wrong type for 'Filter'");
    },
  })
  public Encrypt!: null | EncryptDictionary;

  /**
   * The document’s information dictionary.
   * @remarks Deprecated in PDF 2.0
   */
  @objects.PDFMaybeField("Info", InformationDictionary, true)
  public Info!: objects.Maybe<InformationDictionary>;

  /**
   * An array of two byte-strings constituting a file identifier for the file.
   * The ID array shall (PDF 2.0) have a minimum length of 16 bytes. If there is an Encrypt entry,
   * this array and the two byte-strings shall be direct objects and shall be unencrypted.
   * @remarks
   * - required in PDF 2.0 or if an Encrypt entry is present
   * - PDF 1.1
   */
  @objects.PDFDictionaryField({
    name: "ID",
    type: objects.PDFArray,
    optional: true,
    get: o => o.items,
  })
  public ID!: null | objects.PDFTextString[];

  protected override onCreate(): void {
    super.onCreate();

    const update = this.getDocumentUpdate();

    // if update already has XRef we need to copy data from it
    const xref = update.previous?.xref || null;
    if (xref) {
      for (const [key, value] of (xref as objects.PDFDictionary).items) {
        // ! Don't copy Filters and DecodeParms
        // TODO Current implementation doesn't implement Predicator encoding
        if (key === "Filters" || key === "DecodeParms" || key === "XRefStm") {
          continue;
        }
        this.items.set(key, value.copy());
      }
      this.Prev = xref.documentUpdate!.startXref;
    } else {
      this.Size = 0;

      // TODO Simplify
      const root = CatalogDictionary.create(update);
      // ! Catalog dictionary shall be in-use object otherwise Acrobat doesn't open protected document
      const objRoot = update.append(root, false);
      this.set("Root", objRoot.createReference());

      // ID is required in PDF 2.0
      if (update.document.version >= 2) {
        // TODO implement ID generation
      }
    }
  }

}
