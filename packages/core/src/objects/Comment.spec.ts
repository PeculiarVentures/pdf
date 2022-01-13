import * as assert from "assert";
import { PDFComment } from "./Comment";

context("Comment", () => {

  it("fromPDF", () => {
    const comment = PDFComment.fromPDF("% comment (/%) blah blah blah\n123");
    assert.strictEqual(comment.text, "comment (/%) blah blah blah");
  });

});
