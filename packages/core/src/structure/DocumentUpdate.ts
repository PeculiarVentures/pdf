import type { CrossReference } from "./CrossReference";

import * as objects from "../objects";
import { ParsingError } from "../ParsingError";
import { ViewReader } from "../ViewReader";
import { ViewWriter } from "../ViewWriter";

function num(view: Uint8Array, defaultValue = 0) {
  if (!view.length) {
    return defaultValue;
  }

  let value = 0;
  for (const byte of view) {
    value = (value << 8) | byte;
  }

  return value;
}

export class PDFDocumentUpdate {

  public static readonly DEFAULT_VIEW = new Uint8Array();

  public view = PDFDocumentUpdate.DEFAULT_VIEW;
  public document: PDFDocument;
  public xref: CrossReference | null = null;
  // public xrefTable: CrossReferenceTable | null = null;
  // public xrefStream: CrossReferenceStream | null = null;
  public startXref = 0;

  constructor(document: PDFDocument) {
    this.document = document;
  }

  public get items(): ReadonlyArray<PDFDocumentObject> {
    return this.xref?.objects || [];
  }

  public get Encrypt(): EncryptDictionary | null {
    return this.xref?.Encrypt || null;
  }

  public get id(): objects.PDFTextString[] | null {
    return this.xref?.ID || null;
  }

  public get catalog(): CatalogDictionary | null {
    // TODO Add catalog if null
    return this.xref?.Root || null;
  }

  public fromPDF(reader: ViewReader): Promise<number>;
  public fromPDF(data: Uint8Array, offset?: number): Promise<number>;
  public fromPDF(text: string): Promise<number>;
  public fromPDF(data: string | Uint8Array | ViewReader, offset?: number): Promise<number>;
  public async fromPDF(data: string | Uint8Array | ViewReader, offset?: number): Promise<number> {
    const reader = objects.PDFObject.getReader(data, offset);
    this.startXref = reader.view.byteOffset + reader.position;

    let position = 0;

    // beginning with PDF 1.5 cross-reference information may bew stored in a cross-reference stream
    if (this.document.version >= 1.5 && reader.current !== 0x78) { // x
      // cross-reference stream
      const obj = new objects.PDFIndirectObject();
      obj.documentUpdate = this;
      obj.fromPDF(reader);

      const xref = new CrossReferenceStream();
      this.xref = xref;
      xref.documentUpdate = this;
      xref.fromPDF(obj.value.view);

      const streamData = await xref.decode();
      // console.log("streamData:", Buffer.from(streamData).toString("hex"));

      const streamDataReader = new ViewReader(new Uint8Array(streamData));
      const w = [...xref.W];
      // console.log("W:", xref.w);

      const indexes = xref.Index || [{ start: 0, size: xref.Size }];

      let count = 0;
      while (!streamDataReader.isEOF) {
        const field1 = num(streamDataReader.read(w[0]), 1);
        const field2 = num(streamDataReader.read(w[1]));
        const field3 = num(streamDataReader.read(w[2]));

        const index = CrossReferenceStream.getIdentifier(indexes, count);

        let objStatus: PDFDocumentObjectTypes;
        switch (field1) {
          case 0: { // free
            objStatus = PDFDocumentObjectTypes.free;
            // console.log(`free       id:${index} next:${field2} gen:${field3}`);
            break;
          }
          case 1: { // in-use
            objStatus = PDFDocumentObjectTypes.inUse;
            // console.log(`in-use     id:${index} offset:${field2} gen:${field3}`);
            break;
          }
          case 2: { // compressed
            objStatus = PDFDocumentObjectTypes.compressed;
            // console.log(`compressed id:${index} stream:${field2} index:${field3}`);
            break;
          }
          default:
            throw new ParsingError("Unsupported type in PDF Cross-Reference stream");
        }

        const docObject = new PDFDocumentObject({
          type: objStatus,
          documentUpdate: this,
          id: index,
          offset: field2,
          generation: field3,
        });
        this.xref.addObject(docObject);

        count++;
      }

      position = reader.position;
    } else {
      // cross-reference table
      const xref = this.xref = new CrossReferenceTable();
      xref.documentUpdate = this;

      position = xref.fromPDF(reader);
    }

    const prev = this.xref?.Prev ?? null;
    if (prev !== null) {
      const update = new PDFDocumentUpdate(this.document);
      await update.fromPDF(new Uint8Array(reader.view.buffer), prev);

      this.previous = update;
    }

    const eofReader = new ViewReader(reader.view.buffer);
    eofReader.position = reader.position + reader.view.byteOffset;
    eofReader.read("%%EOF");

    this.view = eofReader.view.subarray(0, eofReader.position + 5);

    // Check file structure
    if (!this.document.wrongStructure) {
      if (this.previous && this.previous.startXref > this.startXref) {
        this.document.wrongStructure = true;
      } else {
        for (const obj of this.getObjects()) {
          if (obj.offset > this.startXref) {
            this.document.wrongStructure = true;
          }
        }
      }
    }

    return position;
  }

