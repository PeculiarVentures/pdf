import { DefaultFonts } from "./DefaultFonts";
import { FontFactory } from "./FontFactory";

it("test", () => {
  const font = FontFactory.create(DefaultFonts.ZapfDingbats);
  console.log(font);
  console.log(font.glyphs);
});
