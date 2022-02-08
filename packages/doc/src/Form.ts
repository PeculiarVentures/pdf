import { AsnConvert } from "@peculiar/asn1-schema";
import * as core from "@peculiarventures/pdf-core";
import { TSTInfo } from "@peculiar/asn1-tsp";
import { X509Certificate, X509Certificates } from "@peculiar/x509";
import { Convert } from "pvtsutils";

import * as cms from "./cms";
import { ICheckBoxHandler } from "./CheckBoxHandler";
import type { PDFDocument } from "./Document";
import { IFormComponentParameters } from "./FormComponentHandler";
import { TextEditorDrawParameters } from "./TextEditorHandler";
import { FormObject } from "./FormObject";
import { Image } from "./Image";
import { IRadioButtonHandler } from "./RadioButtonHandler";
import { ResourceManager } from "./ResourceManager";
import { WrapObject } from "./WrapObject";
import { FontComponent } from "./Font";

const pkijs = require("pkijs");

function flag(f: core.AnnotationFlags, fieldFlag = false, repaint = false): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Object.defineProperty(target, propertyKey, {
      get: function (this: FormComponent): boolean {
        let flags = 0;
        if (fieldFlag) {
          const filed = FormComponentFactory.getField(this.target);
          flags = filed.ff;
        } else {
          flags = this.target.f;
        }

        return !!((flags & f) === f);
      },
      set: function (this: FormComponent, v: boolean): void {
        const value = (this as any)[propertyKey];
        if (value === v) {
          return;
        }
        if (v) {
          if (fieldFlag) {
            FormComponentFactory.getField(this.target).ff |= f;
          } else {
            this.target.f |= f;
          }
        } else {
          if (fieldFlag) {
            FormComponentFactory.getField(this.target).ff ^= f;
          } else {
            this.target.f ^= f;
          }
        }
        if (repaint) {
          this.paint();
        }
      }
    });
  };
}

function fieldFlag(value: number, repaint = false) {
  return flag(value, true, repaint);
}
function annotFlag(value: number, repaint = false) {
  return flag(value, false, repaint);
}

export interface IComponent {
  readonly name: string;
  delete(): void;
}

export type IComponentConstructor<T extends IComponent> = new (target: any, document: PDFDocument) => T;

export class FormComponent extends WrapObject<core.WidgetDictionary> implements IComponent {

  public static readonly COLOR_OPERATORS = ["g", "rg", "k"];

  /**
   * Get the name of the component
   */
  public get name(): string {
    const field = FormComponentFactory.getField(this.target);

    return field.t.text;
  }

  public get left(): number {
    return this.target.rect.urX;
  }

  public set left(v: core.TypographySize) {
    const vPt = core.TypographyConverter.toPoint(v);
    const width = this.width;

    this.target.rect.modify();
    this.target.rect.llX = vPt;
    this.target.rect.urX = vPt + width;
  }

  public get top(): number {
    if (this.target.p) {
      const page = this.target.p.to(core.PageObjectDictionary);

      return page.mediaBox.urY - this.target.rect.urY;
    }

    return this.target.rect.urY;
  }

  public set top(v: core.TypographySize) {
    let vPt = core.TypographyConverter.toPoint(v);
    const height = this.width;

    vPt = (this.target.p)
      ? this.target.p.to(core.PageObjectDictionary).mediaBox.urY - vPt
      : vPt;

    this.target.rect.modify();
    this.target.rect.llY = vPt - height;
    this.target.rect.urY = vPt;
  }

  /**
   * Gets component width
   */
  public get width(): number {
    return this.target.rect.urX - this.target.rect.llX;
  }

  /**
   * Sets component width
   */
  public set width(value: core.TypographySize) {
    const width = core.TypographyConverter.toPoint(value);

    if (this.width !== width) {
      this.target.rect.urX = this.target.rect.llX + width;

      this.onWidthChanged();
    }
  }

  protected onWidthChanged(): void {
    // nothing
  }

  /**
   * Gets component height
   */
  public get height(): number {
    return this.target.rect.urY - this.target.rect.llY;
  }

  /**
   * Sets component height
   */
  public set height(value: core.TypographySize) {
    const height = core.TypographyConverter.toPoint(value);

    if (this.height !== height) {
      this.target.rect.llY += this.height - height;
      this.target.rect.urY = this.target.rect.llY + height;

      this.onHeightChanged();
    }
  }

  protected onHeightChanged(): void {
    // nothing
  }

  /**
   * Gets component border width
   */
  public get borderWidth(): number {
    if (this.target.BS.has()) {
      const bs = this.target.BS.get();

      return bs.W ?? 1;
    }

    // TODO Use default from handler
    return 1;
  }

  /**
   * Sets component border width
   */
  public set borderWidth(value: core.TypographySize) {
    const size = core.TypographyConverter.toPoint(value);
    if (this.borderWidth !== size) {
      this.target.BS.get().W = size;

      this.onBorderWidthChanged();
    }
  }

  protected onBorderWidthChanged(): void {
    // nothing
  }

  /**
   * Gets component border color
   */
  public get borderColor(): core.Colors {
    if (this.target.MK.has()) {
      const mk = this.target.MK.get();

      if (mk.BC) {
        return core.ColorConverter.fromPDFArray(mk.BC);
      }
    }

    // TODO Use default from handler
    return 0;
  }

  /**
   * Sets component border color
   */
  public set borderColor(value: core.Colors) {
    const color = core.ColorConverter.toPDFArray(value);
    const mk = this.target.MK.get();
    mk.BC = color;

    this.onBorderColorChanged();
  }

  protected onBorderColorChanged(): void {
    // nothing
  }

  /**
   * Gets component background color
   */
  public get backgroundColor(): core.Colors {
    if (this.target.MK.has()) {
      const mk = this.target.MK.get();

      if (mk.BG) {
        return core.ColorConverter.fromPDFArray(mk.BG);
      }
    }

    // TODO Use default from handler
    return 1;
  }

  /**
   * Sets component background color
   */
  public set backgroundColor(value: core.Colors) {
    const color = core.ColorConverter.toPDFArray(value);
    const mk = this.target.MK.get();
    mk.BG = color;

    this.onBorderColorChanged();
  }

  protected onBackgroundColorChanged(): void {
    // nothing
  }

  /**
   * Gets component fore color
   */
  public get foreColor(): core.Colors {
    try {
      let text: core.PDFTextString | null = null;
      if (this.target.has("DA")) {
        text = this.target.get("DA", core.PDFTextString);
      } else if (this.target.MK.has() && this.target.MK.get().has("PV_FC")) {
        text = this.target.MK.get().get("PV_FC", core.PDFTextString);
      }

      if (text) {
        const content = core.PDFContent.fromString(text.text);
        const color = content.operators.find(o => o instanceof core.PDFOperator && FormComponent.COLOR_OPERATORS.includes(o.name));
        if (color instanceof core.PDFOperator) {
          return core.ColorConverter.fromPDFNumberArray(color.parameters as core.PDFNumeric[]);
        }
      }
    } catch {
      // nothing
    }

    // TODO Use default from handler
    return 0;
  }

