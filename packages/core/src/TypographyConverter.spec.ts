import * as assert from "assert";
import { TypographyConverter } from "./TypographyConverter";

context("TypographyConverter", () => {

  it("in to pt", () => {
    const pt = TypographyConverter.toPoint("8.2677in");
    assert.strictEqual(pt, 595.27);
  });

  it("mm to pt", () => {
    const pt = TypographyConverter.toPoint("210mm");
    assert.strictEqual(pt, 595.28);
  });

  it("cm to pt", () => {
    const pt = TypographyConverter.toPoint("29.7cm");
    assert.strictEqual(pt, 841.89);
  });

});
