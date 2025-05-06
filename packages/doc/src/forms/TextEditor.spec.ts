import { PdfRenderingHelper, xrefTableOptions } from "@peculiar/pdf-tests";
import { PDFDocument, TextEditor } from "@peculiar/pdf-doc";
import { DefaultFonts } from "@peculiar/pdf-font";

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

  it("draw default", async () => {
    const doc = await PDFDocument.create(xrefTableOptions);
    const page = doc.pages.create();

    const helvetica = doc.addFont(DefaultFonts.Helvetica);

    page.addTextEditor({
      left: 10,
      top: 10,
      width: 200,
      height: 30,
      name: "textEditor1",
      text: "Test example",
      fontSize: 12,
      font: helvetica
    });

    const pdf = await doc.save();

    const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);
    const expectedHash: Record<string, string> = {
      darwin:
        "6d60b897a3a1d4d0a2c9f3e8cfd80d8ac35575e768339213e463888ef04a8e5e",
      linux: "06664973078ee8281ced8234534b7024d2e9e2ba3eeaea18406be91df34bb9b6"
    };
    expect(pageHash).toBe(expectedHash[process.platform]);
  });

  it("draw", async () => {
    const pageHash = await PdfRenderingHelper.getPageHash(docRaw, 1);

    const expectedHash: Record<string, string> = {
      darwin:
        "ae6d03b87d8cded8837a4e1ad2c6bf18ca1d73cf094d680963f825e6cb31692c",
      linux: "f2c203783752fe3736ff3233f30b37f692eb74839acb04c8f78a91f7681eb166"
    };
    expect(pageHash).toBe(expectedHash[process.platform]);
  });

  describe("value", () => {
    it("change text value", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.text = "Hello, World!";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "9413c6059d8da8f99422c077c573e8b50875ad7c50de7f2ce66130ff3babfcbc",
        linux:
          "d790f7cb8c23bdf520bce483ef49bb5a823af850f7fa25ee757010748e53548d"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });

    it("multiline text", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.multiline = true;
      textEditor.text = "Line 1\nLine 2\nLine 3";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "7ffbd7c9b265b1f305280df564b0d2d3864eeb2a3968b160e41dbd733565b030",
        linux:
          "3d1c6babaea69e8917dcfb88cebf56b6f580eb39b78881ca6b960f938b95b173"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
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

      const expectedHash: Record<string, string> = {
        darwin:
          "a13b3d834420bc243cf4a875f7067c47cf5926f387794482d0bac1141ccaea70",
        linux:
          "e530d946cf720346f654e61d4bd981adba9e788f465b2356d192573fd375fae8"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });

    it("change font size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.fontSize = 24;
      textEditor.text = "Large text";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "bd1ed7f64fa02bffd1689cc3413d19836689c4a4e133a0c4f228d746eab426be",
        linux:
          "f94c7c834ded5a0b6f9d39157f51cbaecd12fe7594435931771a2d01d8c541c0"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });

    describe("border", () => {
      it("no border", async () => {
        const doc = await PDFDocument.load(docRaw);
        const textEditor = doc.getComponentByName("textEditor1", TextEditor);

        textEditor.borderWidth = 0;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

        const expectedHash: Record<string, string> = {
          darwin:
            "6d60b897a3a1d4d0a2c9f3e8cfd80d8ac35575e768339213e463888ef04a8e5e",
          linux:
            "06664973078ee8281ced8234534b7024d2e9e2ba3eeaea18406be91df34bb9b6"
        };
        expect(pageHash).toBe(expectedHash[process.platform]);
      });

      it("change border width", async () => {
        const doc = await PDFDocument.load(docRaw);
        const textEditor = doc.getComponentByName("textEditor1", TextEditor);

        textEditor.borderWidth = 5;

        const pdf = await doc.save();
        const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

        const expectedHash: Record<string, string> = {
          darwin:
            "5ba4b0933f65b3272446452fcdeeede98bc8e2f0c2b823ac53ea7e6ef3437d52",
          linux:
            "0893deccb04b152080117e05e94cff5829c564ca36ca502243c8b45be10139c9"
        };
        expect(pageHash).toBe(expectedHash[process.platform]);
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

      const expectedHash: Record<string, string> = {
        darwin:
          "22cc40546a36e757950ccd0fe9ed2e7a75b21629ce2b9c8ab1881918cbc87970",
        linux:
          "be271c2f9bbbaa5b81b3453c16ee611295cfe2afcab34e211973a1367a693f9b"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });

    it("size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const textEditor = doc.getComponentByName("textEditor1", TextEditor);

      textEditor.width += textEditor.width;
      textEditor.height += 20;
      textEditor.text = "Resized text editor";

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "8aec7889b2526cdeaf2d18593c9781a8aa127a4c3d77cbeef2f53823bd3a61c6",
        linux:
          "1619d0ce9e4d8497ec7b291d6b4ff0a96b0fcb57526df2413f55c296103c5162"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
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
