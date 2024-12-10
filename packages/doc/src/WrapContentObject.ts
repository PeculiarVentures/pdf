import * as core from "@peculiarventures/pdf-core";
import { Convert } from "pvtsutils";

import { Image } from "./Image";
import * as font from "./Font";
import { ResourceManager } from "./ResourceManager";
import { WrapObject } from "./WrapObject";

export enum OpacityModes {
  all,
  stroke,
  fill,
}

export abstract class WrapContentObject<T extends core.PDFDictionary> extends WrapObject<T> {

  protected abstract readonly content: core.PDFContent;

  public abstract readonly resources: ResourceManager;
  public abstract readonly width: number;
  public abstract readonly height: number;
  public abstract readonly left: number;
  public abstract readonly bottom: number;

  public graphics(): Graphics {
    return new Graphics(this.content.graphics(), this);
  }

  public text(variable = false): Text {
    return new Text(this.content.text(variable), this);
  }

  public clear(): this {
    this.content.clear();

    return this;
  }

}

export class WrapContentChild {

  constructor(
    public content: core.PDFContent,
    protected parent: WrapContentObject<core.PDFDictionary>,
  ) { }

  protected getY(y: core.TypographySize, original = false): number {
    const res = original
      ? core.TypographyConverter.toPoint(y)
      : this.parent.height + this.parent.bottom - core.TypographyConverter.toPoint(y);

    return res;
  }

  protected getX(x: core.TypographySize, original = false): number {
    return original
      ? core.TypographyConverter.toPoint(x)
      : this.parent.left + core.TypographyConverter.toPoint(x);
  }

}

const NAME_PREFIX_COLOR_SPEC = "CS";

export class Graphics extends WrapContentChild {

  protected modify(): void {
    this.parent.target.modify();
  }

  public text(variable = false): Text {
    this.modify();

    return new Text(this.content.text(variable), this.parent);
  }

  public graphics(): Graphics {
    this.modify();

    return new Graphics(this.content.graphics(), this.parent);
  }

  public state(state: core.ExtGStateDictionary): this {
    this.modify();

    const res = this.parent.resources.set(state);

    this.content.graphicsState(res.name);

    return this;
  }

  public opacity(value: number, mode = OpacityModes.all): this {
    this.modify();

    const extGState = core.ExtGStateDictionary.create(this.parent.document.target.update);
    if (mode === OpacityModes.all || mode === OpacityModes.fill) {
      extGState.ca = value;
    }
    if (mode === OpacityModes.all || mode === OpacityModes.stroke) {
      extGState.CA = value;
    }
    const res = this.parent.resources.set(extGState);

    this.content.graphicsState(res.name);

    return this;
  }

  public strokeColor(color: core.Colors): this {
    this.modify();

    this.content.setColor(color, true);

    return this;
  }

  public fillColor(color: core.Colors): this {
    this.modify();

    this.content.setColor(color, false);

    return this;
  }

  public fill(): this {
    this.modify();

    this.content.fill();

    return this;
  }

  public stroke(close?: boolean): this {
    this.modify();

    this.content.stroke(close);

    return this;
  }

  public clip(): this {
    this.modify();

    this.content.clip();

    return this;
  }

  public rotate(angle: number): this {
    this.modify();

    this.content.rotate(angle);

    return this;
  }

  public scale(width: number, height: number): this {
    this.modify();

    this.content.scale(width, height);

    return this;
  }

  public translate(left: core.TypographySize, top: core.TypographySize, original = false): this {
    left = this.getX(left, original);
    top = this.getY(top, original);
    this.modify();

    this.content.translate(left, top);

    return this;
  }

  public transform(transforms: core.Transformations): this {
    this.modify();

    this.content.transform(transforms);

    return this;
  }

  public lineWidth(width: core.TypographySize): this {
    this.modify();

    this.content.setLineWidth(width);

    return this;
  }

  public drawObject(obj: WrapObject<core.XObjectDictionary>): this {
    this.modify();

    const res = this.parent.resources.set(obj.target);

    this.content.drawXObject(res.name);

    return this;
  }

  public drawImage(image: Image, width?: core.TypographySize, height?: core.TypographySize): this {
    width = core.TypographyConverter.toPoint(width || image.width);
    height = core.TypographyConverter.toPoint(height || image.height);
    const form = FormObject.create(this.parent.document, width, height);

    if (image.target.ColorSpace instanceof core.PDFArray) {
      this.parent.resources.target.set("ColorSpace", this.parent.document.target.createDictionary(
        [this.parent.resources.createNamePrefix(NAME_PREFIX_COLOR_SPEC), image.target.ColorSpace]
      ));
    }

    this.modify();
    form.graphics()
      .translate(0, height)
      .scale(width, height)
      .drawObject(image);

    return this.drawObject(form);
  }

  public rect(width: core.TypographySize, height: core.TypographySize, original?: boolean): this;
  public rect(left: core.TypographySize, top: core.TypographySize, width: core.TypographySize, height: core.TypographySize, original?: boolean): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public rect(...args: any[]): this {
    let x, y, width, height: number;
    if (args.length === 2 || args.length === 3) {
      const original = args[2] ?? false;
      width = core.TypographyConverter.toPoint(args[0]);
      height = core.TypographyConverter.toPoint(args[1]);
      x = 0;
      y = this.getY(0, original) - (original ? 0 : height);
    } else if (args.length === 4 || args.length === 5) {
      const original = args[4] ?? false;
      width = core.TypographyConverter.toPoint(args[2]);
      height = core.TypographyConverter.toPoint(args[3]);
      x = this.getX(args[0], original);
      y = this.getY(args[1], original) - (original ? 0 : height);
    } else {
      throw new Error("Incorrect number of arguments");
    }
    this.modify();
    this.content
      .drawRectangle(x, y, width, height);

    return this;
  }

