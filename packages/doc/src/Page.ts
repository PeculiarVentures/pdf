import * as core from "@PeculiarVentures/pdf-core";
import { ICheckBoxCreateParameters } from "./CheckBoxHandler";
import { CheckBox, SignatureBox, RadioButton, TextEditor, InputImageBox } from "./Form";
import { ISignatureBoxCreateParameters } from "./SignatureBoxHandler";
import { IRadioButtonCreateParameters } from "./RadioButtonHandler";
import { ResourceManager } from "./ResourceManager";
import { TextEditorCreateParameters } from "./TextEditorHandler";
import { InputImageBoxCreateParameters } from "./InputImageBoxHandler";
import { FontComponent } from "./Font";
import { Watermark } from "./Watermark";
import { WrapContentObject } from "./WrapContentObject";

export interface ImageDrawParameters {
  left?: core.TypographySize;
  top?: core.TypographySize;
  width?: core.TypographySize;
  height?: core.TypographySize;
  angle?: number;
}

export interface RectangleDrawParams {
  left?: core.TypographySize;
  top?: core.TypographySize;
  width?: core.TypographySize;
  height?: core.TypographySize;
  backgroundColor?: core.Colors;
  borderColor?: core.Colors;
  borderWidth?: core.TypographySize;
  transforms?: core.Transformations;
}

export interface LineDrawParams {
  x1?: core.TypographySize;
  y1?: core.TypographySize;
  x2?: core.TypographySize;
  y2?: core.TypographySize;
  color?: core.Colors;
  width?: core.TypographySize;
}

export enum TextLine {
  base,
  ascent,
  descent
}
export interface TextDrawParams {
  text: string;
  baseLine?: TextLine;
  left?: core.TypographySize;
  right?: core.TypographySize;
  top?: core.TypographySize;
  color?: core.Colors;
  font?: FontComponent;
  fontSize?: core.TypographySize;
  lineHeight?: number;
}

export class PDFPage extends WrapContentObject<core.PageObjectDictionary> {

  #resources?: ResourceManager;
  #content?: core.PDFContentStream;

  public get content(): core.PDFContent {
    if (!this.#content) {
      this.#content = this.getContentStream();
    }

    return this.#content.content;
  }

  public get resources(): ResourceManager {
    if (!this.#resources) {
      this.#resources = new ResourceManager(this.target.resources, this.document);
    }

    return this.#resources;
  }

  public get width(): number {
    return this.target.mediaBox.get(2, core.PDFNumeric).value;
  }

  public get height(): number {
    return this.target.mediaBox.get(3, core.PDFNumeric).value;
  }

  public get left(): number {
    return this.target.mediaBox.llX;
  }

  public get bottom(): number {
    return this.target.mediaBox.llY;
  }

  public addCheckBox(params: ICheckBoxCreateParameters = {}): CheckBox {
    params.top = this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.checkBoxHandler.create(params);

    this.target.addAnnot(widget);

    const res = new CheckBox(widget, this.document);

    // Set default flags
    res.print = true;

    if (params.enabled) {
      res.checked = true;
    }

    return res;
  }

  public addRadioButton(params: IRadioButtonCreateParameters): RadioButton {
    params.top = this.height - core.TypographyConverter.toPoint(params.top || 0);

    const groupName = params.group || core.UUID.generate();
    const group = this.document.radioButtonHandler.getOrCreateGroup(groupName);

    const widget = this.document.radioButtonHandler.create(params);

    this.target.addAnnot(widget);

    const res = new RadioButton(widget, this.document);

    // Set default flags
    res.print = true;

    group.attach(res);
    if (params.enabled) {
      res.checked = true;
    }

    return res;
  }

  public addTextEditor(params: TextEditorCreateParameters): TextEditor {
    params.top = this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.textEditorHandler.create(params);

    this.target.addAnnot(widget);

    const res = new TextEditor(widget, this.document);

    // Set default flags
    res.print = true;

    return res;
  }

  /**
   * Gets actual content or creates the new.
   * 
   * Actual is the content that was created in current update.
   * @returns Content stream
   */
  protected getContentStream(): core.PDFContentStream {
    let contentStream: core.PDFContentStream | null = null;
    let contents = this.target.contents;

    if (contents instanceof core.PDFStream) {
      contentStream = new core.PDFContentStream(contents);
    } else {
      // PDFArray
      if (!contents) {
        contents = this.target.contents = this.document.target.createArray();
      }

      if (contents.length) {
        // Use last content stream
        const object = contents.get(contents.length - 1);
        if (!(object instanceof core.PDFStream)) {
          throw new TypeError("Wrong type of PDF object in Page Contents.");
        }

        contentStream = new core.PDFContentStream(object);
        contents.items[contents.length - 1] = contentStream;
      } else {
        // Create new content stream);
        contentStream = core.PDFContentStream.create(this.document.target.update);
        contents.push(contentStream);
      }
    }

    if (contentStream.documentUpdate !== this.document.target.update) {
      // Create new content
      contentStream = core.PDFContentStream.create(this.document.target.update);
      if (contents instanceof core.PDFStream) {
        const array = this.document.target.createArray();
        this.target.contents = array;

        // Add prev content
        array.push(contents);

        // Add new content
        array.push(contentStream);
      } else {
        // Add new content
        contents.push(contentStream);
      }
    }

    return contentStream;
  }

  public addInputImageBox(params: InputImageBoxCreateParameters): InputImageBox {
    params.top = this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.inputImageHandler.create(params);

    this.target.addAnnot(widget);

    const component = new InputImageBox(widget, this.document);

    component.image = params.image || null;

    return component;
  }

  public addSignatureBox(params: ISignatureBoxCreateParameters = {}): SignatureBox {
    params.top = this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.signatureBoxHandler.create(params);

    this.target.addAnnot(widget);

    return new SignatureBox(widget, this.document);
  }

  public addWatermark(watermark: Watermark): Watermark {
    this.target.addAnnot(watermark.target);

    return watermark;
  }

}
