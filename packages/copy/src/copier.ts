import * as core from "@peculiarventures/pdf-core";

/**
 * Array with two number values representing the first and last page of a range.
 */
type PageRange = [number, number];

/**
 * Array with two values representing the beginning of a range.
 * The first value is `undefined` as it indicates the first page.
 * The second value represents the page at which the range ends.
 */
type PageRangeBegin = [undefined, number];

/**
 * Array with two values representing the end of a range.
 * The first value represents the starting page of the range.
 * The second value is `undefined` as it indicates the end of the PDF document.
*/
type PageRangeEnd = [number, undefined] | [number];

/**
 * Represents a union of a single page number, a `PageRange` array, a `PageRangeBegin` array or a `PageRangeEnd` array.
 */
export type PageFilter = number | PageRange | PageRangeBegin | PageRangeEnd;

export interface PDFCopierAppendPageParams {
  skipForms?: boolean;
}

export interface ProgressCallBackInfo {
  /**
   * Array of changed indexes.
   */
  changedIndexes: Record<number, number>;
}


export interface PDFCopierAppendParams extends PDFCopierAppendPageParams {
  pages?: PageFilter[];
  /**
   * Callback returns information about create PDF document and changes from source document.
   */
  progressCallback?: (info: ProgressCallBackInfo) => void;
}

export interface PDFCopierCreateParams {
  version?: number;
  disableAscii85Encoding?: boolean;
  disableCompressedObjects?: boolean;
  disableCompressedStreams?: boolean;
  useXRefTable?: boolean;
  algorithm?: keyof typeof core.CryptoFilterMethods;
  permission?: core.UserAccessPermissionFlags;
  userPassword?: core.Password;
  ownerPassword?: core.Password;
}

export type PDFObjectMap = Map<core.IPDFIndirect, core.PDFObjectTypes>;

export class PDFCopier {

  public static async create(params?: PDFCopierCreateParams): Promise<PDFCopier>;
  public static async create(doc: core.PDFDocument, params?: PDFCopierAppendParams): Promise<PDFCopier>;
  public static async create(arg1: PDFCopierCreateParams | core.PDFDocument = {}): Promise<PDFCopier> {
    let doc: core.PDFDocument;

    if (arg1 instanceof core.PDFDocument) {
      doc = arg1;
    } else {
      doc = new core.PDFDocument();

      doc.version = arg1.version || 2.0;
      doc.options.disableAscii85Encoding = !!arg1.disableAscii85Encoding;
      doc.options.disableCompressedObjects = !!arg1.disableCompressedObjects;
      doc.options.disableCompressedStreams = !!arg1.disableCompressedStreams;
      doc.options.xref = arg1.useXRefTable ? core.XrefStructure.Table : core.XrefStructure.Stream;

      if (arg1.algorithm) {
        doc.encryptHandler = await core.StandardEncryptionHandler.create({
          document: doc,
          algorithm: core.CryptoFilterMethods[arg1.algorithm],
          userPassword: arg1.userPassword,
          ownerPassword: arg1.ownerPassword,
          permission: arg1.permission,
        });
      }
    }

    const res = new PDFCopier(doc);

    return res;
  }

  public document: core.PDFDocument;

  public get catalog(): core.CatalogDictionary {
    if (!this.document.update.catalog) {
      throw new Error("Cannot get Catalog from the PDF document.");
    }

    return this.document.update.catalog;
  }

  private constructor(document: core.PDFDocument) {
    this.document = document;
  }

  protected findRef<T extends core.PDFObjectTypes>(map: PDFObjectMap, target: T): T | null {
    // Don't copy objects if we already did it
    let ref: core.PDFObjectTypes | undefined;
    if (target instanceof core.PDFIndirect && map.has(target)) {
      ref = map.get(target.getIndirect());
    } else if (target.isIndirect() && map.has(target.getIndirect())) {
      ref = map.get(target.getIndirect());
    }

    return ref as T | undefined
      || null;
  }

