import { PDFArray, PDFArrayField, PDFNumberField } from "../objects";
import { FieldFlags, PDFField } from "./Field";

export enum ChoiceFlags {
  /**
   * If set, the field is a combo box; if clear, the field is a list box.
   */
  combo = 1 << 17,
  /**
   * If set, the combo box shall include an editable text box as well as a
   * drop-down list; if clear, it shall include only a drop-down list.
   * This flag shall be used only if the Combo flag is set.
   */
  edit = 1 << 18,
  /**
   * If set, the field’s option items shall be sorted alphabetically. This
   * flag is intended for use by PDF writers, not by PDF readers. PDF readers
   * shall display the options in the order in which they occur in the Opt array
   * (see "Table 233: Additional entries specific to a choice field").
   */
  sort = 1 << 19,
  /**
   * If set, more than one of the field’s option items may be selected simultaneously;
   * if clear, at most one item shall be selected.
   *
   * @since PDF 1.4
   */
  multiSelect = 1 << 21,
  /**
   * If set, text entered in the field shall not be spell-checked. This flag
   * shall not be used unless the Combo and Edit flags are both set.
   *
   * @since PDF 1.4
   */
  doNotSpellCheck = 1 << 22,
  /**
   * If set, the new value shall be committed as soon as a selection is made
   * (commonly with the pointing device). In this case, supplying a value
   * for a field involves three actions: selecting the field for fill-in,
   * selecting a choice for the fill-in value, and leaving that field, which
   * finalizes or "commits" the data choice and triggers any actions associated
   * with the entry or changing of this data. If this flag is on, then processing
   * does not wait for leaving the field action to occur, but immediately proceeds
   * to the third step.
   *
   * This option enables applications to perform an action once
   * as election is made, without requiring the user to exit the field. If clear,
   * the new value is not committed until the user exits the field.
   *
   * @since PDF 1.5
   */
  commitOnSelChange = 1 << 26
}

export class ChoiceDictionary extends PDFField {
  declare public ff: FieldFlags | ChoiceFlags;

  /**
   * An array of options that shall be presented to the user. Each element of the array
   * is either a text string representing one of the available options or an array
   * consisting of two text strings: the option’s export value and the text that shall be
   * displayed as the name of the option.
   *
   * If this entry is not present, no choices should be presented to the user.
   */
  @PDFArrayField("Opt", true)
  public Opt!: PDFArray | null;

  /**
   * For scrollable list boxes, the top index (the index in the Opt array of the first
   * option visible in the list).
   *
   * Default value: 0.
   */
  @PDFNumberField("Tl", true, 0)
  public Tl!: number;

  /**
   * For choice fields that allow multiple selection (MultiSelect flag set), an array of integers,
   * sorted in ascending order, representing the zero-based indices in the Opt array of
   * the currently selected option items. This entry shall be used when two or more elements
   * in the Opt array have different names but the same export value or when the value
   * of the choice field is an array. If the items identified by this entry differ from those
   * in the V entry of the field dictionary (see discussion following this Table), the V entry
   * shall be used.
   *
   * @remarks
   * Sometimes required, otherwise optional
   *
   * @since PDF 1.4
   */
  @PDFArrayField("I", true)
  public I!: PDFArray | null;

  protected override onCreate(): void {
    super.onCreate();

    this.ft = "Ch";
  }
}
