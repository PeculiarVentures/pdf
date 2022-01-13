import * as assert from "assert";

import { PDFName } from "./Name";

context("Name", () => {

  context("fromPDF", () => {

    [
      [
        "/Name1",
        "Name1",
      ],
      [
        "/ASomewhatLongerName",
        "ASomewhatLongerName",
      ],
      [
        "/A;Name_With-Various***Characters?",
        "A;Name_With-Various***Characters?",
      ],
      [
        "/1.2",
        "1.2",
      ],
      [
        "/$$",
        "$$",
      ],
      [
        "/$$",
        "$$",
      ],
      [
        "/@pattern",
        "@pattern",
      ],
      [
        "/.notdef",
        ".notdef",
      ],
      [
        "/Lime#20Green",
        "Lime Green",
      ],
      [
        "/paired#28#29parentheses",
        "paired()parentheses",
      ],
      [
        "/The_Key_of_F#23_Minor",
        "The_Key_of_F#_Minor",
      ],
      [
        "/A#42",
        "AB",
      ],
      [
        "/",
        "",
      ]
    ].forEach(([i, v]) => {
      it(JSON.stringify(i), () => {
        const item = PDFName.fromPDF(i);
        assert.strictEqual(item.text, v);
      });
    });

    it("/Name]", () => {
      const string = "/Name]";
      const item = PDFName.fromPDF(string);
      assert.strictEqual(item.text, "Name");
    });

    context("toPDF", () => {
      [
        [
          "",
          "/",
        ],
        [
          "Lime Green",
          "/Lime#20Green",
        ],
      ].forEach(([v, o]) => {
        it(JSON.stringify(v), () => {
          const item = new PDFName(v);
          const view = item.toPDF();

          assert.strictEqual(Buffer.from(view).toString(), o);
        });
      });
    });

  });

});
