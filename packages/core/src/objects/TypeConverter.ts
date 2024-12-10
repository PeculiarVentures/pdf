export class PDFTypeConverter {

  public static convert<T extends PDFObject>(target: T): T;
  public static convert<T extends PDFObject>(target: PDFObject, type: abstract new () => T, replace?: boolean): T;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static convert(target: PDFObject, type?: any, replace = false): any {
    if (type) {
      if (type.__proto__ === PDFObject
        || type.__proto__ === PDFString // PDFName
        || type.__proto__ === PDFTextString) { // PDFHexString | PDFLiteralString
        // simple PDF objects
        if (!(target instanceof type)) {
          throw TypeError("Cannot convert target object to requested type");
        }
      } else {
        // extends of simple PDF objects
        if (!(target instanceof type)) {
          const res = new type(target);

          if (replace && target.ownerElement instanceof PDFIndirectObject) {
            target.ownerElement.value = res;
          }

          return res;
        }
      }
    }

    return target;
  }
}

import { PDFObject } from "./Object";
import { PDFString } from "./String";
import { PDFTextString } from "./TextString";
import { PDFIndirectObject } from "./IndirectObject";
