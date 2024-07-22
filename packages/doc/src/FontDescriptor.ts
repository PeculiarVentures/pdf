import * as core from "@peculiarventures/pdf-core";
import { WrapObject } from "./WrapObject";

function flag(f: core.FontDescriptorFlags): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Object.defineProperty(target, propertyKey, {
      get: function (this: FontDescriptorComponent): boolean {
        return !!(this.target.flags & f);
      },
      set: function (this: FontDescriptorComponent, v: boolean): void {
        if (v) {
          this.target.flags |= f;
        } else {
          this.target.flags ^= f;
        }
      }
    });
  };
}

export class FontDescriptorComponent extends WrapObject<core.FontDescriptorDictionary> {
  /**
   * All glyphs have the same width (as opposed to proportional or variablepitch fonts, which have different widths).
   */
  @flag(core.FontDescriptorFlags.fixedPitch)
  public fixedPitch!: boolean;
  /**
   * Glyphs have serifs, which are short strokes drawn at an angle on the top
   * and bottom of glyph stems. (Sans serif fonts do not have serifs.)
   */
  @flag(core.FontDescriptorFlags.serif)
  public serif!: boolean;
  /**
   * Font contains glyphs outside the Standard Latin character set. This flag
   * and the Nonsymbolic flag shall not both be set or both be clear.
   */
  @flag(core.FontDescriptorFlags.symbolic)
  public symbolic!: boolean;
  /**
   * Glyphs resemble cursive handwriting.
   */
  @flag(core.FontDescriptorFlags.script)
  public script!: boolean;
  /**
   * Font uses the Standard Latin character set or a subset of it. This flag and
   * the Symbolic flag shall not both be set or both be clear.
   */
  @flag(core.FontDescriptorFlags.nonsymbolic)
  public nonsymbolic!: boolean;
  /**
   * Glyphs have dominant vertical strokes that are slanted.
   */
  @flag(core.FontDescriptorFlags.italic)
  public italic!: boolean;
  /**
   * AllCap Font contains no lowercase letters; typically used for display purposes,
   * such as for titles or headlines.
   */
  @flag(core.FontDescriptorFlags.allCap)
  public allCap!: boolean;
  /**
   * Font contains both uppercase and lowercase letters.The uppercase
   * letters are similar to those in the regular version of the same typeface
   * family.The glyphs for the lowercase letters have the same shapes as the
   * corresponding uppercase letters, but they are sized and their proportions
   * adjusted so that they have the same size and stroke weight as lowercase
   * glyphs in the same typeface family.
   */
  @flag(core.FontDescriptorFlags.smallCap)
  public smallCap!: boolean;
  /**
   * See description after Note 1 in this subclause
   */
  @flag(core.FontDescriptorFlags.forceBold)
  public forceBold!: boolean;
}
