import * as objects from "../../objects";

export class AppearanceDictionary extends objects.PDFDictionary {
  /**
   * The annotation’s normal appearance
   */
  @objects.PDFDictionaryField({
    name: "N"
  })
  public N!: objects.PDFDictionary | objects.PDFArray;

  /**
   * The annotation’s rollover appearance.
   *
   * Default value: the value of the N entry
   */
  @objects.PDFDictionaryField({
    name: "R",
    optional: true
  })
  public r!: objects.PDFDictionary | objects.PDFArray | null;

  /**
   * The annotation’s down appearance.
   *
   * Default value: the value of the N entry
   */
  @objects.PDFDictionaryField({
    name: "D",
    optional: true
  })
  public D!: objects.PDFDictionary | objects.PDFArray | null;
}
