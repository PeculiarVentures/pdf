import * as objects from "../../objects";

export const XOBJECT_TYPE = "XObject";

export interface XObjectDictionary extends objects.PDFStream {
  /**
   * The type of PDF object that this dictionary describes. If present, shall be XObject for a form XObject.
   */
  Type: typeof XOBJECT_TYPE;

  /**
   * The type of XObject that this dictionary describes
   */
  Subtype: string;
}
