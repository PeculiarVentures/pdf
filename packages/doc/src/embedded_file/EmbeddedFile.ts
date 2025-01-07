import * as core from "@peculiar/pdf-core";
import { WrapObject } from "../WrapObject";

/**
 * Representing an embedded file in a PDF document.
 */
export class EmbeddedFile extends WrapObject<core.FileSpecificationDictionary> {
  /**
   * The name of the embedded file.
   */
  public get name(): string {
    return this.target.F || this.target.UF || "";
  }

  /**
   * The descriptive text associated with the file specification.
   */
  public get description(): string {
    return this.target.Desc || "";
  }
  public set description(v: string) {
    this.target.Desc = v;
  }

  /**
   * Gets the embedded file stream.
   * @throws {Error} If the embedded file stream cannot be retrieved.
   */
  protected get fileStream(): core.EmbeddedFileStream {
    let res: core.EmbeddedFileStream | null = null;

    if (this.target.EF.has()) {
      const ef = this.target.EF.get();

      if (ef.F.has()) {
        res = ef.F.get();
      } else if (ef.UF.has()) {
        res = ef.UF.get();
      }
    }

    if (!res) {
      throw new Error("Cannot retrieve the embedded file stream.");
    }

    return res;
  }

  /**
   * Gets the size of the embedded file in bytes, or 0 if the size is not available.
   */
  public get size(): number {
    const fileStream = this.fileStream;
    if (fileStream.Params.has()) {
      return fileStream.Params.get().Size || this.data.byteLength;
    }

    return 0;
  }

  /**
   * Gets the date on which the embedded file was created, or null if the date is not available.
   */
  public get created(): Date | null {
    const fileStream = this.fileStream;
    if (fileStream.Params.has()) {
      return fileStream.Params.get().CreationDate?.getDate() || null;
    }

    return null;
  }

  /**
   * Gets the date on which the embedded file was last updated, or null if the date is not available.
   */
  public get updated(): Date | null {
    const fileStream = this.fileStream;
    if (fileStream.Params.has()) {
      return fileStream.Params.get().ModDate?.getDate() || null;
    }

    return null;
  }

  /**
   * Gets the content of the embedded file.
   */
  public get data(): ArrayBuffer {
    return this.fileStream.decodeSync();
  }
}