  public circle(x: core.TypographySize, y: core.TypographySize, r: core.TypographySize, original = false): this {
    x = this.getX(x, original);
    y = this.getY(y, original);

    this.modify();
    this.content.drawCircle(x, y, r);

    return this;
  }

  public pathTo(left: core.TypographySize, top: core.TypographySize, original = false): this {
    left = this.getX(left, original);
    top = this.getY(top, original);

    this.modify();
    this.content.moveTo(left, top);

    return this;
  }

  public pathLine(left: core.TypographySize, top: core.TypographySize, original = false): this {
    left = this.getX(left, original);
    top = this.getY(top, original);

    this.modify();
    this.content.lineTo(left, top);

    return this;
  }

  public pathEnd(): this {
    this.content.pathEnd();

    return this;
  }

  public line(x1: core.TypographySize, y1: core.TypographySize, x2: core.TypographySize, y2: core.TypographySize, original = false): this {
    return this
      .pathTo(x1, y1, original)
      .pathLine(x2, y2, original);
  }

  public drawText(textBlock: font.TextCalculateParams | font.TextBlocks, left: core.TypographySize = 0, top: core.TypographySize = 0): this {
    if (!(textBlock instanceof font.TextBlocks)) {
      return this.drawText(font.TextSizeCounter.calculate(textBlock), left, top);
    }

    left = this.getX(left);
    top = this.getY(top);

    if (textBlock.rows.length) {
      // Fill background
      // for (const row of textBlock.rows) {
      //   this.graphics()
      //     .fillColor(0.7)
      //     .rect(left + row.left, top - textBlock.top - row.top - row.height, row.width - row.space, row.height, true)
      //     .fill();
      // }

      // Set text position for the first line
      const firstRow = textBlock.rows[0];
      const textScope = this.text()
        .move(left + firstRow.left, top - firstRow.ascent, true);
      let lastRow: font.TextRow | null = null;
      let lastItem: font.TextRowItem | null = null;
      let lastLeading = 0;

      for (const row of textBlock.rows) {
        if (lastRow) {
          if (lastLeading !== row.leading) {
            lastLeading = row.leading;
            textScope.leading(row.leading);
          }

          textScope
            .nextLine()
            .move(row.left - lastRow.left, 0, true);
        }
        lastRow = row;

        for (const item of row.items) {
          if (!(lastItem && lastItem.original === item.original)) {
            textScope
              .color(item.original.style.color)
              .font(item.original.font, item.original.style.size);
          }
          textScope.show(item.text);

          if (item.original.link) {
            // TODO implement Link adding for the Page target
          }

          lastItem = item;
        }
      }
    }

    return this;
  }
}

export class Text extends WrapContentChild {

  #font?: font.FontComponent;
  #fontSize?: number;

  public graphics(): Graphics {
    return new Graphics(this.content.graphics(), this.parent);
  }

  public font(font: font.FontComponent, size: core.TypographySize): this {
    this.#font = font;
    this.#fontSize = core.TypographyConverter.toPoint(size);

    const res = this.parent.resources.set(this.#font.target);
    this.content.textFont(res.name, this.#fontSize);

    return this;
  }

  private get lastFont(): font.FontComponent {
    if (!this.#font) {
      const defaultFont = this.#font = font.FontComponent.addFont(this.parent.document);
      this.font(defaultFont, this.lastFontSize);
    }

    return this.#font;
  }

  private get lastFontSize(): number {
    if (!this.#fontSize) {
      this.#fontSize = font.FontComponent.DEFAULT_SIZE;
    }

    return this.#fontSize;
  }

  public show(text: string): this {
    const fnt = this.lastFont;

    if (fnt.target.subtype === "Type0" && fnt.target.has("ToUnicode")) {
      // encoded text
      let buffer = "";

      for (const char of text) {
        const glyph = fnt.fontInfo.findGlyph(char.charCodeAt(0));
        buffer += (glyph ? glyph.index : 0).toString(16).padStart(4, "0");
      }

      this.content.textShow(Convert.FromHex(buffer));
    } else {
      const maxUnicode = core.PDFLiteralString.getMaxUnicode(text);
      if (maxUnicode > 0xFF) {
        this.content.textShow(Convert.FromString(text));
      } else {
        this.content.textShow(text);
      }
    }


    return this;
  }

  public move(x: core.TypographySize, y: core.TypographySize, original = false): this {
    x = this.getX(x, original);
    y = this.getY(y, original);

    if (!original) {
      const fontSize = this.lastFontSize;
      const font = this.lastFont;
      const ascent = font.fontInfo.ascent / font.fontInfo.unitsPerEm * fontSize;

      y -= ascent;
    }

    this.content.textMove(x, y);

    return this;
  }

  public leading(leading: core.TypographySize): this {
    this.content.textLeading(leading);

    return this;
  }

  public nextLine(): this {
    this.content.textNextLine();

    return this;
  }

  public color(color: core.Colors): this {
    this.content.setColor(color);

    return this;
  }

}

import { FormObject } from "./FormObject";