  public async writePDF(writer: ViewWriter): Promise<void> {
    if (this.view.length) {
      writer.write(this.view);

      return;
    }

    if (!this.xref) {
      throw new Error("XRef is empty");
    }

    if (!this.xref.objects.length) {
      // Don't serialize update without any changes
      return;
    }

    const startOffset = writer.length;

    for (const object of this.xref.objects) {
      if (object.type === PDFDocumentObjectTypes.inUse) {
        if (object.value instanceof objects.PDFStream) {
          await object.value.encode();
        }
        object.offset = writer.length;
        object.indirect.writePDF(writer);
      }
    }
    const offset = writer.length;

    if (this.xref instanceof CrossReferenceTable) {
      this.xref.writePDF(writer);
    } else if (this.xref instanceof CrossReferenceStream) {
      const xref = this.createPDFDocumentObject(this.xref);

      // Prepare should be called after xref was assigned into the document object
      await this.xref.prepare();

      xref.indirect.writePDF(writer);
    }

    // Add startxref
    writer.writeStringLine("startxref");
    this.startXref = offset;
    new objects.PDFNumeric(offset).writePDF(writer);
    writer.writeLine();

    writer.writeString("%%EOF\n");
    this.view = writer.toUint8Array().subarray(startOffset);
  }

  public previous: PDFDocumentUpdate | null = null;

  #objects?: PDFDocumentObject[];
  public getObjects(): PDFDocumentObject[] {
    if (!this.#objects) {
      this.#objects = [];
      const actual: string[] = [];
      const removed: string[] = [];

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let update: PDFDocumentUpdate | null = this;
      while (update) {
        for (const item of update.items) {
          const id = `${item.id}.${item.generation}`;
          if (item.type !== PDFDocumentObjectTypes.free
            && !actual.includes(id)
            && !removed.includes(id)) {
            this.#objects.push(item);
            actual.push(id);
          } else {
            removed.push(id);
          }
        }

        update = update.previous;
      }
    }

    return this.#objects;
  }

  public getObject(obj: objects.PDFIndirect): PDFDocumentObject;
  public getObject(id: number, generation?: number): PDFDocumentObject;
  public getObject(param: number | objects.PDFIndirect, generation?: number): PDFDocumentObject;
  public getObject(param: number | objects.PDFIndirect, generation = 65535): PDFDocumentObject {
    if (param instanceof objects.PDFIndirect) {
      return this.getObject(param.id, param.generation);
    }

    for (const item of this.items) {
      if (item.id === param) {
        if (!generation && item.type === PDFDocumentObjectTypes.compressed) {
          return item;
        }
        if (item.generation <= generation) {
          return item;
        }
      }
    }

    const prev = this.previous;
    if (prev) {
      return prev.getObject(param, generation);
    }

    throw new Error(`IndirectObject '${param} ${generation}' does not exist`);
  }

  protected getCompressedObjectNumbers(): number[] {
    const res: number[] = [];

    // Get list of unique stream numbers from the current update
    for (const item of this.items) {
      if (item.type !== PDFDocumentObjectTypes.compressed) {
        continue;
      }

      const streamId = item.offset;
      if (!res.includes(streamId)) { // use unique numbers only
        res.push(streamId);
      }
    }

    // Copy unique stream numbers from the previous updates
    if (this.previous) {
      const prevNumbers = this.previous.getCompressedObjectNumbers();
      for (const num of prevNumbers) { // use unique numbers only
        if (!res.includes(num)) {
          res.push(num);
        }
      }
    }

    return res;
  }

  protected getCompressedObjects(): PDFDocumentObject[] {
    return this.getCompressedObjectNumbers()
      .map(id => this.getObject(id, 0)); // get document objects
  }

  #decompressed = false;

  public async decompress(): Promise<void> {
    if (this.#decompressed) {
      return;
    }

    const compressedObjects = this.getCompressedObjects();

    for (const item of compressedObjects) {
      const stream = item.value;
      if (!(stream instanceof objects.PDFStream)) {
        throw new TypeError("Unexpected type of Compressed objects");
      }
      // Replace Stream to Compressed stream
      // Otherwise item will keep PDF Stream without cashed and decoded data
      // TODO replace item.value with item.getValue(type) for the case when we know which time must be in the indirect object
      const compressedObject = item.value = new CompressedObject(stream);

      await compressedObject.decode();
    }
  }

