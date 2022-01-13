import { PDFDictionary, PDFNameField } from "../../objects";

export class CollectionItemsDictionary extends PDFDictionary {

  public static readonly TYPE = "CollectionItem";

  /**
   * The type of PDF object that this dictionary describes; if present,
   * shall be CollectionItem for a collection item dictionary. 
   */
  @PDFNameField("Type", true, CollectionItemsDictionary.TYPE)
  public type!: typeof CollectionItemsDictionary.TYPE;



  protected override onCreate(): void {
    super.onCreate();

    this.type = CollectionItemsDictionary.TYPE;
  }

}