  protected copyObject(map: PDFObjectMap, target: core.PDFObjectTypes): core.PDFObjectTypes {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    let res: core.PDFObjectTypes;

    if (target instanceof core.PDFIndirectReference) {
      return this.copyObject(map, target.getValue());
    } else if (target instanceof core.PDFBoolean) {
      res = this.copyBoolean(map, target);
    } else if (target instanceof core.PDFNumeric) {
      res = this.copyNumber(map, target);
    } else if (target instanceof core.PDFName) {
      res = this.copyName(map, target);
    } else if (target instanceof core.PDFLiteralString) {
      res = this.copyLiteralString(map, target);
    } else if (target instanceof core.PDFHexString) {
      res = this.copyHexString(map, target);
    } else if (target instanceof core.PDFStream) {
      res = this.copyStream(map, target);
    } else if (target instanceof core.PDFDictionary) {
      res = this.copyDictionary(map, target);
    } else if (target instanceof core.PDFArray) {
      res = this.copyArray(map, target);
    } else if (target instanceof core.PDFNull) {
      res = this.copyNull(map, target);
    } else {
      throw new Error("Cannot copy the object. Unsupported type of the object.");
    }

    if (target.isIndirect() && !res.isIndirect()) {
      res.makeIndirect();
      map.set(target.getIndirect(), res);
    }

    return res;
  }

  protected copyBoolean(map: PDFObjectMap, target: core.PDFBoolean): core.PDFBoolean {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    return this.document.createBoolean(target.value);
  }

  protected copyNumber(map: PDFObjectMap, target: core.PDFNumeric): core.PDFNumeric {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    return this.document.createNumber(target.value);
  }

  protected copyLiteralString(map: PDFObjectMap, target: core.PDFLiteralString): core.PDFLiteralString {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    return this.document.createString(target.text);
  }

  protected copyHexString(map: PDFObjectMap, target: core.PDFHexString): core.PDFHexString {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    return this.document.createHexString(target.toUint8Array());
  }

  protected copyName(map: PDFObjectMap, target: core.PDFName): core.PDFName {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    return this.document.createName(target.text);
  }

  protected copyStream(map: PDFObjectMap, target: core.PDFStream, ...skipFields: string[]): core.PDFStream {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    const res = new core.PDFStream();

    if (target.isIndirect()) {
      // Make copied stream indirect if the source stream is indirect
      res.makeIndirect();
      map.set(target.getIndirect(), res);
    }

    res.set("Length", this.document.createNumber(0));
    res.documentUpdate = this.document.update;

    skipFields.push("Length");

    for (const [key, value] of target.items) {
      if (skipFields.includes(key)) {
        continue;
      }

      res.set(key, this.copyObject(map, value));
    }

    res.stream = new Uint8Array(target.decodeSync());

    return res;
  }

  protected copyDictionary(map: PDFObjectMap, target: core.PDFDictionary, ...skipFields: string[]): core.PDFDictionary {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    const res = this.document.createDictionary();
    if (target.isIndirect()) {
      // Make copied dictionary indirect if the original one is indirect
      res.makeIndirect();
      map.set(target.getIndirect(), res);
    }

    for (const [key, value] of target.items) {
      if (skipFields.includes(key)) {
        continue;
      }

      res.set(key, this.copyObject(map, value));
    }

    return res;
  }

  protected copyArray(map: PDFObjectMap, target: core.PDFArray): core.PDFArray {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    const res = this.document.createArray();

    for (const item of target) {
      res.push(this.copyObject(map, item as core.PDFObjectTypes));
    }

    return res;
  }

  protected copyNull(map: PDFObjectMap, target: core.PDFNull): core.PDFNull {
    const ref = this.findRef(map, target);
    if (ref) {
      return ref;
    }

    return this.document.createNull();
  }