  /**
   * Sets component fore color
   */
  public set foreColor(value: core.Colors) {
    // PDF doesn't have field for the fore color annotation. For variable text use DA.
    // If set DA for graphics Acrobat doesn't show images
    const content = new core.PDFContent()
      .setColor(value);
    this.target.MK.get().set("PV_FC", this.document.target.createString(content.toString()));

    this.onForeColorChanged();
  }

  protected onForeColorChanged(): void {
    // nothing
  }

  /**
   * If set, do not render the annotation or allow it to interact with the user,
   * regardless of its annotation type or whether an annotation handler is available.
   * @remarks In cases where screen space is limited, the ability to hide and show
   * annotations selectively can be used in combination with appearance
   * streams (see 12.5.5, "Appearance streams") to render auxiliary popup
   * information similar in function to online help systems. 
   * @remarks PDF 1.2
   */
  @annotFlag(core.AnnotationFlags.hidden)
  public hidden!: boolean;

  /**
   * Applies only to annotations which do not belong to one of the standard annotation types
   * and for which no annotation handler is available. If set, do not render the unknown
   * annotation using an appearance stream specified by its appearance dictionary, if any (see
   * annotation and do not print it even if the Print flag is set. If clear, render such an unknown
   * 12.5.5, "Appearance streams"). 
   */
  @annotFlag(core.AnnotationFlags.invisible)
  public invisible!: boolean;

  /**
   * If set, do not allow the annotation to be deleted or its properties (including
   * position and size) to be modified by the user. However, this flag does not restrict changes
   * to the annotation’s contents, such as the value of a form field.
   * @remarks PDF 1.4
   */
  @annotFlag(core.AnnotationFlags.locked)
  public locked!: boolean;

  /**
   * If set, do not allow the contents of the annotation to be modified by the user.
   * This flag does not restrict deletion of the annotation or changes to other annotation
   * properties, such as position and size.
   * @remarks PDF 1.7
   */
  @annotFlag(core.AnnotationFlags.lockedContents)
  public lockedContents!: boolean;

  /**
   * If set, do not rotate the annotation’s appearance to match the rotation of the
   * page. The upper-left corner of the annotation rectangle shall remain in a fixed location on
   * the page, regardless of the page rotation. See further discussion following this table
   * @remarks PDF 1.3
   */
  @annotFlag(core.AnnotationFlags.noRotate)
  public noRotate!: boolean;

  /**
   * If set, do not render the annotation on the screen or allow it to interact with the
   * user. The annotation may be printed (depending on the setting of the Print flag) but
   * should be considered hidden for purposes of on-screen display and user interaction. 
   * @remarks PDF 1.3
   */
  @annotFlag(core.AnnotationFlags.noView)
  public noView!: boolean;

  /**
   * If set, do not scale the annotation’s appearance to match the magnification of the
   * page. The location of the annotation on the page (defined by the upper-left corner of its
   * annotation rectangle) shall remain fixed, regardless of the page magnification. See further
   * discussion following this table. 
   * @remarks PDF 1.3
   */
  @annotFlag(core.AnnotationFlags.noZoom)
  public noZoom!: boolean;

  /**
   * If set, print the annotation when the page is printed unless the Hidden flag is
   * also set. If clear, never print the annotation, regardless of whether it is rendered on the
   * screen. If the annotation does not contain any appearance streams this flag shall be
   * ignored.
   * @remarks This can be useful for annotations representing interactive push-buttons,
   * which would serve no meaningful purpose on the printed page. 
   * @remarks PDF 1.2
   */
  @annotFlag(core.AnnotationFlags.print)
  public print!: boolean;

  /**
   * If set, do not allow the annotation to interact with the user. The annotation may
   * be rendered or printed (depending on the settings of the NoView and Print flags) but
   * should not respond to mouse clicks or change its appearance in response to mouse
   * motions.
   * 
   * This flag shall be ignored for widget annotations; its function is subsumed by the
   * ReadOnly flag of the associated form field (see "Table 226: Field flags common to all field
   * types"). 
   * @remarks PDF 1.3
   */
  @annotFlag(core.AnnotationFlags.readOnly)
  public readOnlyAnnot!: boolean;

  /**
   * If set, invert the interpretation of the NoView flag for annotation selection and
   * mouse hovering, causing the annotation to be visible when the mouse pointer hovers over
   * the annotation or when the annotation is selected.
   * @remarks PDF 1.5
   */
  @annotFlag(core.AnnotationFlags.toggleNoView)
  public toggleNoView!: boolean;

  @fieldFlag(core.FieldFlags.required)
  public required!: boolean;

  @fieldFlag(core.FieldFlags.readOnly)
  public readOnly!: boolean;

  @fieldFlag(core.FieldFlags.noExport)
  public noExport!: boolean;

  public delete(): void {
    const parent = this.target.p;
    if (parent && parent.annots) {
      const index = parent.annots.indexOf(this.target);
      if (index !== -1) {
        parent.annots.splice(index, 1);
      }
    }
  }

  public paint(): void {
    //empty
  }
}

export class CheckBox extends FormComponent {

  public get checked(): boolean {
    return this.target.as !== "Off";
  }

  public set checked(v: boolean) {
    if (this.checked !== v) {
      const stateName = v ? this.getYesStateName() : "Off";
      this.target.modify();
      if (this.target.items.has("V")) {
        this.target.items.set("V", this.document.target.createString(stateName));
      }
      this.target.as = stateName;
    }
  }

  public get value(): string {
    return this.getYesStateName();
  }

  protected override onWidthChanged(): void {
    this.paint();
  }

  protected override onHeightChanged(): void {
    this.paint();
  }

  protected override onBorderWidthChanged(): void {
    this.paint();
  }

  protected override onBorderColorChanged(): void {
    this.paint();
  }

  protected override onBackgroundColorChanged(): void {
    this.paint();
  }

  protected override onForeColorChanged(): void {
    this.paint();
  }

  protected getHandler(): ICheckBoxHandler {
    return this.document.checkBoxHandler;
  }

  public override paint(): void {
    const ap = this.target.AP.get(true);
    if (ap.N instanceof core.PDFDictionary) {
      for (const [key] of ap.N.items) {
        const state = ap.N.get(key);
        if (state instanceof core.PDFStream) {
          const formDict = state.to(core.FormDictionary, true);
          const form = new FormObject(formDict, this.document);

          // change BBox
          form.width = this.width;
          form.height = this.height;

          // draw content
          const params: IFormComponentParameters = {
            left: this.left,
            top: this.top,
            height: this.height,
            width: this.width,
            foreColor: this.foreColor,
            backgroundColor: this.backgroundColor,
            borderColor: this.borderColor,
            borderWidth: this.borderWidth,
          };
          const handler = this.getHandler();
          form.clear();
          if (key === "Off") {
            // TODO stream setting must refresh encoding and cached view 
            handler.drawOff(form, params);
          } else {
            handler.drawOn(form, params);
          }
        }
      }
    }
  }

  /**
   * Gets name of the Yes state from Appearance dictionary 
   */
  protected getYesStateName(): string {
    const ap = this.target.AP.get(true);
    if (ap.N instanceof core.PDFDictionary) {
      for (const [key] of ap.N.items) {
        if (key !== "Off") {
          return key;
        }
      }
      throw new Error("Cannot get Yes state");
    } else {
      throw new Error("Unsupported type of N field");
    }
  }

}

