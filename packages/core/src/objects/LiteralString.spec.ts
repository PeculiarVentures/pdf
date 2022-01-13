import * as assert from "assert";

import { ParsingError } from "../ParsingError";
import { PDFLiteralString } from "./LiteralString";

context("LiteralString", () => {

  context("fromPDF", () => {

    it("Block without opening tag", () => {
        const parsedItem = new PDFLiteralString();
        assert.throws(() => parsedItem.fromPDF("Block without opening tag)"), ParsingError);
    });

    it("Block without closing tag", () => {

        const parsedItem = new PDFLiteralString();
        assert.throws(() => parsedItem.fromPDF("(Block without closing tag"), ParsingError);
    });

  });

  context("to/from PDF", () => {
    [
      [
        "(This is a string)",
        "This is a string",
      ],
      [
        "(Strings may contain newlines\nand such.)",
        "Strings may contain newlines\nand such.",
      ],
      [
        "(Strings may contain balanced parentheses ( ) and special characters (*!&}^% and so on).)",
        "Strings may contain balanced parentheses ( ) and special characters (*!&}^% and so on).",
      ],
      [
        "(String with escaped char at the end\\\\)",
        "String with escaped char at the end\\",
      ],
      [
        "(String with escaped \\) char)",
        "String with escaped ) char",
      ],
      [
        "()",
        "",
      ],
      [
        "(Sting with newline\\n)",
        "Sting with newline\n",
      ],
      [
        "(This string contains \\\nat the \\\r\nend-of-line)",
        "This string contains at the end-of-line",
      ],
      [
        "(This string contains \\245two octal characters\\307)",
        "This string contains ¥two octal charactersÇ",
      ],
      [
        "(\\0053)",
        "\x053",
      ],
      [
        "(\\053)",
        "+",
      ],
      [
        "(\\53)",
        "+",
      ],
      [
        "(Escaped parenthesis \\()",
        "Escaped parenthesis (",
      ],
    ].forEach(([p, v]) => {
      it(JSON.stringify(p), () => {
        const parsedItem = PDFLiteralString.fromPDF(p);

        assert.strictEqual(parsedItem.text, v);
      });
    });

  });

  context("toPDF", () => {

    [
      [
        // empty string
        "", 
        "()",
      ],
      [
        // escape special chars
        "All escaped chars \n\r\t\b\f()\\+", 
        "(All escaped chars \\n\\r\\t\\b\\f\\(\\)\\\\+)",
      ],
      [
        // not utf-8
        "\x43\xaf\xc9\x7f\xef\xff\xe6\xa8\xcb\x5c\xaf\xd0",
        "(\x43\xaf\xc9\x7f\xef\xff\xe6\xa8\xcb\x5c\x5c\xaf\xd0)",
      ],
    ].forEach(([v, o]) => {
      it(JSON.stringify(v), () => {
        const view = new PDFLiteralString(v).toPDF();
  
        assert.strictEqual(Buffer.from(view).toString(), o);
      });
    });

  });

});
