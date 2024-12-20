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

  static async load(buffer: BufferSource): Promise<PdfRenderingHelper> {
    const data = BufferSourceConverter.toUint8Array(buffer).slice(); // pdfjs modifies the buffer
    const doc = await pdfjs.getDocument({
      data,
      cMapUrl: this.CANVAS_PARAMS.url.cMapUrl,
      cMapPacked: true,
      standardFontDataUrl: this.CANVAS_PARAMS.url.standardFontDataUrl
    }).promise;

    return new PdfRenderingHelper(doc);
  }

  static async getPageHash(
    buffer: BufferSource,
    pageNumber = 1,
    writeFile?: boolean
  ): Promise<string> {
    const pdf = await PdfRenderingHelper.load(buffer);
    return pdf.getPageHash(pageNumber, writeFile);
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