export class RadioButton extends CheckBox implements IFormGroupedComponent {

  public override get checked(): boolean {
    return super.checked;
  }

  public override set checked(v: boolean) {
    if (v !== this.checked) {

      const group = this.findGroup();

      // Change Widget appearance state
      const stateName = v ? this.getYesStateName() : "Off";
      this.target.as = stateName;

      // Update filed
      if (group && group.selected && group.selected !== stateName) {
        // disable prev selected
        const selected = group.get(group.selected);
        selected.checked = false;
      }

      if (group) {
        // change value
        group.target.V = v
          ? this.document.target.createName(stateName)
          : null;
      }
    }
  }

  protected override getHandler(): IRadioButtonHandler {
    return this.document.radioButtonHandler;
  }

  public get groupName(): string | null {
    const group = this.findGroup();

    return group
      ? group.name
      : null;
  }

  public set groupName(v: string | null) {
    if (v) {
      const group = this.document.radioButtonHandler.getOrCreateGroup(v);
      group.attach(this);
    }
  }

  public findGroup(): RadioButtonGroup | null {
    const field = this.target.Parent as core.ButtonDictionary;

    if (field) {
      return new RadioButtonGroup(field, this.document);
    }

    return null;
  }

}

export interface IFormGroupedComponent extends IComponent {
  target: core.WidgetDictionary;
  groupName: string | null;
  findGroup(): FormComponentGroup | null;
}

export class FormComponentGroup<TTarget extends core.PDFField = core.PDFField, TItem extends IFormGroupedComponent = any> extends WrapObject<TTarget> implements IComponent, Iterable<TItem> {

  [Symbol.iterator](): Iterator<TItem, any, undefined> {
    let pointer = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this;
    const items = this.target.Kids.has()
      ? this.target.Kids.get()
      : [];

    return {
      next(): IteratorResult<TItem> {
        if (pointer < items.length) {
          return {
            done: false,
            value: _this.get(pointer++)
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
  }

  public delete(): void {
    const acroForm = this.document.target.update.catalog?.AcroForm;
    if (acroForm && acroForm.has()) {
      const fields = acroForm.get().Fields;
      const index = fields.indexOf(this.target);
      if (index !== -1) {
        fields.splice(index, 1);
      }
    }

    for (const item of this) {
      item.delete();
    }
  }

  public get(index: number): TItem {
    if (this.target.Kids.has()) {
      const kids = this.target.Kids.get();

      const component = FormComponentFactory.create(kids.get(index, core.WidgetDictionary, true), this.document);
      if (component instanceof FormComponent) {
        return component as any as TItem;
      }

      throw new Error("Cannot load form component from PDF Widget.");
    }

    throw new RangeError("PDF Array is empty");
  }

  public attach(item: TItem): void {
    if (item.groupName === this.name) {
      // item is already in the group
      return;
    }

    if (item.groupName && item.groupName !== this.name) {
      // Detach item from the another group
      const prevGroup = item.findGroup();
      if (prevGroup) {
        prevGroup.detach(item);
      }
    }

    // Attach to the current group
    const kids = this.target.Kids.get();
    kids.push(item.target.makeIndirect());
    item.target.Parent = this.target;

    const fields = this.document.target.update.catalog!.AcroForm.get().Fields;
    if (fields.indexOf(this.target) === -1) {
      fields.push(this.target.makeIndirect());
    }
  }

  public indexOf(item: TItem): number {
    if (item.groupName === this.name) {
      const kids = this.target.Kids.get();
      for (let i = 0; i < kids.length; i++) {
        const kid = kids.get(i);
        if (item.target.equal(kid)) {
          return i;
        }
      }
    }

    return -1;
  }

  public detach(item: TItem): boolean {
    const index = this.indexOf(item);

    if (index > -1) {
      const itemComponent = this.get(index);

      this.onDetach(itemComponent);

      this.target.Kids.get().splice(index, 1);
      item.target.Parent = null;

      if (!this.length) {
        // Remove empty Filed from AcroForm
        this.delete();
      }

      return true;
    }

    return false;
  }

  protected onDetach(item: TItem): void {
    // nothing
  }

  public get length(): number {
    if (this.target.Kids.has()) {
      return this.target.Kids.get().length;
    }

    return 0;
  }

  public get name(): string {
    return this.target.t.text;
  }

  public set name(value: string) {
    this.target.t.text = value;
  }

}

export class RadioButtonGroup extends FormComponentGroup<core.ButtonDictionary, RadioButton> {

  public override get(index: number): RadioButton;
  public override get(name: string): RadioButton;
  public override get(id: number | string): RadioButton {
    if (this.length) {
      if (typeof id === "number") {
        return super.get(id);
      } else {
        for (const item of this) {
          if (id === item.value) {
            return item;
          }
        }
      }

      throw new Error("Cannot load RadioButton component from PDF Widget.");
    }

    throw new RangeError("PDF Array is empty");
  }

  protected override onDetach(item: RadioButton): void {
    item.checked = false;
  }

  public get selected(): string | null {
    if (this.target.V instanceof core.PDFName) {
      return this.target.V.text;
    }

    return null;
  }

}
export class TextEditor extends FormComponent {

  public get text(): string {
    if (this.target.has("V")) {
      return this.target.get("V", core.PDFTextString).text;
    }

    return "";
  }

  public set text(v: string) {
    if (this.text !== v) {
      this.target.set("V", this.document.target.createString(v));
      this.paint();
    }
  }

  public get maxLen(): number {
    if (this.target.has("MaxLen")) {
      return this.target.get("MaxLen", core.PDFNumeric).value;
    }

    return 0;
  }

  public set maxLen(v: number) {
    if (this.maxLen !== v) {
      this.target.set("MaxLen", this.document.target.createNumber(v));
      if (this.text.length > v) {
        this.text = this.text.substr(0, v);
      }
    }
  }

  public get font(): FontComponent {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const operator of content.operators) {
        if (operator instanceof core.PDFOperator) {
          if (operator.name === "Tf") {
            const fontName = (operator.parameters[0] as core.PDFName).text;

            const ap = this.target.AP.get().N;
            if (ap instanceof core.PDFDictionary) {
              const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
              const font = formAP.resources.get(fontName);

              if (!(font.target instanceof core.PDFDictionary)) {
                throw new TypeError();
              }
              const fontDictionary = FontComponent.toFontDictionary(font.target);

              return new FontComponent({ document: this.document, fontDictionary, name: fontName });
            }

            break;
          }
        }
      }
    }

    let resName = "";
    const defaultFont = this.document.addFont();
    const ap = this.target.AP.get().N;
    if (ap instanceof core.PDFDictionary) {
      const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
      resName = formAP.resources.set(defaultFont.target).name;
    }

    return new FontComponent({ document: this.document, fontDictionary: defaultFont.target, name: resName });
  }

  public set font(v: FontComponent) {
    if (!(this.target.has("DA") && this.font.name === v.name)) {

      let resName = "";
      const ap = this.target.AP.get().N;
      if (ap instanceof core.PDFDictionary) {
        const formAP = new FormObject(ap.to(core.FormDictionary), this.document);
        resName = formAP.resources.set(v.target).name;
      }
      const resFontComponent = new FontComponent({ document: this.document, fontDictionary: v.target, name: resName });

      this.setDA(resFontComponent, this.fontSize, this.textColor);
    }
  }

  public get fontSize(): number {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const operator of content.operators) {
        if (operator instanceof core.PDFOperator) {
          if (operator.name === "Tf") {
            const size = operator.parameters[1] as core.PDFNumeric;

            return size.value;
          }
        }
      }
    }

    return FontComponent.DEFAULT_SIZE;
  }

