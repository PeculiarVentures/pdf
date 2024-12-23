import * as core from "@peculiarventures/pdf-core";
import { PDFDocument } from "../Document";
import { WrapObject } from "../WrapObject";

export class NameTree<T extends core.PDFObject = core.PDFObject>
  extends WrapObject<core.NameTree>
  implements Iterable<[string, T]>
{
  protected type: abstract new () => T;

  constructor(
    target: core.NameTree,
    document: PDFDocument,
    type?: new () => T
  ) {
    super(target, document);

    this.type = type || (core.PDFObject as unknown as new () => T);
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
            value: [key, _this.get(key)]
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
      throw new Error(
        "Unable to cast value to type because the types do not match."
      );
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
      throw new Error(
        "Unable to cast value to type because the types do not match."
      );
    }

    return res;
  }

  public set(key: string, value: T): void {
    this.target.setValue(key, value);
  }
}
