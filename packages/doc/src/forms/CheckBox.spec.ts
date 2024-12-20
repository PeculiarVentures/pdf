import {
  PdfRenderingHelper,
  xrefTableOptions
} from "@peculiarventures/pdf-tests";
import { CheckBox, PDFDocument } from "@peculiarventures/pdf-doc";

describe("CheckBox", () => {
  let docRaw: ArrayBuffer;

  beforeAll(async () => {
    const doc = await PDFDocument.create(xrefTableOptions);
    const page = doc.pages.create();

    page.addCheckBox({
      left: 10,
      top: 10,
      width: 20,
      height: 20,
      borderColor: [0, 0, 0],
      borderWidth: 1,
      name: "checkBox1",
      enabled: false
    });

    docRaw = await doc.save();
  });

  it("draw", async () => {
    const pageHash = await PdfRenderingHelper.getPageHash(docRaw, 1);
    expect(pageHash).toBe(
      "1cd4b7d6584a30e5ad13ebfa69b3de8dfb6b7518e4a410837173ea9aaedc1337"
    );
  });

  it("change value", async () => {
    const doc = await PDFDocument.load(docRaw);
    const checkBox = doc.getComponentByName("checkBox1", CheckBox);

    checkBox.checked = true;

    const pdf = await doc.save();
    const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

    expect(pageHash).toBe(
      "314e2e5af84bbe7180700e146e8a385bbc2392f2d111484f41a3096c2dc0765b"
    );
  });

  describe("style", () => {
    it("change colors", async () => {
      const doc = await PDFDocument.load(docRaw);
      const checkBox = doc.getComponentByName("checkBox1", CheckBox);

      checkBox.borderColor = [1, 0, 0];
      checkBox.backgroundColor = [0, 1, 0];
      checkBox.foreColor = [0, 0, 1];
      checkBox.checked = true;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "fa09bde7805bf1b37c3534d15e708e5d673b0d31c008da8923cbecc13a01fdc0"
      );
    });

    describe("border", () => {
      it("no border", async () => {
        const doc = await PDFDocument.load(docRaw);
        const checkBox = doc.getComponentByName("checkBox1", CheckBox);

        checkBox.borderWidth = 0;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

        expect(pageHash).toBe(
          "f724162d629d671000f9dcaf9e81be20f45f8060b5f84b4a5d5b9794e096595e"
        );
      });

      it("change border width", async () => {
        const doc = await PDFDocument.load(docRaw);
        const checkBox = doc.getComponentByName("checkBox1", CheckBox);

        checkBox.borderWidth = 2;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

        expect(pageHash).toBe(
          "615925d2c924808cd556ce8096d4b7f2678386c7aba046ab72792b8e11f359b9"
        );
      });
    });
  });

  describe("transform", () => {
    it("position", async () => {
      const doc = await PDFDocument.load(docRaw);
      const checkBox = doc.getComponentByName("checkBox1", CheckBox);

      checkBox.left += 100;
      checkBox.top += 100;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "59a44d1ab362eb83dd4030d5213201ddf059ac237c9f27dd16a4960adc465c64"
      );
    });

    it("size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const checkBox = doc.getComponentByName("checkBox1", CheckBox);

      checkBox.width += 20;
      checkBox.height += 20;
      checkBox.checked = true;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      expect(pageHash).toBe(
        "2f940cb11206838653734a8502492b706f7cb2cf87fddd8b3b4b7957ce917df3"
      );
    });
  });
});
