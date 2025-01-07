import { PDFHexString } from "./HexString";

describe("HexString", () => {
  describe("to/from PDF", () => {
    [
      ["<901FA3>", "901FA3"],
      ["<901FA>", "901FA0"]
    ].forEach(([i, o]) => {
      it(i, () => {
        const parsedItem = PDFHexString.fromPDF(i);
        expect(Buffer.from(parsedItem.text, "binary").toString("hex")).toBe(
          o.toLowerCase()
        );

        // check data field
        expect(Buffer.from(parsedItem.data).toString("hex")).toBe(
          o.toLowerCase()
        );

        const out = parsedItem.toPDF();
        expect(Buffer.from(out).toString("binary").toUpperCase()).toBe(
          `<${o}>`
        );

        // check toString
        expect(parsedItem.toString()).toBe(`<${o.toLowerCase()}>`);
      });
    });
  });
});
