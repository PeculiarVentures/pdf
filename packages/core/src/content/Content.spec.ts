import *  as assert from "assert";
import { PDFName, PDFNumeric } from "../objects";
import { PDFContent } from "./Content";

context("Content", () => {

  it("simple text", () => {
    const text = "BT\n/F13 12 Tf\n288 720 Td\n(Hello from @PeculiarVentures/pdf module) Tj\nET";

    const content = PDFContent.fromString(text);

    assert.strictEqual(content.operators.length, 5);
  });

  it("single line", () => {
    const text = "q q 0.833333 0 0 0.833333 6 0 cm 1 0 0 1 10 10 cm BT /F1 10 Tf 10 TL 0 30 Td (Signed by Alice) Tj T* (Timestamp: 2021-08-27 19:50:12 UTC) Tj T* (Digest: sha512) Tj T* (Curve: ed25519 (EdDSA)) Tj T* ET Q 3 w 0 0 200 50 re S Q";

    const content = PDFContent.fromString(text);

    assert.strictEqual(content.operators.length, 22);
  });

  it("create", () => {
    const content = PDFContent.create(
      ["BT"],
      ["Tf", new PDFName("F13"), new PDFNumeric(12)],
      ["ET"],
    );

    const multiLine = content.toString();
    assert.strictEqual(multiLine, "BT\n/F13 12 Tf\nET");

    const singleLine = content.toString(true);
    assert.strictEqual(singleLine, "BT /F13 12 Tf ET");
  });

  context("scoping", () => {
    it("create", () => {
      const content = new PDFContent();

      const graphics = content.graphics();

      graphics.graphics()
        .setColor(0)
        .drawRectangle(0, 0, 10, 20)
        .fill();

      graphics.graphics()
        .setColor(0, true)
        .drawRectangle(0, 0, 10, 20)
        .stroke();

      const singleLine = content.toString(true);
      assert.strictEqual(singleLine, "q q 0 g 0 -20 10 20 re f Q q 0 G 0 -20 10 20 re S Q Q");
    });
  });

});
