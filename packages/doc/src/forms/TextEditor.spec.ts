import {
  PdfRenderingHelper,
  xrefTableOptions
} from "@peculiarventures/pdf-tests";
import { PDFDocument, TextEditor } from "@peculiarventures/pdf-doc";
import { DefaultFonts } from "@peculiarventures/pdf-font";

describe("TextEditor", () => {
  let docRaw: ArrayBuffer;

  beforeAll(async () => {
    const doc = await PDFDocument.create(xrefTableOptions);
    const page = doc.pages.create();

    const helvetica = doc.addFont(DefaultFonts.Helvetica);

    page.addTextEditor({
      left: 10,
      top: 10,
      width: 200,
      height: 30,
      borderColor: [0, 0, 0],
      borderWidth: 1,
      name: "textEditor1",
      text: "Test example",
      fontSize: 12,
      font: helvetica,
      multiline: false
    });

    docRaw = await doc.save();
  });

  it("draw", async () => {
    const pageHash = await PdfRenderingHelper.getPageHash(docRaw, 1);
    expect(pageHash).toBe(
      "ae6d03b87d8cded8837a4e1ad2c6bf18ca1d73cf094d680963f825e6cb31692c"
    );
  });

  describe("value", () => {
    it("change text value", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.text = "Hello, World!";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "9413c6059d8da8f99422c077c573e8b50875ad7c50de7f2ce66130ff3babfcbc"
      );
    });

    it("multiline text", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.multiline = true;
      textEditor.text = "Line 1\nLine 2\nLine 3";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "7ffbd7c9b265b1f305280df564b0d2d3864eeb2a3968b160e41dbd733565b030"
      );
    });
  });

  describe("style", () => {
    it("change colors", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.borderColor = [1, 0, 0];
      textEditor.backgroundColor = [0, 1, 0];
      textEditor.textColor = [0, 0, 1];
      textEditor.text = "Colored text";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "a13b3d834420bc243cf4a875f7067c47cf5926f387794482d0bac1141ccaea70"
      );
    });

    it("change font size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.fontSize = 24;
      textEditor.text = "Large text";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "bd1ed7f64fa02bffd1689cc3413d19836689c4a4e133a0c4f228d746eab426be"
      );
    });

    describe("border", () => {
      it("no border", async () => {
        const doc = await PDFDocument.load(docRaw);
        const textEditor = doc.getComponentByName("textEditor1", TextEditor);

        textEditor.borderWidth = 0;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
        expect(pageHash).toBe(
          "6d60b897a3a1d4d0a2c9f3e8cfd80d8ac35575e768339213e463888ef04a8e5e"
        );
      });

      it("change border width", async () => {
        const doc = await PDFDocument.load(docRaw);
        const textEditor = doc.getComponentByName("textEditor1", TextEditor);

        textEditor.borderWidth = 5;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
        expect(pageHash).toBe(
          "5ba4b0933f65b3272446452fcdeeede98bc8e2f0c2b823ac53ea7e6ef3437d52"
        );
      });
    });
  });

  describe("transform", () => {
    it("position", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.left += 100;
      textEditor.top += 100;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "22cc40546a36e757950ccd0fe9ed2e7a75b21629ce2b9c8ab1881918cbc87970"
      );
    });

    it("size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.width += textEditor.width;
      textEditor.height += 20;
      textEditor.text = "Resized text editor";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
      expect(pageHash).toBe(
        "8aec7889b2526cdeaf2d18593c9781a8aa127a4c3d77cbeef2f53823bd3a61c6"
      );
    });
  });

  describe("text features", () => {
    it("read only", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.readOnly = true;
      expect(textEditor.readOnly).toBe(true);
    });
  });
});