  public set fontSize(v: core.TypographySize) {
    if (!(this.target.has("DA") && this.fontSize === v)) {
      this.setDA(this.font, v, this.textColor);
    }
  }

  public get textColor(): core.Colors {
    if (this.target.has("DA")) {
      const text = this.target.get("DA", core.PDFTextString).text;
      const content = core.PDFContent.fromString(text);

      for (const operator of content.operators) {
        if (operator instanceof core.PDFOperator && FormComponent.COLOR_OPERATORS.includes(operator.name)) {
          const color = core.ColorConverter.fromPDFNumberArray(operator.parameters as core.PDFNumeric[]);

          return color;
        }
      }
    }

    return 0;
  }

  public set textColor(v: core.Colors) {
    if (!(this.target.has("DA") && this.textColor === v)) {
      this.setDA(this.font, this.fontSize, v);
    }
  }

  private setDA(font: FontComponent, size: core.TypographySize, color: core.Colors) {
    const newContent = new core.PDFContent();
    newContent.setColor(color);
    newContent.setFontAndSize({ font: font.name, size: core.TypographyConverter.toPoint(size) });

    this.target.set("DA", this.document.target.createString(newContent.toString(true)));
    this.paint();
  }

  @fieldFlag(core.TextFieldFlags.multiline, true)
  public multiline!: boolean;

  @fieldFlag(core.TextFieldFlags.doNotScroll)
  public doNotScroll!: boolean;

  @fieldFlag(core.TextFieldFlags.doNotSpellCheck)
  public doNotSpellCheck!: boolean;

  protected override onWidthChanged(): void {
    this.paint();
  }

  protected override onHeightChanged(): void {
    this.paint();
  }

  public override paint(): void {
    const ap = this.target.AP.get(true);
    if (ap.N instanceof core.PDFStream) {
      const formDict = ap.N.to(core.FormDictionary, true);
      const form = new FormObject(formDict, this.document);

      // change BBox
      form.width = this.width;
      form.height = this.height;

      // draw content
      const params: TextEditorDrawParameters = {
        font: this.font,
        fontSize: this.fontSize,

        color: this.textColor,
        multiline: this.multiline,

        text: this.text,
        maxLen: this.maxLen,

        width: this.width,
        height: this.height,
      };

      const handler = this.document.textEditorHandler;
      form.clear();
      handler.drawText(form, params);
    }
  }
}

export class SignatureBox extends FormComponent implements IFormGroupedComponent {

  public get groupName(): string | null {
    const group = this.findGroup();

    return group
      ? group.name
      : null;
  }

  public set groupName(v: string | null) {
    if (v) {
      const group = this.document.signatureBoxHandler.getOrCreateGroup(v);
      group.attach(this);
    }
  }

  public findGroup(): SignatureBoxGroup | null {
    const field = this.target.Parent as core.SignatureFiled;
    if (field) {
      return new SignatureBoxGroup(field, this.document);
    } else if (this.target.has("FT")) {
      // Filed + Widget
      return new SignatureBoxGroup(this.target.to(core.SignatureFiled), this.document);
    }



    return null;
  }

  public getGroup(): SignatureBoxGroup {
    const group = this.findGroup();
    if (!group) {
      throw Error("Cannot sign document. SignatureBox is not assigned to the Signature field.");
    }

    return group;
  }

  public draw(object: FormObject): this {
    const nForm = this.getAppearance();

    nForm.target.modify();
    const gr = nForm
      .clear()
      .graphics();

    const widthScale = this.width / object.width;
    const heightScale = this.height / object.height;
    const scale = Math.min(widthScale, heightScale);
    if (widthScale < heightScale) {
      gr.translate(0, (this.height - (object.height * scale)) / 2);
    } else {
      gr.translate((this.width - (object.width * scale)) / 2, 0);
    }
    gr
      .scale(scale, scale)
      .drawObject(object);

    return this;
  }

  public async sign(params: SignatureBoxSignParameters): Promise<SignatureBoxGroup> {
    const group = this.getGroup();

    return group.sign(params);
  }

  public async verify(checkDate?: Date): Promise<SignatureVerifyResult> {
    const group = this.getGroup();

    return group.verify(checkDate);
  }

  protected getAppearance(): FormObject {
    const n = this.target.AP.get().N;
    const formDict = (n instanceof core.PDFStream)
      ? n.to(core.FormDictionary, true)
      : core.FormDictionary.create(this.target.documentUpdate!).makeIndirect();

    return new FormObject(formDict, this.document);
  }

  protected override onWidthChanged(): void {
    this.onSizeChange();
  }

  protected override onHeightChanged(): void {
    this.onSizeChange();
  }

  protected onSizeChange(): void {
    const n = this.getAppearance();
    n.width = this.width;
    n.height = -this.height;
  }

}

export type SignatureBoxCreateImageCallback = (this: SignatureBoxGroup) => FormObject;
export type SignatureDictionaryUpdateCallback = (this: SignatureBoxGroup, filed: core.SignatureDictionary) => Promise<void>;
export type SignatureFieldSigningCallback = (this: SignatureBoxGroup, data: Uint8Array) => Promise<ArrayBuffer>;

export interface SignatureBoxSignParameters {
  containerSize?: number;
  createImage?: SignatureBoxCreateImageCallback;
  dictionaryUpdate?: SignatureDictionaryUpdateCallback;
  containerCreate: SignatureFieldSigningCallback;
}

export type SignatureType = "signature" | "timestamp" | "certified";

type SignatureStateType = "info" | "invalid" | "valid" | "warn";

export interface SignatureState {
  type: SignatureStateType;
  text: string;
  code: string;
  data: any;
}

export interface EmbeddedTimestampState extends SignatureState {
  type: "info";
  code: "embedded_timestamp";
  text: string;
  data: {
    valid: boolean;
    certChain: X509Certificates;
  };
}

export interface SigningTimeState extends SignatureState {
  code: "signing_time";
  data: {
    type: "local" | "empty" | "embedded";
  }
}

export interface EmptySigningTimeState extends SigningTimeState {
  type: "info";
  data: {
    type: "empty";
  }
}

export interface LocalSigningTimeState extends SigningTimeState {
  type: "info";
  data: {
    type: "local";
    date: Date;
  }
}

export interface EmbeddedSigningTimeState extends SigningTimeState {
  type: "valid" | "invalid";
  data: {
    type: "embedded";
    date: Date;
    signature?: cms.CMSSignedDataVerifyResult;
    signer?: X509Certificate;
    chain?: cms.CertificateChainResult;
    info: TSTInfo
  }
}

