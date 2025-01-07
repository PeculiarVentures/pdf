import { createCanvas, Canvas } from "canvas";
import * as fs from "node:fs";
import * as path from "node:path";
import * as pdfjs from "pdfjs-dist";
import { BufferSourceConverter, Convert } from "pvtsutils";

interface NodeCanvas {
  canvas: Canvas;
  context: CanvasRenderingContext2D;
}

// Custom canvas factory for Node.js
class NodeCanvasFactory {
  create(width: number, height: number): NodeCanvas {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext(
      "2d"
    ) as unknown as CanvasRenderingContext2D;
    return {
      canvas,
      context
    };
  }

  reset(canvasAndContext: NodeCanvas, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(_canvasAndContext: NodeCanvas) {
    // Node's canvas doesn't need explicit destroy
  }
}

export class PdfRenderingHelper {
  private static readonly CANVAS_PARAMS = {
    canvasFactory: new NodeCanvasFactory(),
    url: {
      cMapUrl: `${__dirname}/../../../node_modules/pdfjs-dist/cmaps/`,
      standardFontDataUrl: `${__dirname}/../../../node_modules/pdfjs-dist/standard_fonts/`
    }
  };

  static async load(
    buffer: BufferSource,
    password?: string
  ): Promise<PdfRenderingHelper> {
    const data = BufferSourceConverter.toUint8Array(buffer).slice(); // pdfjs modifies the buffer
    const doc = await pdfjs.getDocument({
      data,
      cMapUrl: this.CANVAS_PARAMS.url.cMapUrl,
      cMapPacked: true,
      password,
      standardFontDataUrl: this.CANVAS_PARAMS.url.standardFontDataUrl
    }).promise;

    return new PdfRenderingHelper(doc);
  }

  /**
   * Writes binary data to a PDF file
   * @param buffer - The binary data to write to the file. Can be any BufferSource type (ArrayBuffer, TypedArray, etc.)
   * @param filePath - Optional. The path where the PDF file should be written. If not provided, defaults to '../../../tmp.pdf' relative to current directory
   * @throws {Error} If file cannot be written or if buffer cannot be converted to ArrayBuffer
   */
  public static writeToFile(buffer: BufferSource, filePath?: string): void {
    filePath ??= path.resolve(__dirname, `../../../tmp.pdf`);
    fs.writeFileSync(
      filePath,
      Buffer.from(BufferSourceConverter.toArrayBuffer(buffer))
    );
  }

  /**
   * Get SHA-256 hash of a page in a PDF document.
   * @param buffer - PDF document buffer
   * @param pageNumber - Page number (default 1)
   * @param writeFile - Write the rendered page to a file (default false)
   * @returns SHA-256 hash of the page
   *
   * @remarks This method is used to compare the rendering of a page in a PDF document.
   * It creates a PNG image of the page and calculates the SHA-256 hash of the image. If
   * `writeFile` is set to `true`, it writes the image to a file in the workspace directory
   * with the name `page_<pageNumber>.png` and the PDF document to `tmp.pdf`.
   */
  static async getPageHash(
    buffer: BufferSource,
    pageNumber = 1,
    writeFile?: boolean,
    password?: string
  ): Promise<string> {
    const pdf = await PdfRenderingHelper.load(buffer, password);
    const hash = await pdf.getPageHash(pageNumber, writeFile);

    if (writeFile) {
      this.writeToFile(buffer);
    }

    return hash;
  }

  private document: pdfjs.PDFDocumentProxy;

  private constructor(document: pdfjs.PDFDocumentProxy) {
    this.document = document;
  }

  async renderPageToImage(pageNumber = 1, scale = 1.0): Promise<Buffer> {
    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvasFactory = new NodeCanvasFactory();
    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height
    );

    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory
    };

    await page.render(renderContext).promise;

    const canvas = canvasAndContext.canvas as Canvas;
    return canvas.toBuffer("image/png");
  }

  async getPageHash(pageNumber = 1, writeFile?: boolean): Promise<string> {
    const pageImage = await this.renderPageToImage(pageNumber);

    if (writeFile) {
      fs.writeFileSync(
        path.resolve(__dirname, `../../../page_${pageNumber}.png`),
        pageImage
      );
    }

    const hash = await crypto.subtle.digest("SHA-256", pageImage);
    return Convert.ToHex(hash);
  }
}
