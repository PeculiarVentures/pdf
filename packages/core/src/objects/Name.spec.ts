import { PDFName } from "./Name";

describe("Name", () => {
  const TEST_CASES = [
    ["/Name1", "Name1"],
    ["/ASomewhatLongerName", "ASomewhatLongerName"],
    ["/A;Name_With-Various***Characters?", "A;Name_With-Various***Characters?"],
    ["/1.2", "1.2"],
    ["/$$", "$$"],
    ["/@pattern", "@pattern"],
    ["/.notdef", ".notdef"],
    ["/Lime#20Green", "Lime Green"],
    ["/paired#28#29parentheses", "paired()parentheses"],
    ["/The_Key_of_F#23_Minor", "The_Key_of_F#_Minor"],
    ["/", ""]
  ];

  describe("fromPDF", () => {
    const check = (input: string, expectedText: string) => {
      const name = PDFName.fromPDF(input);
      expect(name.text).toBe(expectedText);
    };

    const checkReadError = (input: string, error: typeof Error) => {
      expect(() => PDFName.fromPDF(input)).toThrow(error);
    };

    TEST_CASES.forEach(([input, expected]) => {
      it(`should parse "${input}" correctly`, () => {
        check(input, expected);
      });
    });

    it("should throw error on missing '/' character", () => {
      checkReadError("Name1", Error);
    });
  });

  describe("toPDF", () => {
    const check = (text: string, expectedOutput: string) => {
      const name = new PDFName(text);
      const view = name.toPDF();
      expect(Buffer.from(view).toString()).toBe(expectedOutput);
    };

    TEST_CASES.forEach(([expected, input]) => {
      it(`should convert "${input}" to "${expected}"`, () => {
        check(input, expected);
      });
    });
  });

  describe("toString", () => {
    TEST_CASES.forEach(([expected, input]) => {
      it(`should return "/${input}" for "${expected}"`, () => {
        const name = new PDFName(input);
        expect(name.toString()).toBe(`/${input}`);
      });
    });
  });

  describe("copy", () => {
    it("should create a copy with the same text", () => {
      const name = new PDFName("TestName");
      const copy = name.copy();
      expect(copy.text).toBe("TestName");
      expect(copy).not.toBe(name);
    });
  });

  describe("isNameChar", () => {
    it("should return true for valid name characters", () => {
      expect(PDFName.isNameChar(0x41)).toBe(true); // 'A'
      expect(PDFName.isNameChar(0x7a)).toBe(true); // 'z'
    });

    it("should return false for invalid name characters", () => {
      expect(PDFName.isNameChar(0x20)).toBe(false); // space
      expect(PDFName.isNameChar(0x2f)).toBe(false); // '/'
      expect(PDFName.isNameChar(0x7f)).toBe(false); // DEL
    });
  });
});
