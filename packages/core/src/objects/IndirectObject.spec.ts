import * as assert from "assert";
import { PDFDictionary } from "./Dictionary";
import { PDFIndirectObject } from "./IndirectObject";
import { PDFStream } from "./Stream";
import { PDFObject } from "./Object";

context("IndirectReference", () => {

  context("fromPDF", () => {

    const vector: [string, typeof PDFObject][] = [
      // [
      //   "12 0 obj\n  << /Length 7 >> \nendobj",
      //   PDFDictionary,
      // ],
      // [
      //   "12 0 obj\n % comment before value\n 7 % comment after value \nendobj",
      //   PDFNumeric,
      // ],
      [
        "5961 0 obj<</Length 7/Filter/FlateDecode/L 91931/O 91893/S 89312/V 91909>>stream\n�������\nendstream\nendobj",
        PDFStream,
      ],
      [
        "6259 0 obj<</Parent 6218 0 R/Next 6221 0 R/Prev 6220 0 R/Title(c��>�t�\"Z��T�Q�\\()/A 6261 0 R>>\nendobj",
        PDFDictionary,
      ],
      [
        "789 0 obj\n<< /Length 790 0 R >>\nstream\nq\n595.08 0 0 792.00 0 0 cm\n/Im1 Do\nQ\nendstream\nendobj",
        PDFStream,
      ],
    ];

    vector.forEach(([i, t]) => {
      it(JSON.stringify(i), () => {
        const obj = PDFIndirectObject.fromPDF(i);
        assert.strictEqual(obj.value instanceof t, true, `IndirectObject::value is '${obj.value.constructor.name}', but must be '${t.name}'`);
      });
    });
  });


});
