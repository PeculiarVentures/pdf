import * as core from "@peculiarventures/pdf-core";
import * as fonts from "@peculiarventures/pdf-font";
import { ResourceManager } from "./ResourceManager";
import { FontComponent } from "./Font";
import { Watermark } from "./Watermark";
import { WrapContentObject } from "./WrapContentObject";
import * as forms from "./forms";

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
      this.#resources = new ResourceManager(
        this.target.Resources,
        this.document
      );
    }

    return this.#resources;
  }

  public get width(): number {
    return this.target.MediaBox.get(2, core.PDFNumeric).value;
  }

  public get height(): number {
    return this.target.MediaBox.get(3, core.PDFNumeric).value;
  }

  public get left(): number {
    return this.target.MediaBox.llX;
  }

  public get bottom(): number {
    return this.target.MediaBox.llY;
  }

  public get leftPadding(): number {
    return this.target.CropBox?.llX || 0;
  }

  public set leftPadding(value: core.TypographySize) {
    this.getOrCreateCropBox().llX = core.TypographyConverter.toPoint(value);
  }

  public get rightPadding(): number {
    return this.target.CropBox ? this.width - this.target.CropBox.urX : 0;
  }

  public set rightPadding(value: core.TypographySize) {
    this.getOrCreateCropBox().urX =
      this.width - core.TypographyConverter.toPoint(value);
  }

  public get topPadding(): number {
    return this.target.CropBox ? this.height - this.target.CropBox.urY : 0;
  }

  public set topPadding(value: core.TypographySize) {
    this.getOrCreateCropBox().urY =
      this.height - core.TypographyConverter.toPoint(value);
  }

  public get bottomPadding(): number {
    return this.target.CropBox?.llY || 0;
  }

  public set bottomPadding(value: core.TypographySize) {
    this.getOrCreateCropBox().llY = core.TypographyConverter.toPoint(value);
  }

  protected getOrCreateCropBox(): core.PDFRectangle {
    if (!this.target.CropBox) {
      this.target.CropBox = this.document.target.createRectangle(
        0,
        0,
        this.width,
        this.height
      );
    }

    return this.target.CropBox;
  }

  public addCheckBox(
    params: forms.ICheckBoxCreateParameters = {}
  ): forms.CheckBox {
    params.top =
      this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.checkBoxHandler.create(params);

    this.target.addAnnot(widget);

    const res = new forms.CheckBox(widget, this.document);

    // Set default flags
    res.print = true;

    if (params.enabled) {
      res.checked = true;
    }

    return res;
  }

  public addRadioButton(
    params: forms.IRadioButtonCreateParameters
  ): forms.RadioButton {
    params.top =
      this.height - core.TypographyConverter.toPoint(params.top || 0);

    const groupName = params.group || core.UUID.generate();
    const group = this.document.radioButtonHandler.getOrCreateGroup(groupName);

    const widget = this.document.radioButtonHandler.create(params);

    this.target.addAnnot(widget);

    const res = new forms.RadioButton(widget, this.document);

    // Set default flags
    res.print = true;

    group.attach(res);
    if (params.enabled) {
      res.checked = true;
    }

    return res;
  }

  public addTextEditor(
    params: forms.TextEditorCreateParameters
  ): forms.TextEditor {
    params.top =
      this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.textEditorHandler.create(params);

    this.target.addAnnot(widget);

    const res = new forms.TextEditor(widget, this.document);

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
        contentStream = core.PDFContentStream.create(
          this.document.target.update
        );
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

  public addInputImageBox(
    params: forms.InputImageBoxCreateParameters
  ): forms.InputImageBox {
    params.top =
      this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.inputImageHandler.create(params);

    this.target.addAnnot(widget);

    const component = new forms.InputImageBox(widget, this.document);

    component.image = params.image || null;

    return component;
  }

  public addSignatureBox(
    params: forms.ISignatureBoxCreateParameters = {}
  ): forms.SignatureBox {
    params.top =
      this.height - core.TypographyConverter.toPoint(params.top || 0);

    const widget = this.document.signatureBoxHandler.create(params);

    this.target.addAnnot(widget);

    // Enable signature flags if not enabled
    const acroForm = this.document.target.catalog.AcroForm.get();
    if (!acroForm.has("SigFlags")) {
      this.document.target.catalog.AcroForm.get().SigFlags =
        core.SignatureFlags.signaturesExist | core.SignatureFlags.appendOnly;
    }

    return new forms.SignatureBox(widget, this.document);
  }

  public addWatermark(watermark: Watermark): Watermark {
    this.target.addAnnot(watermark.target);

    return watermark;
  }

  public addComboBox(params: forms.ComboBoxCreateParameters): forms.ComboBox {
    const paramsCopy = {
      ...params,
      top: this.height - core.TypographyConverter.toPoint(params.top || 0)
    };

    const widget = this.document.comboBoxHandler.create(paramsCopy);

    this.target.addAnnot(widget);

    const comboBox = new forms.ComboBox(widget, this.document);

    comboBox.top = params.top || 0;
    comboBox.left = params.left || 0;
    comboBox.width = params.width || 0;
    comboBox.height = params.height || 0;

    const doc = this.document.target;

    comboBox.print = true;
    comboBox.combo = true;
    if (params.options) {
      comboBox.options = params.options;
    }
    if (params.selected) {
      comboBox.selected =
        typeof params.selected === "string"
          ? [params.selected]
          : params.selected;
    }

    // AP
    comboBox.target.MK.get().BG = this.document.target.createArray(
      doc.createNumber(1)
    );
    const helv = this.document.addFont(fonts.DefaultFonts.Helvetica);
    comboBox.font = helv;
    comboBox.fontSize = 12;
    comboBox.textColor = 0;

    return comboBox;
  }
}
