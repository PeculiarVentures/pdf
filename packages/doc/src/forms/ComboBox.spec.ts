import {
  PdfRenderingHelper,
  xrefTableOptions
} from "@peculiarventures/pdf-tests";
import { ComboBox, PDFDocument } from "@peculiarventures/pdf-doc";
import { DefaultFonts } from "@peculiarventures/pdf-font";

describe("ComboBox", () => {
  let docRaw: ArrayBuffer;

  beforeAll(async () => {
    const doc = await PDFDocument.create(xrefTableOptions);
    const page = doc.pages.create();

    page.addComboBox({
      left: 10,
      top: 10,
      width: 140,
      height: 20,
      borderColor: [0, 0, 0],
      borderWidth: 1,
      name: "comboBox1",
      options: {
        item1: "Item 1",
        item2: "Item 2",
        item3: "Item 3"
      },
      selected: "item2"
    });

    docRaw = await doc.save();
  });

  it("draw", async () => {
    const pageHash = await PdfRenderingHelper.getPageHash(docRaw, 1);
    expect(pageHash).toBe(
      "3d89d848445a0e51f22e88729efd70bf0d4a32b5164bb33f89c46471110b7c1c"
    );
  });

  it("change value", async () => {
    const doc = await PDFDocument.load(docRaw);
    const comboBox = doc.getComponentByName("comboBox1", ComboBox);

    comboBox.selected = ["item3"];

    const pdf = await doc.save();
    const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

    expect(pageHash).toBe(
      "5e85c0c6af7a25c22941020e1619793ab5241ceb632bbdf9d899fd1e6bce2576"
    );
  });

  describe("style", () => {
    it("font", async () => {
      const doc = await PDFDocument.load(docRaw);
      const comboBox = doc.getComponentByName("comboBox1", ComboBox);

      const helveticaItalic = doc.addFont(DefaultFonts.HelveticaOblique);
      comboBox.textColor = [1, 0, 0];
      comboBox.font = helveticaItalic;
      comboBox.fontSize = 14;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      // NOTE: Acrobat Reader paints content depending on the object data, so it can be different. Chrome draws correct content.

      expect(pageHash).toBe(
        "436d78486d05aa72190a9c38dc50c0b5152ce3f691b7b7203c6ee20fafb941a9"
      );
    });

    describe("border", () => {
      it("no border", async () => {
        const doc = await PDFDocument.load(docRaw);
        const comboBox = doc.getComponentByName("comboBox1", ComboBox);

        comboBox.borderWidth = 0;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

        expect(pageHash).toBe(
          "ab5c1d04cc9fc8356ae481c98313e10fb3b12c4ced13a3f0ead0ce3920384a72"
        );
      });

      it("change border color and width", async () => {
        const doc = await PDFDocument.load(docRaw);
        const comboBox = doc.getComponentByName("comboBox1", ComboBox);

        comboBox.borderColor = [1, 0, 0];
        comboBox.borderWidth = 2;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

        expect(pageHash).toBe(
          "dfc473d1fd30ce6f2eddf8cc0ced87e8bbc2f1ee04e31886f1f5f2298a6a32fa"
        );
      });
    });

    it("background color", async () => {
      const doc = await PDFDocument.load(docRaw);
      const comboBox = doc.getComponentByName("comboBox1", ComboBox);

      comboBox.backgroundColor = [0, 0, 1];
      comboBox.textColor = [1, 1, 1];

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "cd6c095980b1cb8798e30d68887bbf79f19d2d538f00dbb6b7c6b60df98e7d50"
      );
    });
  });

  describe("transform", () => {
    it("position", async () => {
      const doc = await PDFDocument.load(docRaw);
      const comboBox = doc.getComponentByName("comboBox1", ComboBox);

      comboBox.left += 100;
      comboBox.top += 100;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "a447729efa22ef92102afac12fca8e9b0f2ab8e2b527eeb46c4f877676d4f53b"
      );
    });

    it("size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const comboBox = doc.getComponentByName("comboBox1", ComboBox);

      comboBox.width += 100;
      comboBox.height += 20;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "6eda94069ac586d521ed04d0126b09225e45b7bea1a55c02317a60339242a1cb"
      );
    });
  });

  describe("options", () => {
    it("add", async () => {
      const doc = await PDFDocument.load(docRaw);
      const comboBox = doc.getComponentByName("comboBox1", ComboBox);

      const selected = comboBox.selected;
      expect(selected).toEqual(["item2"]);

      comboBox.options = {
        ...comboBox.options,
        item4: "Item 4"
      };
      comboBox.selected = ["item4"];

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "118d6800dcfc221d6fd7b9c12076ed985643c85741555e83c0f7efdc0148291a"
      );
    });
  });
});
