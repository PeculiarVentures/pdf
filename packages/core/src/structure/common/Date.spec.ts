import * as assert from "assert";

import { PDFDate } from "./Date";

context("Stream", () => {
  it("+", () => {
    const initDate = new Date("2021-10-04T01:02:03.000+0000");
    const date = new PDFDate(initDate);

    const dateString = date.toString();
    assert.strictEqual(dateString, "(D:20211004040203+03'00')");

    const date2 = PDFDate.fromPDF(dateString).getDate();
    assert.strictEqual(date2.getTime(), initDate.getTime());
  });

  it("-", () => {
    const date = PDFDate.fromPDF("(D:20211004040203-03'00')").getDate();
    assert.strictEqual(date.getTime(), 1633330923000);
  });

  it("Z", () => {
    const date = PDFDate.fromPDF("(D:20211004040203Z)").getDate();
    assert.strictEqual(date.getTime(), 1633320123000);
  });
  
});