export type SigningTimeStates = EmptySigningTimeState | LocalSigningTimeState | EmbeddedSigningTimeState;

export interface SigningTimeVerifiedState extends SignatureState {
  type: "info";
  code: "signing_time_verified";
  data: cms.CertificateChainResult;
}

export interface SigningTimeLocalState extends SignatureState {
  type: "info";
  code: "signing_time_from_local";
  data: null;
}

export interface DocumentModificationState extends SignatureState {
  code: "document_modification";
  data: {
    state: "not_modified" | "modified" | "error";
  };
}

export interface LtvState extends SignatureState {
  text: string;
  code: "ltv";
  data: {
    state: boolean;
    reason?: string;
  };
}

export interface SigningCertificateData extends cms.CertificateChainResult {
  state: "verified" | "not_verified";
}

export interface SignerCertificateState extends SignatureState {
  text: string;
  code: "identity_verification";
  data: SigningCertificateData;
}

export interface FormattingState extends SignatureState {
  type: "valid" | "invalid" | "warn";
  code: "formatting";
  data: {
    error?: Error;
  };
}

export type SignatureStates =
  SignatureState |
  DocumentModificationState |
  SigningTimeStates |
  FormattingState |
  SignerCertificateState |
  LtvState |
  DocumentModificationState;

export interface SignatureVerifyResult {
  verificationResult: boolean;
  message?: string;
  checkDate: Date | null;
  hasSHA1: boolean;
  name: string | null;
  location: string | null;
  reason: string | null;
  signingTime: Date | null;
  signatureType: SignatureType;
  signerCertificate: X509Certificate | null;
  certificatePath?: cms.CertificateChainResult;
  states: SignatureStates[]
}

export class SignatureBoxGroup extends FormComponentGroup<core.SignatureFiled, SignatureBox> {

  public static readonly CONTAINER_SIZE = 2 * 1024;
  public static readonly SUB_FILTER = "ETSI.CAdES.detached";

  public static dictionaryUpdate: SignatureDictionaryUpdateCallback = async function dictionaryUpdate(dict: core.SignatureDictionary) {
    dict.subFilter = SignatureBoxGroup.SUB_FILTER;
  };

  public get isSigned(): boolean {
    return !!this.target.V;
  }

  public async sign(params: SignatureBoxSignParameters): Promise<this> {
    const update = this.target.documentUpdate;
    if (!update) {
      throw new Error("Document update is empty");
    }
    const document = update.document;
    const forms = update.catalog!.AcroForm.get();

    // Create Signature dictionary
    const signValue = core.SignatureDictionary.create(update);
    const byteRange = signValue.ByteRange.get();
    const blockOffset1 = document.createNumber(0, 10);
    const blockLength1 = document.createNumber(0, 10);
    const blockOffset2 = document.createNumber(0, 10);
    const blockLength2 = document.createNumber(0, 10);
    byteRange.push(blockOffset1);
    byteRange.push(blockLength1);
    byteRange.push(blockOffset2);
    byteRange.push(blockLength2);
    signValue.Contents.text = Convert.ToHex(new Uint8Array(params.containerSize || SignatureBoxGroup.CONTAINER_SIZE));

    const dictUpdateCb = params.dictionaryUpdate || SignatureBoxGroup.dictionaryUpdate;
    await dictUpdateCb.call(this, signValue);

    this.target.V = signValue.makeIndirect(false);

    // draw contents for all visual signatures
    let sigForm: FormObject | null = null;
    for (const sigBox of this) {
      if (sigBox.width && sigBox.height) {
        if (!sigForm) {
          if (!params.createImage) {
            throw new Error("Signature box requires visual content.");
          }
          sigForm = params.createImage.call(this);
        }
        sigBox.draw(sigForm);
      }
    }

    forms.SigFlags |= core.SignatureFlags.signaturesExist;
    // TODO move flags to params maybe
    forms.SigFlags |= core.SignatureFlags.appendOnly;

    // Serialize document
    await document.toPDF();

    // Set offsets and lengths for the ByteRange
    blockLength1.value = signValue.Contents.view.byteOffset;
    blockLength1.view.set(new Uint8Array(Convert.FromBinary(blockLength1.toString())));
    blockOffset2.value = signValue.Contents.view.byteOffset + signValue.Contents.view.length;
    blockOffset2.view.set(new Uint8Array(Convert.FromBinary(blockOffset2.toString())));
    blockLength2.value = document.view.length - 1 - blockOffset2.value;
    blockLength2.view.set(new Uint8Array(Convert.FromBinary(blockLength2.toString())));

    // Get signing content
    // Concatenate buffers
    const buffers = [
      document.view.subarray(blockOffset1.value, blockOffset1.value + blockLength1.value),
      document.view.subarray(blockOffset2.value, blockOffset2.value + blockLength2.value),
    ];
    const content = new Uint8Array(buffers.map(o => o.length).reduce((p, c) => p + c));
    let offset = 0;
    for (const view of buffers) {
      content.set(view, offset);
      offset += view.length;
    }

    const signedData = await params.containerCreate.call(this, content);

    if (signedData.byteLength > signValue.Contents.text.length / 2) {
      throw new Error(`Received Contents value is greater than allocated buffer. Allocated buffer must be ${signedData.byteLength}.`);
    }
    signValue.Contents.text = Convert.ToHex(signedData).padEnd(signValue.Contents.text.length, "0");
    signValue.Contents.view.set(new Uint8Array(Convert.FromBinary(signValue.Contents.toString())));

    await this.document.save();

    return this;
  }

  public getContent(): Uint8Array {
    const signatureValue = this.getSignatureValue();

    if (!signatureValue.ByteRange.has()) {
      throw new Error("Required field ByteRange is missed in Signature dictionary");
    }
    const byteRange = signatureValue.ByteRange.get().items.map(o => (o as core.PDFNumeric).value);
    const buffers: Uint8Array[] = [];
    const docView = this.target.documentUpdate!.document.view;
    for (let i = 0; i < byteRange.length; i++) {
      const offset = byteRange[i++];
      const length = byteRange[i];
      buffers.push(new Uint8Array(docView.buffer, offset, length));
    }

    // Concatenate buffers
    const signedContent = new Uint8Array(buffers.map(o => o.length).reduce((p, c) => p + c));
    let offset = 0;
    for (const view of buffers) {
      signedContent.set(view, offset);
      offset += view.length;
    }

    return signedContent;
  }

  public async thumbprint(crypto: Crypto = this.document.crypto): Promise<string> {
    const signatureValue = this.getSignatureValue();

    const digest = await (crypto || pkijs.getEngine()).subtle.digest("SHA-1", signatureValue.Contents.data);

    return Convert.ToHex(digest).toUpperCase();
  }

  public getSignatureValue(): core.SignatureDictionary {
    if (!this.target.V) {
      throw new Error("The current signature field is not signed yet.");
    }

    return this.target.V;
  }

