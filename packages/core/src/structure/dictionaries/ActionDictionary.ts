import type { PDFArray } from "../../objects";

import { PDFDictionaryField, PDFDictionary, PDFNameField } from "../../objects";

export class ActionDictionary extends PDFDictionary {
  public static readonly TYPE = "Action";

  /**
   * The type of PDF object that this dictionary describes; if
   * present, shall be `Action` for an action dictionary.
   */
  @PDFNameField("Type", true)
  public type!: "Action" | null;

  /**
   * The type of action that this dictionary describes
   */
  // TODO implement Action types (12.6.4). And move all action classes to `actions` folder
  @PDFNameField("S")
  public s!: string;

  /**
   * The next action or sequence of actions that shall be performed after
   * the action represented by this dictionary. The value is either a single
   * action dictionary or an array of action dictionaries that shall be performed
   * in order; see Note 1 for further discussion.
   * @remarks PDF 1.2
   */
  @PDFDictionaryField({
    name: "Next",
    optional: true
  })
  public next!: PDFDictionary | PDFArray | null;

  public override onCreate(): void {
    this.type = ActionDictionary.TYPE;
  }
}
