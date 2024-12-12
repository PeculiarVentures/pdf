import { JPEG } from "./JPEG";

// Helper function to create mock JPEG data
function createMockJPEGData(
  options: {
    width?: number;
    height?: number;
    channels?: number;
    bitsPerComponent?: number;
  } = {}
): Uint8Array {
  const data = new Uint8Array([
    0xff,
    0xd8, // SOI marker
    0xff,
    0xc0, // SOF0 marker
    0x00,
    0x0b, // Length
    options.bitsPerComponent ?? 0x08, // Bits per component
    (options.height ?? 0x01) >> 8, // Height high byte
    (options.height ?? 0x01) & 0xff, // Height low byte
    (options.width ?? 0x01) >> 8, // Width high byte
    (options.width ?? 0x01) & 0xff, // Width low byte
    options.channels ?? 0x03 // Number of channels
  ]);
  return data;
}

describe("JPEG", () => {
  describe("isJPEG", () => {
    it("should return true for valid JPEG data", () => {
      const jpegData = createMockJPEGData();
      expect(JPEG.isJPEG(jpegData)).toBe(true);
    });

    it("should return false for invalid JPEG data", () => {
      const invalidData = new Uint8Array([0x00, 0x00]);
      expect(JPEG.isJPEG(invalidData)).toBe(false);
    });
  });

  describe("fromView", () => {
    it("should parse valid JPEG data correctly", () => {
      const mockData = createMockJPEGData({
        width: 100,
        height: 200,
        channels: 3,
        bitsPerComponent: 8
      });

      const jpeg = JPEG.fromView(mockData);

      expect(jpeg.width).toBe(100);
      expect(jpeg.height).toBe(200);
      expect(jpeg.channels).toBe(3);
      expect(jpeg.bitsPerComponent).toBe(8);
      expect(jpeg.data).toEqual(mockData);
    });

    it("should throw error for invalid JPEG data", () => {
      const invalidData = new Uint8Array([0x00, 0x00]);
      expect(() => JPEG.fromView(invalidData)).toThrow(
        /Cannot get SOI marker from JPEG/
      );
    });

    it("should throw error when Frame marker is not found", () => {
      const invalidData = new Uint8Array([
        0xff,
        0xd8, // SOI marker
        0xff,
        0xd9 // EOI marker
      ]);
      expect(() => JPEG.fromView(invalidData)).toThrow(RangeError);
    });
  });
});