  public async verify(checkDate?: Date): Promise<SignatureVerifyResult> {
    const dateNow = new Date();
    checkDate ||= dateNow;
    
    // TODO Decrypt values on PDF reading
    await FormComponentFactory.getField(this.target as any).t.decode();

    const result: SignatureVerifyResult = {
      verificationResult: false,
      hasSHA1: false,
      name: this.name,
      reason: null,
      location: null,
      signingTime: null,
      checkDate: checkDate,
      signatureType: "signature",
      signerCertificate: null,
      states: [],
    };

    try {
      const signatureValue = this.getSignatureValue();
      const signedData = this.getSignedData(signatureValue);
      const signer = this.getSigner(signedData);
      const timeStamp = await this.getTimeStamp(signedData);
      const signingTime = await this.getSigningTime(timeStamp);
      const content = this.getContent();

      const subFilter = signatureValue.subFilter;
      // Get signature type
      let signatureType: SignatureType = (subFilter === "ETSI.RFC3161") ? "timestamp" : "signature";

      if (signatureType === "signature") {
        const references = signatureValue.reference;

        if (references) {
          for (const reference of references) {
            if (reference.transformMethod) {
              signatureType = "certified";
              break;
            }
          }
        }
      }

      result.name = this.name;
      result.reason = signatureValue.Reason.has() ? await signatureValue.Reason.get().decode() : null;
      result.location = signatureValue.Location.has() ? await signatureValue.Location.get().decode() : null;
      result.signingTime = signingTime;
      result.signatureType = signatureType;

      const formattingState = this.verifyFormatting(signatureValue);
      result.states.push(formattingState);

      const verificationResult = await signer.verify(content, checkDate);

      const modificationState = await this.verifyModification(verificationResult);
      result.states.push(modificationState);

      //Check signature for "signature-time-stamp" attribute
      const ltvState = await this.isLTV(signedData);
      const signingTimeState = await this.verifySigningTime(signedData, signatureValue, dateNow);
      result.states.push(signingTimeState);

      //#region Certificate chain status
      if (verificationResult.signerCertificate) {
        result.signerCertificate = verificationResult.signerCertificate;
        const chain = new cms.CertificateChain();
        chain.certificateHandler.parent = signedData.certificateHandler;

        // If PDF is LTV
        let chainResult: cms.CertificateChainResult | undefined;
        if (ltvState) {
          // Try Chain validation with Revocations
          // Get all revocations
          chainResult = await chain.build(verificationResult.signerCertificate, {
            checkDate: signingTime || checkDate,
            revocationMode: "offline",
          });

          // if chain status is no revocation then verify chain with online revocations
          if (chainResult.resultCode === cms.CertificateChainStatusCode.revocationNotFound) {
            result.states.push(this.makeLtvState(false, chainResult.resultMessage));
            chainResult = await chain.build(verificationResult.signerCertificate, { checkDate, revocationMode: "online" });
          } else {
            result.states.push(this.makeLtvState(true));
          }
        } else {
          // verify chain with online revocations
          result.states.push(this.makeLtvState(false, "PDF document doesn't have revocation items"));
          chainResult = await chain.build(verificationResult.signerCertificate, { checkDate, revocationMode: "online" });
        }

        switch (chainResult.result) {
          case true:
            result.states.push({
              type: "valid",
              text: "The signer's identity has been verified",
              code: "identity_verification",
              data: {
                state: "verified",
                ...chainResult,
              }
            });
            break;
          case false:
            result.verificationResult = false;
            result.reason = "The signer's identity has not been verified";
            result.states.push({
              type: "invalid",
              text: result.reason,
              code: "identity_verification",
              data: {
                state: "not_verified",
                ...chainResult,
              }
            });
            break;
          default:
            result.verificationResult = false;
            result.reason = "Signer's identity has not yet been verified";
            result.states.push({
              type: "info",
              text: result.reason,
              code: "identity_verification",
              data: {
                state: "not_verified",
                ...chainResult,
              }
            });
        }

        result.verificationResult = !!verificationResult.signatureVerified;
      }
      //#endregion

    } catch (error: any) {
      if (error instanceof Object) {
        if ("signerCertificate" in error)
          result.signerCertificate = error.signerCertificate;

        if ("message" in error) {
          result.message = error.message;

          if (result.message === "Validation of signer's certificate failed: No valid certificate paths found") {
            result.message = "The signer\x27s certificate was issued by a untrusted certificate authority";

            result.states.push({
              type: "invalid",
              text: "The signer\x27s certificate was issued by a untrusted certificate authority",
              code: "untrusted_cert_authority",
              data: {
                certificate: result.signerCertificate,
                certChain: result.certificatePath
              }
            });
          }
        }

        if ("type" in error) {
          result.states.push(error);
        }
      } else {
        result.states.push({
          type: "invalid",
          text: `Document is corrupted and can not be read ${error}`,
          code: "document_corrupted",
          data: {
            error
          }
        });

        result.message = error;
      }

      if (result.message) {
        result.states.push({
          type: "invalid",
          text: result.message,
          code: "error",
          data: {
            error: result.message,
            stack: error.stack,
          }
        });
      }

      if ((error instanceof Object) === false)
        return result;

      if ("signatureVerified" in error) {
        switch (error.signatureVerified) {
          case true:
            result.states.push({
              type: "valid",
              text: "The document has not been modified since it was signed",
              code: "document_modification",
              data: {
                state: "not_modified"
              }
            });
            break;
          case false:
            result.states.push({
              type: "invalid",
              text: "The document has been modified since it was signed",
              code: "document_modification",
              data: {
                state: "modified"
              }
            });
            break;
          default:
            result.states.push({
              type: "invalid",
              text: "The integrity of the document is unknown",
              code: "document_modification",
              data: {
                state: "error"
              }
            });
        }
      }

      if ("signerCertificateVerified" in error) {
        switch (error.signerCertificateVerified) {
          case true:
            result.states.push({
              type: "valid",
              text: "The signer's identity has been verified",
              code: "identity_verification",
              data: {
                state: "verified"
              }
            });
            break;
          case false:
            result.states.push({
              type: "invalid",
              text: "The signer's identity has not been verified",
              code: "identity_verification",
              data: {
                state: "not_verified"
              }
            });
            break;
          default:
            result.states.push({
              type: "invalid",
              text: "Status of the signer's identity validation is unknown",
              code: "identity_verification",
              data: {
                state: "error"
              }
            });
        }
      }

    }

    return result;
  }

