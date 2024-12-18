import * as core from "@peculiarventures/pdf-core";
import { BufferSourceConverter } from "pvtsutils";
import { WrapObject } from "../WrapObject";
import { EmbeddedFile } from "./EmbeddedFile";
import { NameTree } from "./NameTree";

/**
 * Parameters for attaching a file to an EmbeddedFileMap.
 */
export interface EmbeddedFileMapAttachParams {
  /**
   * The name of the file.
   */
  name: string;
  /**
   * The data of the file.
   */
  data: BufferSource;
  /**
   * The ID of the file. Defaults to a random UUID.
   */
  id?: string;
  /**
   * The description of the file.
   */
  description?: string;
  /**
   * The creation time of the file. Defaults to the current date.
   */
  created?: Date;
  /**
   * The modification time of the file. Defaults to the current date.
   */
  modified?: Date;
}

/**
 * Represents an embedded file mapping of strings to {@link EmbeddedFile} objects.
 */
export class EmbeddedFileMap
  extends WrapObject<core.CatalogDictionary>
  implements Iterable<[string, EmbeddedFile]>
{
  #nameTree?: NameTree<core.FileSpecificationDictionary>;

  [Symbol.iterator](): Iterator<[string, EmbeddedFile], unknown, undefined> {
    if (this.nameTree) {
      const iterator = this.nameTree[Symbol.iterator]();
      const doc = this.document;

      return {
        next(): IteratorResult<[string, EmbeddedFile]> {
          const res = iterator.next();
          if (res.done) {
            return res;
          } else {
            return {
              done: false,
              value: [res.value[0], new EmbeddedFile(res.value[1], doc)]
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

  /**
   * The number of embedded files in the map.
   */
  get size(): number {
    return [...this].length;
  }

  /**
   * Finds the corresponding {@link EmbeddedFile} for a given key.
   * @param key The key to find the file for.
   * @returns The found file, or null if not found.
   */
  public find(key: string): EmbeddedFile | null {
    if (this.nameTree) {
      const res = this.nameTree.find(key);
      if (res) {
        return new EmbeddedFile(res, this.document);
      }
    }

    return null;
  }

  /**
   * Getter for the nameTree.
   * @returns NameTree or null if none is defined
   */
  private get nameTree(): NameTree<core.FileSpecificationDictionary> | null {
    if (!this.#nameTree && this.target.Names.has()) {
      const names = this.target.Names.get();
      if (names.EmbeddedFiles) {
        const nameTree = names.EmbeddedFiles;
        if (nameTree) {
          this.#nameTree = new NameTree(
            nameTree,
            this.document,
            core.FileSpecificationDictionary
          );
        }
      }
    }

    return this.#nameTree || null;
  }

  /**
   * Setter for the nameTree.
   * @param v NameTree to be set
   */
  private set nameTree(v: NameTree<core.FileSpecificationDictionary>) {
    if (v) {
      this.#nameTree = v;
    }
  }

  /**
   * Retrieves the {@link EmbeddedFile} for a given key.
   */
  public get(key: string): EmbeddedFile {
    const res = this.find(key);
    if (!res) {
      throw new Error(`Cannot retrieve the value for the given key '${key}'.`);
    }

    return res;
  }

  /**
   * Sets a new {@link EmbeddedFile} in the map.
   * @param key Used as the identifier for the embedded file
   * @param file Instance of EmbeddedFile class
   * @returns This {@link EmbeddedFileMap} instance
   */
  public set(key: string, file: EmbeddedFile): this {
    if (!this.nameTree) {
      // EmbeddedFiles filed doesn't exist, create it
      // use Root element with Names (without Limits and Kids)
      const embeddedFiles = core.NameTree.create(this.document.target);
      embeddedFiles.Names = this.document.target.createArray();
      this.target.Names.get().EmbeddedFiles = embeddedFiles;

      this.nameTree = new NameTree(
        embeddedFiles,
        this.document,
        core.FileSpecificationDictionary
      );
    }

    this.nameTree.set(key, file.target);

    return this;
  }

  /**
   * Attaches an embedded file to the document.
   * @param params Parameters for the embedded file.
   * @returns This EmbeddedFileMap instance.
   */
  public attach(params: EmbeddedFileMapAttachParams): this {
    // Assign default values to parameters, if not provided
    params.id ??= core.UUID.generate();
    params.created ??= params.created ?? params.modified ?? new Date();
    params.modified ??= params.modified ?? params.created;

    const doc = this.document.target;

    // Create File Specification dictionary
    const embeddedFile = core.FileSpecificationDictionary.create(doc);
    if (params.description) {
      embeddedFile.Desc = params.description;
    }
    embeddedFile.F = params.name;

    // Set file creation, modification and size parameters
    const file = embeddedFile.EF.get().F.get();
    const fileParams = file.Params.get();
    fileParams.CreationDate = core.PDFDate.createDate(doc, params.created);
    fileParams.ModDate = core.PDFDate.createDate(doc, params.modified);
    fileParams.Size = params.data.byteLength;
    file.stream = BufferSourceConverter.toUint8Array(params.data);

    // Add the embedded file to the map using the provided or generated ID
    return this.set(params.id, new EmbeddedFile(embeddedFile, this.document));
  }
}
