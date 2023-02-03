import * as core from "@peculiarventures/pdf-core";

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
  skipForms?: boolean;
}

export type PDFObjectMap = Map<core.IPDFIndirect, core.PDFObjectTypes>;

export class PDFCopier {
  public skipForms = false;

  public static async create(params: PDFCopierCreateParams = {}): Promise<PDFCopier> {
    const doc = new core.PDFDocument();

    doc.version = params.version || 2.0;
    doc.options.disableAscii85Encoding = !!params.disableAscii85Encoding;
    doc.options.disableCompressedObjects = !!params.disableCompressedObjects;
    doc.options.disableCompressedStreams = !!params.disableCompressedStreams;
    doc.options.xref = params.useXRefTable ? core.XrefStructure.Table : core.XrefStructure.Stream;

    if (params.algorithm) {
      doc.encryptHandler = await core.StandardEncryptionHandler.create({
        document: doc,
        algorithm: core.CryptoFilterMethods[params.algorithm],
        userPassword: params.userPassword,
        ownerPassword: params.ownerPassword,
        permission: params.permission,
      });
    }

    const res = new PDFCopier(doc);

    res.skipForms = !!params.skipForms;

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
    } else {
      throw new Error("Cannot copy the object. Unsupported type of the object.");
    }

    if (target.isIndirect()) {
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

  protected appendPage(map: PDFObjectMap, target: core.PageObjectDictionary): void {
    const page = this.copyDictionary(map, target, "Parent", "Annots")
      .to(core.PageObjectDictionary)
      .makeIndirect();
    map.set(target.getIndirect(), page);

    // Copy annotations
    if (target.annots && !this.skipForms) {
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


        if (field) {
          const field2 = this.copyDictionary(map, field)
            .to(core.PDFField)
            .makeIndirect();
          map.set(field.getIndirect(), item);
          this.catalog.AcroForm.get().addField(field2);
        }
      }
    }

    this.catalog.Pages.addPage(page);
  }

  public append(document: core.PDFDocument): void {
    if (!document.update.xref) {
      return;
    }

    const map = new Map();
    const root = document.update.xref.Root;
    const pages = root.Pages.getPages();
    for (const page of pages) {
      this.appendPage(map, page);
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

}
