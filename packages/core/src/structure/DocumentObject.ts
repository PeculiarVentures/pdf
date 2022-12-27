import { PDFIndirectObject, PDFIndirectReference, PDFNull, PDFObject } from "../objects";
import { CompressedObject } from "./CompressedObject";
import type { PDFDocumentUpdate } from "./DocumentUpdate";

export enum PDFDocumentObjectTypes {
  null = "z",
  free = "f",
  inUse = "n",
  compressed = "c",
}

export interface PDFDocumentObjectParameters {
  documentUpdate: PDFDocumentUpdate;
  /**
   * Object number
   */
  id: number;
  /**
   * The byte offset of the object (for inUse and free objects) or the object number 
   * of the object stream in which this object is stored (for compressed objects)
   */
  offset: number;
  /**
   * The generation number (for inUse and free objects) or the index (for compressed) of this object within the object stream
   */
  generation: number;
  /**
   * Type of the object. Should be 'inUse', 'free' or 'compressed'
   */
  type: PDFDocumentObjectTypes;
}

export class PDFDocumentObject implements PDFDocumentObjectParameters {

  public documentUpdate: PDFDocumentUpdate;
  public id: number;
  public offset: number;
  public generation: number;
  public type: PDFDocumentObjectTypes;

  public constructor(parameters: PDFDocumentObjectParameters) {
    this.documentUpdate = parameters.documentUpdate;
    this.offset = parameters.offset;
    this.id = parameters.id;
    this.generation = parameters.generation;
    this.type = parameters.type;
  }

  public createReference(): PDFIndirectReference {
    const ref = new PDFIndirectReference(
      this.id,
      this.type === PDFDocumentObjectTypes.compressed
        ? 0 // Compressed objects use 'generation' field for index keeping
        : this.generation,
    );

    ref.documentUpdate = this.documentUpdate;

    return ref;
  }

  public get indirect(): PDFIndirectObject {
    return this.#value!;
  }

  /**
   * Returns a copy of object
   * @returns The new instance of {@link PDFDocumentObject} with erased offset value
   */
  public copy(): PDFDocumentObject {
    const copy = new PDFDocumentObject({
      id: this.id,
      documentUpdate: this.documentUpdate,
      generation: this.generation,
      offset: 0, // Erase offset for copies. Because the copied object is not appended to PDF document
      type: this.type,
    });

    if (!this.#value && this.type !== PDFDocumentObjectTypes.free) {
      this.value;
    }
    copy.#value = this.#value!.copy();

    return copy;
  }

  public static create(indirect: PDFIndirectObject): PDFDocumentObject {
    const obj = new PDFDocumentObject({
      offset: 0,
      type: PDFDocumentObjectTypes.inUse,
      id: indirect.id,
      generation: indirect.generation,
      documentUpdate: indirect.documentUpdate!, // TODO remove !
    });

    obj.#value = indirect;

    return obj;
  }

  #value?: PDFIndirectObject;
  public get value(): PDFObject {
    if (!this.#value) {
      if (!this.documentUpdate.document) {
        throw new Error("Required field 'document' is missing");
      }
      if (this.type === PDFDocumentObjectTypes.null) {
        const value = new PDFIndirectObject();
        value.documentUpdate = this.documentUpdate;
        value.value = new PDFNull();
        value.value.documentUpdate = this.documentUpdate;

        this.#value = value;
      } else if (this.type === PDFDocumentObjectTypes.compressed) {
        // Get CompressedObject stream which
        const compressedObject = this.documentUpdate.getObject(this.offset).value;
        if (!(compressedObject instanceof CompressedObject)) {
          throw new TypeError("Received object is not type of CompressedObject");
        }

        const value = compressedObject.getValue(this.generation);

        const indirect = new PDFIndirectObject(this.id, 0, value);
        indirect.documentUpdate = this.documentUpdate;
        this.#value = indirect;
        value.ownerElement = indirect;
      } else {
        const value = new PDFIndirectObject();
        value.documentUpdate = this.documentUpdate;
        value.fromPDF(this.documentUpdate.document.view, this.offset);

        this.#value = value;
      }

    }

    return this.#value.value;
  }

  public set value(value: PDFObject) {
    this.#value!.value = value;
  }

  /**
   * Returns previous version of PDF document object otherwise `null`
   * @returns null or {@link PDFDocumentObject}
   */
  public prev(): PDFDocumentObject | null {
    return this.documentUpdate.previous?.getObject(this.id) || null;
  }

  public toString(): string {
    const res: string[] = [];

    switch (this.type) {
      case PDFDocumentObjectTypes.compressed:
        res.push(`${this.id} ${0} obj % compressed ObjStm(${this.offset} 0 R)`);
        res.push(this.value.toString());
        res.push(`endobj`);
        break;
      case PDFDocumentObjectTypes.inUse:
        res.push(`${this.id} ${this.generation} obj % in-use`);
        res.push(this.value.toString());
        res.push(`endobj`);
        break;
      case PDFDocumentObjectTypes.free:
        res.push(`${this.id} ${this.generation} obj endobj % free`);
        break;
    }

    return res.join("\n");
  }

}