  protected async getAllLtvRevocations(signedData: cms.CMSSignedData): Promise<Array<cms.CRL | cms.OCSP>> {
    const revocations: Array<cms.CRL | cms.OCSP> = [];
    if (signedData.crls) {
      for (const crl of signedData.crls) {
        if (crl.type === "crl") {
          revocations.push(cms.CRL.fromSchema(crl.value));
        } else if (crl.type === "ocsp") {
          revocations.push(cms.OCSP.fromSchema(crl.value));
        }
      }
    }

    // Load revocation items form Adobe attribute
    for (const signer of signedData.signers) {
      for (const attr of signer.signedAttributes) {
        if (attr.type === cms.id_adbe_revocationInfoArchival) {
          const attrValue = attr.values[0];
          if (attrValue) {
            const adobeAttr = AsnConvert.parse(attrValue, cms.RevocationInfoArchival);
            if (adobeAttr.crl) {
              for (const crl of adobeAttr.crl) {
                revocations.push(cms.CRL.fromBER(crl));
              }
            }
            if (adobeAttr.ocsp) {
              for (const ocsp of adobeAttr.ocsp) {
                revocations.push(cms.OCSP.fromOCSPResponse(ocsp));
              }
            }
            // TODO support adobeAttr.otherRevInfo
          }
        }
      }

      const signatureThumbprint = await this.thumbprint();
      const vri = this.document.dss.findVri(signatureThumbprint);
      // CRL
      if (vri && vri.CRL.has()) {
        const crls = vri.CRL.get();
        for (const crl of crls) {
          if (crl instanceof core.PDFStream) {
            const stream = crl.decodeSync();
            revocations.push(cms.CRL.fromBER(stream));
          }
        }
      }

      // OCSP
      if (vri && vri.OCSP.has()) {
        const ocsps = vri.OCSP.get();
        for (const ocsp of ocsps) {
          if (ocsp instanceof core.PDFStream) {
            const stream = ocsp.decodeSync();
            revocations.push(cms.OCSP.fromOCSPResponse(stream));
          }
        }
      }
    }

    return revocations;
  }

  protected makeLtvState(state: true): LtvState;
  protected makeLtvState(state: false, reason: string): LtvState;
  protected makeLtvState(state: boolean, reason?: string): LtvState {
    if (state) {
      return {
        type: "info",
        text: "Signature is LTV enabled",
        code: "ltv",
        data: {
          state,
        }
      };
    } else {
      return {
        type: "info",
        text: "Signature is not LTV enabled",
        code: "ltv",
        data: {
          state,
          reason,
        }
      };
    }
  }

  protected async verifySigningTime(signedData: cms.CMSSignedData, signatureValue: core.SignatureDictionary, checkDate: Date): Promise<SigningTimeStates> {
    const timeStamp = await this.getTimeStamp(signedData);
    const signer = this.getSigner(signedData);

    if (timeStamp) {
      // Embedded timestamp

      timeStamp.certificateHandler.parent = signedData.certificateHandler;
      const tsaResult = await timeStamp.verify(signer.asn.signature.valueBlock.valueHex, checkDate);
      const state: EmbeddedSigningTimeState = {
        type: "valid",
        text: "The signature includes an embedded timestamp",
        code: "signing_time",
        data: {
          type: "embedded",
          date: timeStamp.info.genTime,
          signature: tsaResult,
          info: tsaResult.info,
        },
      };

      // Verify TSA signing certificate
      const tsaSigner = tsaResult.signers[0];
      if (tsaSigner && tsaSigner.signerCertificate) {
        state.data.signer = tsaSigner.signerCertificate;
      }

      if (tsaResult.signatureVerified && tsaSigner && tsaSigner.signerCertificate) {
        const tsaCertChain = new cms.CertificateChain();
        tsaCertChain.certificateHandler.parent = timeStamp.certificateHandler;
        state.data.signer = tsaSigner.signerCertificate;
        state.data.chain = await tsaCertChain.build(tsaSigner.signerCertificate, { checkDate, revocationMode: "online" });
      }

      if (tsaResult.signatureVerified && state.data.chain && state.data.chain.resultCode === cms.CertificateChainStatusCode.badDate) {
        state.text += " but it is expired";
      } else if (!tsaResult.signatureVerified || !state.data.chain || !state.data.chain.result) {
        state.type = "invalid";
        state.text += " but it is invalid";
      }

      return state;
    } else if (signatureValue.signingTime) {
      // Local time
      const state: LocalSigningTimeState = {
        type: "info",
        text: "Signing time is from the clock on the signer's computer",
        code: "signing_time",
        data: {
          type: "local",
          date: signatureValue.signingTime.getDate(),
        }
      };

      return state;
    }

    // Time is not available
    const status: EmptySigningTimeState = {
      type: "info",
      text: "Signing time is not available",
      code: "signing_time",
      data: {
        type: "empty",
      }
    };

    return status;
  }

  protected getSignedData(signatureValue: core.SignatureDictionary): cms.CMSSignedData {
    const signedData = cms.CMSSignedData.fromBER(signatureValue.Contents.data);
    signedData.certificateHandler.parent = this.document.certificateHandler;

    return signedData;
  }

  protected getSigner(signedData: cms.CMSSignedData): cms.CMSSignerInfo {
    if (signedData.signers.length !== 1) {
      throw new Error("Cannot get SignerInfo from SignedData. Incorrect amount of signers, must be one.");
    }
    const signer = signedData.signers[0];

    return signer;
  }

  protected async getTimeStamp(signedData: cms.CMSSignedData): Promise<cms.TimeStampToken | null> {
    const signer = signedData.signers[0];
    const tsa = signer.unsignedAttributes.find(o => o instanceof cms.TimeStampTokenAttribute) as cms.TimeStampTokenAttribute | undefined;
    if (!tsa) {
      const signatureThumbprint = await this.thumbprint();
      const vri = this.document.dss.findVri(signatureThumbprint);
      if (vri && vri.TS) {
        const raw = await vri.TS.decode();

        return cms.TimeStampToken.fromBER(raw);
      }
    } else {
      return tsa.token;
    }

    return null;
  }

  protected async getSigningTime(timeStamp?: cms.TimeStampToken | null): Promise<Date | null> {
    // Looking for the signing time in Signature TimeStamp
    if (timeStamp) {
      return timeStamp.info.genTime;
    }

    // Looking for the signing time in SignatureValue dictionary
    if (this.target.V && this.target.V.signingTime) {
      return this.target.V.signingTime.getDate();
    }

    return null;
  }

  protected verifyFormatting(signatureValue: core.SignatureDictionary): FormattingState {
    try {
      if (this.document.target.wrongStructure) {
        return {
          type: "warn",
          code: "formatting",
          text: "Document structure doesn't match PDF specification.",
          data: {}
        };
      }
      const byteRange = signatureValue.ByteRange.get(true);
      const contentView = signatureValue.Contents.view;
      if (!signatureValue.documentUpdate) {
        throw new Error("Cannot get the document update object.");
      }
      const updateView = signatureValue.documentUpdate.view;
      const check1 = byteRange.get(0, core.PDFNumeric).value === 0;
      const check2 = byteRange.get(1, core.PDFNumeric).value === (contentView.byteOffset);
      const begin2 = byteRange.get(2, core.PDFNumeric).value;
      const check3 = begin2 === (contentView.byteOffset + contentView.length);
      const lastBlockLength = (updateView.byteOffset + updateView.length) - (contentView.byteOffset + contentView.length);
      const byteRangeLastBlockLength = byteRange.get(3, core.PDFNumeric).value;
      let check4 = false;
      if (byteRangeLastBlockLength === lastBlockLength) {
        check4 = true;
      } else if (byteRangeLastBlockLength > lastBlockLength) {
        const documentView = signatureValue.documentUpdate.document.view;
        const view = documentView.slice(begin2 + lastBlockLength, begin2 + byteRangeLastBlockLength);
        const reader = new core.ViewReader(view);
        const spaces = reader.read((octet) => !core.CharSet.whiteSpaceChars.includes(octet));
        check4 = spaces.length === view.length;
      }
      if (!(check1 && check2 && check3 && check4)) {
        throw new Error("The range of bytes points to an incorrect data.");
      }
    } catch (e) {
      const state: FormattingState = {
        type: "invalid",
        code: "formatting",
        text: "There are errors in formatting",
        data: {
          error: e instanceof Error
            ? e
            : new Error("Unknown error"),
        }
      };

      return state;
    }

    const state: FormattingState = {
      type: "valid",
      code: "formatting",
      text: "There are not errors in formatting",
      data: {}
    };

    return state;
  }

