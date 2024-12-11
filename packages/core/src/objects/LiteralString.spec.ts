import { PDFLiteralString } from "./LiteralString";

describe("LiteralString", () => {
  describe("fromPDF", () => {
    const check = (input: string, expectedText: string) => {
      const literalString = PDFLiteralString.fromPDF(input);
      expect(literalString.text).toBe(expectedText);
    };

    const checkReadError = (input: string, error: typeof Error) => {
      expect(() => PDFLiteralString.fromPDF(input)).toThrow(error);
    };

    it("should parse literal string correctly", () => {
      check(
        "(literal string with \\(escaped\\) characters)",
        "literal string with (escaped) characters"
      );
    });

    it("should throw error on missing '(' character", () => {
      checkReadError("literal string without parenthesis)", Error);
    });

    it("should throw error on missing ')' character", () => {
      checkReadError("(literal string without closing parenthesis", Error);
    });

    it("should parse (This is a string) correctly", () => {
      check("(This is a string)", "This is a string");
    });

    it("should parse (Strings may contain newlines\\nand such.) correctly", () => {
      check(
        "(Strings may contain newlines\nand such.)",
        "Strings may contain newlines\nand such."
      );
    });

    it("should parse (Strings may contain balanced parentheses ( ) and special characters (*!&}^% and so on).) correctly", () => {
      check(
        "(Strings may contain balanced parentheses ( ) and special characters (*!&}^% and so on).)",
        "Strings may contain balanced parentheses ( ) and special characters (*!&}^% and so on)."
      );
    });

    it("should parse (String with escaped char at the end\\\\) correctly", () => {
      check(
        "(String with escaped char at the end\\\\)",
        "String with escaped char at the end\\"
      );
    });

    it("should parse (String with escaped \\) char) correctly", () => {
      check("(String with escaped \\) char)", "String with escaped ) char");
    });

    it("should parse () correctly", () => {
      check("()", "");
    });

    it("should parse (Sting with newline\\n) correctly", () => {
      check("(Sting with newline\\n)", "Sting with newline\n");
    });

    it("should parse (This string contains \\\nat the \\\r\nend-of-line) correctly", () => {
      check(
        "(This string contains \\\nat the \\\r\nend-of-line)",
        "This string contains at the end-of-line"
      );
    });

    it("should parse (This string contains \\245two octal characters\\307) correctly", () => {
      check(
        "(This string contains \\245two octal characters\\307)",
        "This string contains ¥two octal charactersÇ"
      );
    });

    it("should parse (\\0053) correctly", () => {
      check("(\\0053)", "\x053");
    });

    it("should parse (\\053) correctly", () => {
      check("(\\053)", "+");
    });

    it("should parse (\\53) correctly", () => {
      check("(\\53)", "+");
    });

    it("should parse (Escaped parenthesis \\() correctly", () => {
      check("(Escaped parenthesis \\()", "Escaped parenthesis (");
    });
  });

  describe("toPDF", () => {
    const check = (text: string, expectedOutput: string) => {
      const literalString = new PDFLiteralString(text);
      const view = literalString.toPDF();
      expect(Buffer.from(view).toString("binary")).toBe(expectedOutput);
    };

    it("should convert literal string to PDF format", () => {
      check("This is a literal string", "(This is a literal string)");
    });

    it("should convert empty string to PDF format correctly", () => {
      check("", "()");
    });

    it("should escape special chars and convert to PDF format correctly", () => {
      check(
        "All escaped chars \n\r\t\b\f()\\+",
        "(All escaped chars \\n\\r\\t\\b\\f\\(\\)\\\\+)"
      );
    });

    it("should convert non-utf-8 string to PDF format correctly", () => {
      check(
        "\x43\xaf\xc9\x7f\xef\xff\xe6\xa8\xcb\x5c\xaf\xd0",
        "(\x43\xaf\xc9\x7f\xef\xff\xe6\xa8\xcb\x5c\x5c\xaf\xd0)"
      );
    });
  });

  describe("getMaxUnicode", () => {
    const check = (text: string, expectedMaxUnicode: number) => {
      const maxUnicode = PDFLiteralString.getMaxUnicode(text);
      expect(maxUnicode).toBe(expectedMaxUnicode);
    };

    it("should return the maximum unicode value in the string", () => {
      check("This is a test", 116); // 't' has the highest unicode value
    });

    it("should return 0 for an empty string", () => {
      check("", 0);
    });

    it("should handle strings with special characters", () => {
      check("Hello, 世界", 30028); // '界' has the highest unicode value
    });

    it("should handle strings with escape sequences", () => {
      check("Escape sequences \\n\\t\\b", 117); // 'u' has the highest unicode value
    });
  });

  describe("toString", () => {
    it("should return literal string with parentheses", () => {
      const literalString = new PDFLiteralString("This is a literal string");
      expect(literalString.toString()).toBe("(This is a literal string)");
    });
  });

  describe("copy", () => {
    it("should create a copy with the same text", () => {
      const literalString = new PDFLiteralString("This is a literal string");
      const copy = literalString.copy();
      expect(copy.text).toBe("This is a literal string");
      expect(copy).not.toBe(literalString);
    });
  });
});
