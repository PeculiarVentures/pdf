
/**
 * Represents the repair status of a PDF document.
 */
export enum PDFRepairStatus {
  /**
   * The PDF document is not repairable. It is either corrupt or malformed.
   * The document should be fixed via the `PDFDocument.clone()` method.
   */
  requireClone = "RequireClone",
  /**
   * The PDF document is repairable and doesn't need to be rewritten.
   */
  repairable = "Repairable",
  /**
   * The PDF document is correctly formatted and does not need to be repaired.
   */
  notNeeded = "NotNeeded",
}