  protected appendPage(map: PDFObjectMap, target: core.PageObjectDictionary, parasm: PDFCopierAppendPageParams = {}): void {
    const page = this.copyDictionary(map, target, "Parent", "Annots", "PageItemUIDToLocationDataMap")
      .to(core.PageObjectDictionary)
      .makeIndirect();
    map.set(target.getIndirect(), page);

    // Copy annotations
    if (target.annots && !parasm.skipForms) {
      for (const item of target.annots) {
        if (!(item instanceof core.PDFDictionary)) {
          continue;
        }

        let field: core.PDFField | undefined;
        if (item.has("FT")) {
          // Field
          field = item.to(core.PDFField);
        } else if (item.has("Parent")) {
          // Field
          field = item.get("Parent", core.PDFField);
        }
        if (field) {
          if (field.ft === "Sig" && field.V) {
            // Skip signature object with signature value
            continue;
          }
        }

        const annot = this.copyDictionary(map, item)
          .to(core.AnnotationDictionary)
          .makeIndirect();
        map.set(annot.getIndirect(), item);
        page.addAnnot(annot);


        if (annot.has("Parent")) {
          // go to the top parent and add it to the AcroForm
          let parent = annot.get("Parent", core.PDFDictionary);
          while (parent.has("Parent")) {
            parent = parent.get("Parent", core.PDFDictionary);
          }
          field = parent.to(core.PDFField);
          map.set(field.getIndirect(), item);
          this.catalog.AcroForm.get().addField(field);
        } else if (annot.has("FT")) {
          field = annot.to(core.PDFField);

          map.set(field.getIndirect(), item);
          this.catalog.AcroForm.get().addField(field);
        }
      }
    }

    this.catalog.Pages.addPage(page);
  }

  public append(document: core.PDFDocument, params: PDFCopierAppendParams = {}): void {
    if (!document.update.xref) {
      return;
    }

    const map: PDFObjectMap = new Map();

    // Copy AcroForm (without fields)
    if (document.update.catalog?.AcroForm.has()) {
      const acroForm = document.update.catalog.AcroForm.get();
      const acroFormCopy = this.copyDictionary(map, acroForm, "Fields", "XFA")
        .makeIndirect();
      acroFormCopy.set("Fields", this.document.createArray());
      this.catalog.set("AcroForm", acroFormCopy);
    }

    const root = document.update.xref.Root;
    const pages = params.pages
      ? this.filterPages(root.Pages.getPages(), params.pages)
      : root.Pages.getPages();

    for (const page of pages) {
      this.appendPage(map, page, params);
    }

    if (params.progressCallback) {
      const indexes: Record<number, number> = {};

      // map => indexes
      for (const [key, value] of map) {
        indexes[key.id] = value.getIndirect().id;
      }

      params.progressCallback({
        changedIndexes: indexes,
      });
    }

  }

  /**
   * Saves the document
   * @returns Byte array
   */
  public async save(): Promise<ArrayBuffer> {
    const writer = new core.ViewWriter();
    await this.document.writePDF(writer);

    return writer.toUint8Array();
  }

  /**
   * Filter a collection of pages based on a set of filters.
   * @param pages The collection of pages to filter.
   * @param filters The set of filters to apply to the pages.
   * @returns The filtered collection of pages.
   */
  private filterPages(pages: core.PageObjectDictionary[], filters: PageFilter[]): core.PageObjectDictionary[] {
    const filteredPages: core.PageObjectDictionary[] = [];

    // Loop through each filter in the set of filters.
    for (const filter of filters) {
      if (typeof filter === "number") {
        // If the filter is a single page number, add the corresponding page to the filtered pages array.
        const page = pages[filter - 1];
        if (page) {
          filteredPages.push(page);
        }
      } else if (Array.isArray(filter)) {
        // If the filter is an array representing a range of pages, add the corresponding pages to the filtered pages array.
        const [begin, end] = filter;
        const start = begin ?? 1;
        const stop = end ?? pages.length;

        // If the range is descending, loop backwards through the pages.
        if (start > stop) {
          for (let i = start; i >= stop; i--) {
            const page = pages[i - 1];
            if (page) {
              filteredPages.push(page);
            }
          }
        } else {
          // If the range is ascending, loop forwards through the pages.
          for (let i = start; i <= stop; i++) {
            const page = pages[i - 1];
            if (page) {
              filteredPages.push(page);
            }
          }
        }
      }
    }

    return filteredPages;
  }


}