  public decompressSync(): void {
    if (this.#decompressed) {
      return;
    }

    if (this.document.encryptHandler) {
      throw new Error("Cannot decompress the update section, document is encrypted. Call decrypt() first.");
    }

    const compressedObjects = this.getCompressedObjects();

    for (const item of compressedObjects) {
      const stream = item.value;
      if (!(stream instanceof objects.PDFStream)) {
        throw new TypeError("Unexpected type of Compressed objects");
      }
      // Replace Stream to Compressed stream
      // Otherwise item will keep PDF Stream without cashed and decoded data
      // TODO replace item.value with item.getValue(type) for the case when we know which time must be in the indirect object
      const compressedObject = item.value = new CompressedObject(stream);

      compressedObject.decodeSync();
    }
  }

  protected createCrossReferenceStream(): CrossReferenceStream {
    const xref = new CrossReferenceStream();
    xref.documentUpdate = this;
    /// TODO move to CrossReferenceStream.create
    if (this.previous && this.previous.xref) {
      const prevSize = this.previous.xref.Size;
      xref.Size = prevSize;
    } else {
      xref.Size = 0;
    }

    return xref;
  }

  protected createCrossReferenceTable(): CrossReferenceTable {
    const xref = new CrossReferenceTable();

    xref.documentUpdate = this;

    return xref;
  }

  protected getOrCreateXref(): CrossReference {
    if (!this.xref) {

      if (this.document.options && this.document.options.xref === XrefStructure.Table) {
        this.xref = this.createCrossReferenceTable();
      } else {
        this.xref = this.createCrossReferenceStream();
      }
      (this.xref as any).onCreate();
    }

    return this.xref;
  }

  public createPDFDocumentObject(element: objects.PDFObject): PDFDocumentObject {
    const xref = this.getOrCreateXref();

    let size = xref.Size;

    if (!size) {
      const objZero = new PDFDocumentObject({
        id: 0,
        generation: 65535,
        offset: 0,
        type: PDFDocumentObjectTypes.free,
        documentUpdate: this,
      });
      size++;

      this.append(objZero);
    }

    const obj = new objects.PDFIndirectObject(size, 0, element);
    xref.Size = size + 1;

    return PDFDocumentObject.create(obj);
  }

  public delete(element: number | PDFDocumentObject): void {
    let obj: PDFDocumentObject;
    if (typeof element === "number") {
      obj = this.getObject(element);
    } else {
      obj = element;
    }

    const newObj = new PDFDocumentObject({
      documentUpdate: this,
      generation: 65535,
      id: obj.id,
      offset: 0,
      type: PDFDocumentObjectTypes.free,
    });

    const xref = this.getOrCreateXref();
    xref.addObject(newObj);
  }

  protected getOrCreateCompressedObject(): PDFDocumentObject {
    const xref = this.getOrCreateXref();
    for (const object of xref.objects) {
      // TODO Should we have something for getting nullable value?
      if (object.type !== PDFDocumentObjectTypes.free && object.value instanceof CompressedObject) {
        // Return if exists
        return object;
      }
    }

    // Create new
    const compressedStream = CompressedObject.create(this);

    return this.append(compressedStream);
  }

  public append(element: objects.PDFObject | PDFDocumentObject, compressed?: boolean): PDFDocumentObject {
    let docObject: PDFDocumentObject;
    const xref = this.getOrCreateXref();
    if (element instanceof PDFDocumentObject) {
      docObject = element;
    } else {
      docObject = this.createPDFDocumentObject(element);

      if (this.document.version >= 1.5
        && !this.document.options.disableCompressedObjects
        && compressed === undefined
        && this.document.options?.xref !== XrefStructure.Table) {
        // Set compressed for all objects which are not PDF streams
        if (!(element instanceof objects.PDFStream)) {
          docObject.type = PDFDocumentObjectTypes.compressed;
        }
      }
    }

    xref.documentUpdate = this;
    // TODO assign object and it's child tree to current document update !!!
    docObject.documentUpdate = this;
    if (docObject.type !== PDFDocumentObjectTypes.free) {
      docObject.value.documentUpdate = this;
    }

    if (docObject.type === PDFDocumentObjectTypes.compressed || compressed) {
      const compressedObject = this.getOrCreateCompressedObject();
      // TODO Don't use objects with generation number greater than 0 !!!
      (compressedObject.value as CompressedObject).setValue(docObject.id);

      // Update document object
      docObject.type = PDFDocumentObjectTypes.compressed;
      docObject.offset = compressedObject.id;
      // TODO Improve index getting !!!
      docObject.generation = (compressedObject.value as CompressedObject).n - 1;
    }

    xref.addObject(docObject);

    return docObject;
  }

