import * as core from "@peculiarventures/pdf-core";
import { type PDFDocument } from "../Document";
import { WrapObject } from "../WrapObject";
import { annotFlag, fieldFlag } from "./decorators";
import { IComponent } from "./IComponent";

export class FormComponent extends WrapObject<core.WidgetDictionary> implements IComponent {

  public static readonly COLOR_OPERATORS = ["g", "rg", "k"];

  constructor(target: core.WidgetDictionary, document: PDFDocument) {
    super(target, document);


  }

  /**
   * Get the name of the component
   */
  public get name(): string {
    const field = this.getField();

    return field.getFullName();
  }

  public get left(): number {
    return this.target.rect.llX;
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

      return page.MediaBox.urY - this.target.rect.urY;
    }

    return this.target.rect.urY;
  }

  public set top(v: core.TypographySize) {
    let vPt = core.TypographyConverter.toPoint(v);
    const height = this.height;

    vPt = (this.target.p)
      ? this.target.p.to(core.PageObjectDictionary).MediaBox.urY - vPt
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
    const rect = this.target.rect.toArray();
    const y1 = Math.min(rect[1], rect[3]);
    const y2 = Math.max(rect[1], rect[3]);

    const height = Math.abs(y2 - y1);

    return height;
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

  /**
   * Returns parent Filed dictionary of the Widget dictionary
   */
  protected getField<T extends core.PDFField>(type: new () => T): T;
  protected getField(): core.PDFField;
  protected getField(type?: new () => core.PDFField): core.PDFField {
    const fieldDict = this.target.has("T") ? this.target : this.target.Parent;
    if (!fieldDict) {
      throw new Error("Field dictionary not found");
    }
    const field = new core.PDFField(fieldDict);

    return type ? field.to(type) : field;
  }

  public delete(): void {
    this.deleteFromPage();
    this.deleteFromField();
  }

  /**
   * Delete annotation from page
   */
  private deleteFromPage() {
    const page = this.target.p;
    if (page && page.annots) {
      const index = page.annots.indexOf(this.target);
      if (index !== -1) {
        page.annots.splice(index, 1);
      }
    }
  }

  private deleteFromField() {
    const field = this.getField();
    if (!field.Kids.has()) {
      return;
    }

    const kids = field.Kids.get();
    const index = kids.indexOf(this.target);
    if (index !== -1) {
      kids.splice(index, 1);
    }
  }

  public paint(): void {
    //empty
  }
}
