import * as objects from "../../objects";

export class CIDSystemInfoDictionary extends objects.PDFDictionary {
  /**
   * A string identifying the issuer of the character collection. The
   * string shall begin with the 4 or 5 characters of a registered developer
   * prefix followed by a LOW LINE (5Fh) followed by any other identifying
   * characters chosen by the issuer. See Annex E, "PDF Name Registry", for
   * how to obtain a unique developer prefix.
   */
  @objects.PDFLiteralStringField("Registry")
  public Registry!: string;

  /**
   * A string that uniquely names the character collection within
   * the specified registry.
   */
  @objects.PDFLiteralStringField("Ordering")
  public Ordering!: string;

  /**
   * The supplement number of the character collection. An
   * original character collection has a supplement number of 0. Whenever
   * additional CIDs are assigned in a character collection, the supplement
   * number shall be increased. Supplements shall not alter the ordering of
   * existing CIDs in the character collection. This value shall not be used in
   * determining compatibility between character collections.
   */
  @objects.PDFNumberField("Supplement")
  Supplement!: number;
}
