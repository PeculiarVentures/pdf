import { Maybe, PDFDictionary, PDFMaybeField, PDFNameField } from "../../objects";
import { DeveloperExtensionsDictionary } from "./DeveloperExtensionsDictionary";

export class ExtensionsDictionary extends PDFDictionary {

  public static readonly TYPE = "Extensions";

  /**
   * The type of PDF object that this dictionary describes; if present, shall
   * be Extensions.
   * @remarks
   * - Optional
   */
  @PDFNameField("Type", true, ExtensionsDictionary.TYPE)
  public Type!: typeof ExtensionsDictionary.TYPE;

  /**
   * Developer extensions dictionary
   */
  @PDFMaybeField("ADBE", DeveloperExtensionsDictionary)
  public ADBE!: Maybe<DeveloperExtensionsDictionary>;

}