  public async toString(): Promise<string> {
    const res: string[] = [];

    if (this.xref) {
      for (const object of this.xref.objects) {
        if (object.type !== PDFDocumentObjectTypes.free && object.value instanceof objects.PDFStream) {
          await object.value.decode();
        }
        res.push(object.toString());
      }
    }

    if (this.xref) {
      res.push(this.xref.toString());
    }

    res.push("%%EOF");

    return res.join("\n");
  }

  public addCatalog(): CatalogDictionary {
    const xref = this.getOrCreateXref();
    let root: CatalogDictionary;
    if (this.previous && this.previous.catalog) {
      root = this.previous.catalog;
    } else {
      if (!xref.Root) {
        const newRoot = CatalogDictionary.create(this);
        this.append(newRoot);
        xref.Root = newRoot;
      }
      root = xref.Root;
    }

    return root;
  }

  protected getObjectReferences(obj: objects.PDFObject, refs: objects.PDFIndirect[] = []): objects.PDFIndirect[] {
    if (obj instanceof objects.PDFDictionary) {
      for (const [key, item] of obj.items) {
        if (item.isIndirect()) {
          const ref = item.getIndirect();
          if (refs.find(o => o.id === ref.id && o.generation === ref.generation)) {
            continue;
          }

          this.getObjectReferences(obj.get(key), refs);
        }
      }
    }

    return refs;
  }

  public async decrypt(): Promise<void> {
    if (this.xref && this.xref.Encrypt) {

      let encryptRef: objects.IPDFIndirect | null = null;
      if (this.xref.Encrypt.isIndirect()) {
        encryptRef = this.xref.Encrypt.getIndirect();
      }

      const promises: Promise<void>[] = [];
      const items = this.xref.objects;
      for (const obj of items) {
        // decrypt 
        if (obj.type !== PDFDocumentObjectTypes.inUse
          || (encryptRef && encryptRef.id === obj.id && encryptRef.generation === obj.generation)) {
          continue;
        }

        promises.push(this.decryptObject(obj.value));
      }

      await Promise.all(promises);
    }
  }

  public async encrypt(): Promise<void> {
    if (this.xref && this.xref.Encrypt) {
      let encryptRef: objects.IPDFIndirect | null = null;
      if (this.xref.Encrypt.isIndirect()) {
        encryptRef = this.xref.Encrypt.getIndirect();
      }

      const promises: Promise<void>[] = [];
      const items = this.xref.objects;
      for (const obj of items) {
        if (obj.type !== PDFDocumentObjectTypes.inUse) {
          continue;
        }

        const value = obj.value;

        // encrypt 
        if ((value instanceof PDFDictionary && value.has("Type") && value.get("Type", PDFName).text === "XRef")
          || (encryptRef && encryptRef.id === obj.id && encryptRef.generation === obj.generation)) {
          continue;
        }

        promises.push(this.encryptObject(value));
      }

      await Promise.all(promises);
    }
  }

  protected async decryptObject(value: objects.PDFObject): Promise<void> {
    try {
      if (value instanceof objects.PDFStream
        || value instanceof objects.PDFTextString) {
        await value.decode();
      } else if (value instanceof objects.PDFDictionary) {
        for (const [, item] of value.items) {
          await this.decryptObject(item);
        }
      } else if (value instanceof objects.PDFArray) {
        for (const item of value.items) {
          await this.decryptObject(item);
        }
      }
    } catch {
      const r = value.getIndirect(true).id;
      console.warn(`R ${r}: Cannot decrypt`);
    }
  }

  protected async encryptObject(value: objects.PDFObject, skipIndirect = false): Promise<void> {
    try {
      if (skipIndirect && value.isIndirect()) {
        return;
      }

      if (value instanceof objects.PDFStream
        || value instanceof objects.PDFTextString) {
        await value.encode();
      } else if (value instanceof objects.PDFDictionary) {
        for (const [, item] of value.items) {
          await this.encryptObject(item, true);
        }
      } else if (value instanceof objects.PDFArray) {
        for (const item of value.items) {
          await this.encryptObject(item, true);
        }
      }
    } catch {
      const r = value.getIndirect(true).id;
      console.warn(`R ${r}: Cannot encrypt`);
    }
  }
}

import { CompressedObject } from "./CompressedObject";
import { CrossReferenceStream } from "./CrossReferenceStream";
import { CrossReferenceTable } from "./CrossReferenceTable";
import { CatalogDictionary } from "./dictionaries/Catalog";
import { PDFDocument, XrefStructure } from "./Document";
import { PDFDocumentObject, PDFDocumentObjectTypes } from "./DocumentObject";
import { EncryptDictionary } from "./dictionaries";
import { PDFDictionary, PDFName } from "../objects";

