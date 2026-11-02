import * as fastPng from "fast-png";
import { describe, it, expect } from "vitest";
import { PDFDocument } from "./Document";
import { Image } from "./Image";

describe("Image", () => {
  describe("export", () => {
    it("should export a PNG without bytes after the IEND chunk", async () => {
      const png = fastPng.encode({
        width: 2,
        height: 2,
        channels: 4,
        depth: 8,
        data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 128]),
      });
      const doc = await PDFDocument.create();
      const image = Image.create(png, doc);

      const result = await image.export();

      expect(result.type).toBe("png");
      expect(result.data).toBeInstanceOf(ArrayBuffer);
      const view = new Uint8Array(result.data);
      // IEND chunk: zero length, "IEND", CRC
      expect(Buffer.from(view.subarray(-12)).toString("hex")).toBe("0000000049454e44ae426082");
      expect(fastPng.decode(view).data).toEqual(fastPng.decode(png).data);
    });
  });
});
