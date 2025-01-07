import { PDFComment } from "./Comment";

describe("Comment", () => {
  describe("fromPDF", () => {
    const check = (input: string, expectedText: string) => {
      const comment = PDFComment.fromPDF(input);
      expect(comment.text).toBe(expectedText);
    };

    const checkReadError = (input: string, error: typeof Error) => {
      expect(() => PDFComment.fromPDF(input)).toThrow(error);
    };

    it("should parse comment correctly", () => {
      check(
        "% comment (/%) blah blah blah\n123",
        "comment (/%) blah blah blah"
      );
    });

    it("should throw error on missing '%' character", () => {
      checkReadError(" comment without percent\n", Error);
    });
  });

  describe("toPDF", () => {
    const check = (text: string, expectedOutput: string) => {
      const comment = new PDFComment(text);
      const view = comment.toPDF();
      expect(Buffer.from(view).toString()).toBe(expectedOutput);
    };

    it("should convert comment to PDF format", () => {
      check("This is a comment", "% This is a comment");
    });
  });

  describe("toString", () => {
    it("should return comment string with '%' prefix", () => {
      const comment = new PDFComment("This is a comment");
      expect(comment.toString()).toBe("% This is a comment");
    });
  });

  describe("copy", () => {
    it("should create a copy with the same text", () => {
      const comment = new PDFComment("This is a comment");
      const copy = comment.copy();
      expect(copy.text).toBe("This is a comment");
      expect(copy).not.toBe(comment);
    });
  });
});
