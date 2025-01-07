import {
  PDFArray,
  PDFArrayField,
  PDFDictionary,
  PDFDictionaryField,
  PDFIndirectReference,
  PDFLiteralString
} from "../../objects";

export class NumberTrees extends PDFDictionary {
  /**
   * The array of indirect references to the immediate children of this node
   */
  @PDFDictionaryField({
    name: "Kids",
    type: PDFArray,
    optional: true,
    get: (o) => o.items
  })
  public Kids!: null | PDFIndirectReference[];

  /**
   * The array of the form: key (integer) and value (PDFIndirectReference)
   */
  @PDFArrayField("Names", true)
  public Names!: PDFArray | null;

  /**
   * array of two strings, that shall specify the (lexically) least and greatest keys
   * included in the Names array of a leaf node or in the Names arrays of any leaf nodes
   * that are descendants of an intermediate node.
   */
  @PDFDictionaryField({
    name: "Limits",
    type: PDFArray,
    optional: true,
    get: (o) => o.items
  })
  public Limits!: null | PDFLiteralString[];
}
