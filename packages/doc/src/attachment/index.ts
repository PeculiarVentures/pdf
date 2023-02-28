import * as core from "@peculiarventures/pdf-core";
import { PDFDocument } from "../Document";
import { WrapObject } from "../WrapObject";

export class EmbeddedFile extends WrapObject<core.FileSpecificationDictionary> {

  public get name(): string {
    return this.target.F || this.target.UF || "";
  }

  /**
   * Descriptive text associated with the file specification
   */
  public get description(): string {
    return this.target.Desc || "";
  }
  public set description(v: string) {
    this.target.Desc = v;
  }

  protected get fileStream(): core.EmbeddedFileStream {
    let res: core.EmbeddedFileStream | null = null;

    if (this.target.EF.has()) {
      const ef = this.target.EF.get();

      res = ef.F || ef.UF;
    }

    if (!res) {
      throw new Error("Cannot retrieve the embedded file stream.");
    }


    return res;
  }

  public get size(): number {
    const fileStream = this.fileStream;
    if (fileStream.Params.has()) {
      return fileStream.Params.get().Size || this.data.byteLength;
    }

    return 0;
  }

  public get created(): Date | null {
    const fileStream = this.fileStream;
    if (fileStream.Params.has()) {
      return fileStream.Params.get().CreationDate?.getDate() || null;
    }

    return null;
  }

  public get updated(): Date | null {
    const fileStream = this.fileStream;
    if (fileStream.Params.has()) {
      return fileStream.Params.get().ModDate?.getDate() || null;
    }

    return null;
  }

  public get data(): ArrayBuffer {
    return this.fileStream.decodeSync();
  }
}

export class NameTree<T extends core.PDFObject = core.PDFObject> extends WrapObject<core.NameTree> implements Iterable<[string, T]>{

  protected type: abstract new () => T;

  constructor(target: core.NameTree, document: PDFDocument, type?: new () => T) {
    super(target, document);

    this.type = type || core.PDFObject as unknown as new () => T;
  }

  [Symbol.iterator](): Iterator<[string, T], unknown, undefined> {
    let pointer = 0;
    const array = this.target.keys();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;

    return {
      next(): IteratorResult<[string, T]> {
        if (pointer < array.length) {
          const key = array[pointer++];

          return {
            done: false,
            value: [key, _this.get(key)],
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }

  public find(key: string): T | null {
    const res = this.target.findValue(key);

    if (res && !(res instanceof this.type)) {
      if (res instanceof core.PDFDictionary) {
        return core.PDFTypeConverter.convert(res, this.type, true);
      }
      throw new Error("Unable to cast value to type because the types do not match.");
    }

    return res;
  }

  public get(key: string): T;
  public get<T extends core.PDFObject>(key: string, type: new () => T): T;
  public get(key: string, type = this.type): T {
    const res = this.find(key);
    if (!res) {
      throw new Error(`Cannot retrieve the value for the given key '${key}'.`);
    }

    if (!(res instanceof type)) {
      throw new Error("Unable to cast value to type because the types do not match.");
    }

    return res;
  }

}

export class EmbeddedFileMap extends WrapObject<core.CatalogDictionary> implements Iterable<[string, EmbeddedFile]> {

  #nameTree?: NameTree<core.FileSpecificationDictionary>;

  [Symbol.iterator](): Iterator<[string, EmbeddedFile], unknown, undefined> {
    this.cacheNameTree();

    if (this.#nameTree) {
      const iterator = this.#nameTree[Symbol.iterator]();
      const doc = this.document;

      return {
        next(): IteratorResult<[string, EmbeddedFile]> {
          const res = iterator.next();
          if (res.done) {
            return res;
          } else {
            return {
              done: false,
              value: [res.value[0], new EmbeddedFile(res.value[1], doc)],
            };
          }
        }
      };
    } else {
      return {
        next(): IteratorResult<[string, EmbeddedFile]> {
          return {
            done: true,
            value: null
          };
        }
      };
    }
  }

  public find(key: string): EmbeddedFile | null {
    this.cacheNameTree();

    if (this.#nameTree) {
      const res = this.#nameTree.find(key);
      if (res) {
        return new EmbeddedFile(res, this.document);
      }
    }

    return null;
  }

  private cacheNameTree() {
    if (!this.#nameTree && this.target.Names.has()) {
      const names = this.target.Names.get();
      if (names.EmbeddedFiles) {
        const nameTree = names.EmbeddedFiles;
        if (nameTree) {
          this.#nameTree = new NameTree(nameTree, this.document, core.FileSpecificationDictionary);
        }
      }
    }
  }

  public get(key: string): EmbeddedFile {
    const res = this.find(key);

    if (!res) {
      throw new Error(`Cannot retrieve the value for the given key '${key}'.`);
    }

    return res;
  }

}
