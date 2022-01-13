import { PDFArray, PDFDictionary, PDFDictionaryField, PDFIndirectReference, PDFLiteralString } from "../../objects";

export class NameTrees extends PDFDictionary {

  /**
   * The array of indirect references to the immediate children of this node
   */
  @PDFDictionaryField({
    name: "Kids",
    type: PDFArray,
    optional: true,
    get: o => o.items,
  })
  public kids!: null | PDFIndirectReference[];

  /**
   * The array of the form: key (string) and value (PDFIndirectReference)
   */
  @PDFDictionaryField({
    name: "Names",
    type: PDFArray,
    optional: true,
    get: o => {
      const map = new Map<string, PDFIndirectReference>();
      for (let index = 0; index < o.length; index + 2) {
        const key = o.items[index];
        const value = o.items[index + 1];
        if (!(key instanceof PDFLiteralString)) {
          throw new Error("Key must be string");
        }
        if (!(value instanceof PDFIndirectReference)) {
          throw new Error("Value must be Indirect Reference");
        }
        map.set(key.text, value);
      }

      return map;
    },
  })
  public names!: null | Map<string, PDFIndirectReference>;

  /**
   * array of two strings, that shall specify the (lexically) least and greatest keys
   * included in the Names array of a leaf node or in the Names arrays of any leaf nodes
   * that are descendants of an intermediate node.
   */
  @PDFDictionaryField({
    name: "Limits",
    type: PDFArray,
    optional: true,
    get: o => o.items,
  })
  public limits!: null | PDFLiteralString[];
}