  protected async verifyModification(verificationResult: cms.CMSSignerInfoVerifyResult): Promise<DocumentModificationState> {
    switch (verificationResult.signatureVerified) {
      case true:
        return {
          type: "valid",
          text: "The document has not been modified since it was signed",
          code: "document_modification",
          data: {
            state: "not_modified"
          }
        };
      case false:
        return {
          type: "invalid",
          text: "The document has been modified since it was signed",
          code: "document_modification",
          data: {
            state: "modified"
          }
        };
      default:
        {
          let text = "There are errors in formatting or information contained in this signature";
          if (verificationResult.message) {
            text = verificationResult.message;
          }

          return {
            type: "invalid",
            text,
            code: "document_modification",
            data: {
              state: "error"
            }
          };
        }
    }
  }

  protected async isLTV(signedData: cms.CMSSignedData): Promise<boolean> {
    // DSS
    const signatureThumbprint = await this.thumbprint();
    const vri = this.document.dss.findVri(signatureThumbprint);
    if (vri) {
      if ((vri.CRL.has() && vri.CRL.get().length)
        || (vri.OCSP.has() && vri.OCSP.get().length)) {
        return true;
      }
    }

    // CAdES
    if (signedData.crls.length) {
      return true;
    }

    for (const signer of signedData.signers) {
      for (const attr of signer.signedAttributes) {
        if (attr.type === cms.id_adbe_revocationInfoArchival) {
          const attrValue = attr.values[0];
          if (attrValue) {
            const adobeAttr = AsnConvert.parse(attrValue, cms.RevocationInfoArchival);
            if ((adobeAttr.crl && adobeAttr.crl.length)
              || (adobeAttr.ocsp && adobeAttr.ocsp.length)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }


}

export class InputImageBox extends FormComponent {

  private _image?: Image | null;

  public get image(): Image | null {
    if (this._image) {
      return this._image;
    }

    if (this.target.AP.has()) {
      const dict = this.target.AP.get().N;
      if (dict instanceof core.PDFDictionary) {
        const form = dict.to(core.FormDictionary);
        if (form.Resources.has()) {
          const resources = form.Resources.get();
          if (resources.XObject && resources.XObject.items.size) {
            const firstKey = [...resources.XObject.items.keys()][0];
            const firstEntry = resources.XObject.get(firstKey);
            if (firstEntry instanceof core.PDFDictionary
              && firstEntry.has("Subtype")
              && firstEntry.get("Subtype", core.PDFName).text === "Image") {
              return new Image(firstEntry.to(core.ImageDictionary as any), this.document);
            }
          }
        }
      }
    }

    return null;
  }

  public set image(value: Image | null) {
    if (this._image === value) {
      return;
    }

    const doc = this.document.target;
    const update = doc.update;

    // Create resource
    const form = core.FormDictionary.create(update);
    if (!value) {
      // set empty form
      // form.bBox.urX = this.width;
      // form.bBox.urY = this.height;

      // const width = 2 / 2;
      // const content = new core.PDFContent();
      // const graphics = content.createGraphics();
      // graphics
      //   .begin()
      //   .setColor([0, 0.073, 0.790])
      //   .drawRectangle(0, this.height, this.width, this.height)
      //   .fill()
      //   .setColor([0.165, 0.521, 1])
      //   .drawRectangle(width, this.height - width, this.width - width * 2, this.height - width * 2)
      //   .stroke()
      //   .end();
      // form.stream = content.toUint8Array();

      this.target.MK.get().delete("I");
      this.target.AP.get().N = form.makeIndirect();
    } else {
      form.bBox.urX = value.width;
      form.bBox.urY = value.height;
      const resources = new ResourceManager(form.Resources.get(), this.document);
      const resource = resources.set(value.target);

      // Draw image
      const content = new core.PDFContent();
      content
        .graphicsBegin()
        .concatMatrix(value.width, 0, 0, value.height, 0, 0)
        .drawXObject(resource.name)
        .graphicsEnd();
      form.stream = content.toUint8Array();

      this.target.MK.get().I = form.makeIndirect();
      this.target.AP.get().N = form;
    }

    this._image = value;
  }

}

export class FormComponentFactory {

  /**
   * Returns parent Filed dictionary of the Widget dictionary
   * @param widget
   */
  public static getField(widget: core.WidgetDictionary): core.PDFField {
    if (widget.Parent) {
      return new core.PDFField(widget.Parent);
    }

    return new core.PDFField(widget);
  }

  protected static createFromWidget(widget: core.WidgetDictionary, doc: PDFDocument): IComponent {
    const filed = this.getField(widget);
    if (filed.ft === "Tx") {
      return new TextEditor(widget, doc);
    } else if (filed.ft === "Btn") {
      if (filed.ff & core.ButtonFlags.radio) {
        return new RadioButton(widget, doc);
      } else if (filed.ff & core.ButtonFlags.pushbutton) {
        if (widget.A.has()) {
          const a = widget.A.get();
          if (a.s === "JavaScript" &&
            a.has("JS") && a.get("JS", core.PDFTextString).text.includes("buttonImportIcon")) {
            return new InputImageBox(widget, doc);
          }
        }
      }

      return new CheckBox(widget, doc);
    } else if (filed.ft === "Sig") {
      return new SignatureBox(widget, doc);
    }

    return new FormComponent(widget, doc);
  }

  protected static createFromField(field: core.PDFField, doc: PDFDocument): IComponent {
    if (field.has("Subtype")) {
      // Simple widget filed dictionary
      const subtype = field.get("Subtype", core.PDFName);
      if (subtype.text === core.WidgetDictionary.SUBTYPE) {
        return this.createFromWidget(field.to(core.WidgetDictionary), doc);
      }
    } else if (field.Kids.has()) {
      // Filed dictionary has got kids
      if (field.ft === "Btn") {
        if (field.ff & core.ButtonFlags.radio) {
          return new RadioButtonGroup(field.to(core.ButtonDictionary), doc);
        }
      } else if (field.ft === "Sig") {
        return new SignatureBoxGroup(field.to(core.SignatureFiled), doc);
      }
    }

    throw new TypeError("Unsupported type of interactive form object");
  }

  public static create(dict: core.PDFDictionary, doc: PDFDocument): IComponent {
    if (dict.has("FT")) {
      return this.createFromField(new core.PDFField(dict), doc);
    } else if (dict.has("Subtype")) {
      return this.createFromWidget(new core.WidgetDictionary(dict), doc);
    }

    throw new TypeError("Cannot create PDF Form Component. Wrong type of PDF Dictionary");
  }
}
