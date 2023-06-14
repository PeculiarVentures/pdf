import { PDFArray, PDFArrayField } from "../objects";
import { FieldFlags, PDFField } from "./Field";

export enum ButtonFlags {
  /**
   * If set, exactly one radio button shall be selected at all times;
   * selecting the currently selected button has no effect. If clear,
   * clicking the selected button deselects it, leaving no button selected
   */
  noToggleToOff = 1 << 14,
  /**
   * If set, the field is a set of radio buttons; if clear, the field is a check box.
   * This flag may be set only if the Pushbutton flag is clear.
   */
  radio = 1 << 15,
  /**
   * If set, the field is a push-button that does not retain a permanent value.
   */
  pushbutton = 1 << 16,
  /**
   * If set, a group of radio buttons within a radio button field that
   * use the same value for the on state will turn on and off in unison; that
   * is if one is checked, they are all checked. If clear, the buttons are
   * mutually exclusive (the same behavior as HTML radio buttons).
   * @remarks PDF 1.5
   */
  radiosInUnison = 1 << 25,
}

export class ButtonDictionary extends PDFField {

  declare public ff: FieldFlags | ButtonFlags;

  @PDFArrayField("Opt", true)
  public opt!: PDFArray | null;

}
