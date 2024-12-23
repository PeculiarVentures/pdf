import * as pdfDoc from "@peculiarventures/pdf-doc";
import { JsonTextEditorUpdate } from "../types";
import { WidgetConverter } from "./WidgetConverter";

/**
 * A ComponentConverter for TextEditor form components.
 */
export class TextEditorConverter extends WidgetConverter<pdfDoc.TextEditor> {
  public typeJSON = pdfDoc.FormComponentType.textEditor as const;

  constructor() {
    super(pdfDoc.TextEditor);
  }

  protected onExport(
    component: pdfDoc.TextEditor,
    json: Record<string, unknown>
  ): void {
    json.maxLen = component.maxLen;
    json.multiline = component.multiline;
    json.text = component.text;
  }

  public override setValue(
    component: pdfDoc.TextEditor,
    data: JsonTextEditorUpdate
  ): void {
    component.text = data.text;
  }
}
