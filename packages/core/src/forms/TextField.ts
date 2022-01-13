export enum TextFieldFlags {
  /**
   * If set, the field may contain multiple lines of text; if clear, the field’s text
   * shall be restricted to a single line.
   */
  multiline = 1 << 12,

  /**
   * If set, the field is intended for entering a secure password that should not
   * be echoed visibly to the screen. Characters typed from the keyboard shall
   * instead be echoed in some unreadable form, such as asterisks or bullet
   * characters.
   * @note To protect password confidentiality, it is imperative that
   * interactive PDF processors never store the value of the text
   * field in the PDF file if this flag is set. 
   */
  password = 1 << 13,

  /**
   * (PDF 1.4) If set, the text entered in the field represents the pathname of a
   * file whose contents shall be submitted as the value of the field. 
   */
  fileSelect = 1 << 20,

  /**
   * (PDF 1.4) If set, text entered in the field shall not be spell-checked. 
   */
  doNotSpellCheck = 1 << 22,

  /**
   * (PDF 1.4) If set, the field shall not scroll (horizontally for single-line
   * fields, vertically for multiple-line fields) to accommodate more text than
   * fits within its annotation rectangle. Once the field is full, no further text
   * shall be accepted for interactive form filling; for non-interactive form
   * filling, the filler should take care not to add more character than will
   * visibly fit in the defined area. 
   */
  doNotScroll = 1 << 23,

  /**
   * (PDF 1.5) May be set only if the MaxLen entry is present in the text field
   * dictionary (see "Table 232: Additional entry specific to a text field") and
   * if the Multiline, Password, and FileSelect flags are clear. If set, the field
   * shall be automatically divided into as many equally spaced positions, or
   * combs, as the value of MaxLen, and the text is laid out into those combs.
   */
  comb = 1 << 24,

  /**
   * (PDF 1.5) If set, the value of this field shall be a rich text string (see Annex
   * M, "Rich Text Reference"). If the field has a value, the RV entry of the field
   * dictionary ("Table 228: Additional entries common to all fields
   * containing variable text") shall specify the rich text string. 
   */
  richText = 1 << 25,
}

