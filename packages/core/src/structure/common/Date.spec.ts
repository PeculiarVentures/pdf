import { PDFDate } from "./Date";
import { PDFDocument } from "../Document";
import { PDFLiteralString } from "../../objects";

describe("PDFDate", () => {
  describe("constructor", () => {
    it("should create from Date object", () => {
      const date = new Date("2021-10-04T01:02:03.000Z");
      const pdfDate = new PDFDate(date);
      expect(pdfDate.toString()).toMatch(/^\(D:20211004\d{6}[+-]\d{2}'00'\)$/);
    });

    it("should create from PDFString", () => {
      const pdfString = new PDFLiteralString("D:20211004040203+03'00'");
      const pdfDate = new PDFDate(pdfString);
      expect(pdfDate.toString()).toBe(pdfString.toString());
    });

    it("should create from string", () => {
      const str = "D:20211004040203+03'00'";
      const pdfDate = new PDFDate(str);
      expect(pdfDate.toString()).toBe(`(${str})`);
    });
  });

  describe("getDateAsync", () => {
    it("should return Date object", async () => {
      const date = new Date();
      const pdfDate = new PDFDate(date);
      const result = await pdfDate.getDateAsync();
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("getDate", () => {
    it("should throw for invalid date format", () => {
      const pdfDate = new PDFDate("invalid");
      expect(() => pdfDate.getDate()).toThrow("Cannot parse date");
    });

    // ...existing tests for fromPDF...
  });

  describe("setDate", () => {
    it("should handle positive timezone", () => {
      const date = new PDFDate();
      const testDate = new Date();
      jest.spyOn(testDate, "getTimezoneOffset").mockReturnValue(-180); // +03:00
      date.setDate(testDate);
      expect(date.toString()).toMatch(/\+03'00'\)$/);
    });

    it("should handle negative timezone", () => {
      const date = new PDFDate();
      const testDate = new Date();
      jest.spyOn(testDate, "getTimezoneOffset").mockReturnValue(180); // -03:00
      date.setDate(testDate);
      expect(date.toString()).toMatch(/-03'00'\)$/);
    });

    it("should handle UTC timezone", () => {
      const date = new PDFDate();
      const testDate = new Date();
      jest.spyOn(testDate, "getTimezoneOffset").mockReturnValue(0); // UTC
      date.setDate(testDate);
      expect(date.toString()).toMatch(/Z\)$/);
    });
  });

  describe("createDate", () => {
    it("should create PDFDate with current date when no date provided", () => {
      const doc = new PDFDocument();
      const now = new Date();
      const pdfDate = PDFDate.createDate(doc);
      const result = pdfDate.getDate();
      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
    });

    it("should create PDFDate with provided date", () => {
      const doc = new PDFDocument();
      const testDate = new Date("2021-10-04T01:02:03.000Z");
      const pdfDate = PDFDate.createDate(doc, testDate);
      const result = pdfDate.getDate();
      expect(result.toISOString()).toBe(testDate.toISOString());
    });
  });

  describe("toString", () => {
    it("should convert Date to PDF format with positive timezone", () => {
      const initDate = new Date("2021-10-04T01:02:03.000+0000");
      const date = new PDFDate(initDate);
      const result = date.toString();
      expect(result).toMatch(/^\(D:20211004\d{6}[+-]\d{2}'00'\)$/);
    });
  });

  describe("fromPDF", () => {
    const checkFromPDF = (input: string, want: number) => {
      const date = PDFDate.fromPDF(input).getDate();
      expect(date.getTime()).toBe(want);
    };

    it("with positive timezone", () => {
      checkFromPDF(
        "(D:20211004040203+03'00')",
        new Date("2021-10-04T01:02:03.000+0000").getTime()
      );
    });

    it("with negative timezone", () => {
      checkFromPDF("(D:20211004040203-03'00')", 1633330923000);
    });

    it("with Z timezone", () => {
      checkFromPDF("(D:20211004040203Z)", 1633320123000);
    });
  });
});
