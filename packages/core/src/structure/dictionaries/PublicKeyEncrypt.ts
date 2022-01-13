import { PDFArray, PDFDictionaryField, PDFNumberField, PDFLiteralString } from "../../objects";
import { EncryptDictionary } from "./Encrypt";

export class PublicKeyEncryptDictionary extends EncryptDictionary {

  /**
   * An array of byte-strings, where each string is a PKCS#7 object listing recipients
   * who have been granted equal access rights to the document.
   */
  @PDFDictionaryField({
    name: "Recipients",
    type: PDFArray,
    get: o => {
      o.items.map(s => {
        if (s instanceof PDFLiteralString) {
          return s.text;
        }
        throw new Error("Recipients contain an invalid format");
      });
    },
  })
  public recipients!: string[];

  /**
   * A set of flags specifying which operations shall be permitted when the document is opened with user access.
   * If bit 2 is set to 1, all other bits are ignored and all operations are permitted.
   * If bit 2 is set to 0, permission for operations are based on the values of the remaining flags defined in Table 24.
   */
  @PDFNumberField("P")
  public p!: number;

}
