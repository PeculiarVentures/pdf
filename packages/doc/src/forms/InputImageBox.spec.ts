import {
  jpegImage,
  PdfRenderingHelper,
  xrefTableOptions
} from "@peculiar/pdf-tests";
import { InputImageBox, PDFDocument } from "@peculiar/pdf-doc";

describe("InputImageBox", () => {
  let docRaw: ArrayBuffer;
  let testImageData: ArrayBuffer;

  beforeAll(async () => {
    const doc = await PDFDocument.create(xrefTableOptions);
    const page = doc.pages.create();

    testImageData = jpegImage;

    // Create basic image box
    page.addInputImageBox({
      left: 10,
      top: 10,
      width: 248, // 496x218 is the size of the test image
      height: 109,
      name: "imageBox1",
      alt: "Test Image",
      image: doc.createImage(testImageData)
    });

    docRaw = await doc.save();
  });

  it("draw", async () => {
    const pageHash = await PdfRenderingHelper.getPageHash(docRaw, 1);

    const expectedHash: Record<string, string> = {
      darwin:
        "6260e999f887cfbc11d2f1e69f7b23e02c75e10e175ff1dae2592650a9a644d5",
      linux: "5f58a94cbe7eb528ff12c2accf5f3e485333437d085ba85354563883b9fe089b"
    };
    expect(pageHash).toBe(expectedHash[process.platform]);
  });

  describe("image operations", () => {
    it("set image", async () => {
      const doc = await PDFDocument.load(docRaw);
      const imageBox = doc.getComponentByName("imageBox1", InputImageBox);

      const image = doc.createImage(testImageData);
      imageBox.image = image;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "6260e999f887cfbc11d2f1e69f7b23e02c75e10e175ff1dae2592650a9a644d5",
        linux:
          "5f58a94cbe7eb528ff12c2accf5f3e485333437d085ba85354563883b9fe089b"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });

    it("clear image", async () => {
      let doc = await PDFDocument.load(docRaw);
      let imageBox = doc.getComponentByName("imageBox1", InputImageBox);

      const image = doc.createImage(testImageData);
      imageBox.image = image;

      let pdf = await doc.save();
      let pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "6260e999f887cfbc11d2f1e69f7b23e02c75e10e175ff1dae2592650a9a644d5",
        linux:
          "5f58a94cbe7eb528ff12c2accf5f3e485333437d085ba85354563883b9fe089b"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);

      doc = await PDFDocument.load(pdf);
      imageBox = doc.getComponentByName("imageBox1", InputImageBox);
      imageBox.image = null;

      pdf = await doc.save();
      pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash2: Record<string, string> = {
        darwin:
          "f724162d629d671000f9dcaf9e81be20f45f8060b5f84b4a5d5b9794e096595e",
        linux:
          "f724162d629d671000f9dcaf9e81be20f45f8060b5f84b4a5d5b9794e096595e"
      };
      expect(pageHash).toBe(expectedHash2[process.platform]);
    });
  });

  describe("transform", () => {
    it("position", async () => {
      const doc = await PDFDocument.load(docRaw);
      const imageBox = doc.getComponentByName("imageBox1", InputImageBox);

      imageBox.left += 100;
      imageBox.top += 100;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "5ecde8d63a7b1691efa9605f67cfb27c6e50786d40762a4449d3624b630cdf7c",
        linux:
          "9fdac3e477756d3d81091e7592d06c727b3523fe0f605fdc2eb0d1e3e52d2f85"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });

    it("size", async () => {
      const doc = await PDFDocument.load(docRaw);
      const imageBox = doc.getComponentByName("imageBox1", InputImageBox);

      imageBox.width = imageBox.width / 2;
      imageBox.height = imageBox.height * 2;

      const pdf = await doc.save();
      const pageHash = await PdfRenderingHelper.getPageHash(pdf, 1);

      const expectedHash: Record<string, string> = {
        darwin:
          "d2f4636657c6da5b1338b4838d4d36e0cace93e05cd5e58ca0f92b0424a094a4",
        linux:
          "79d863b1dd1ba1f8e50e8af569244908775fcefa8939fd6e658d335f19fa3675"
      };
      expect(pageHash).toBe(expectedHash[process.platform]);
    });
  });

  it("get image from box", async () => {
    const doc = await PDFDocument.load(docRaw);
    const imageBox = doc.getComponentByName("imageBox1", InputImageBox);
    const image = imageBox.image;
    expect(image).not.toBe(null);
  });

  describe("Handler", () => {
    it("creates image box with parameters", async () => {
      const doc = await PDFDocument.create(xrefTableOptions);
      const page = doc.pages.create();

      const imageBox = page.addInputImageBox({
        left: 20,
        top: 20,
        width: 150,
        height: 150,
        name: "imageBox2",
        alt: "Test Image 2"
      });

      expect(imageBox).toBeDefined();
      expect(imageBox.left).toBe(20);
      expect(imageBox.top).toBe(20);
      expect(imageBox.width).toBe(150);
      expect(imageBox.height).toBe(150);
    });

    it("creates image box with image", async () => {
      const doc = await PDFDocument.create(xrefTableOptions);
      const page = doc.pages.create();
      const image = doc.createImage(testImageData);

      const imageBox = page.addInputImageBox({
        left: 20,
        top: 20,
        width: 150,
        height: 150,
        image,
        alt: "Test Image With Data"
      });

      expect(imageBox.image).toBeDefined();
      expect(imageBox.image).not.toBeNull();
    });
  });
});
