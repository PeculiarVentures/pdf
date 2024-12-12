import {
  PDFArray,
  PDFHexString,
  PDFLiteralString,
  PDFName,
  PDFNumeric
} from "../objects";
import { PDFOperator } from "./Operator";

describe("PDFOperator", () => {
  it("BT", () => {
    const text = "BT";
    const operator = PDFOperator.fromString(text);
    expect(operator.name).toBe("BT");
    expect(operator.parameters.length).toBe(0);

    const strOperator = operator.toString();
    expect(strOperator).toBe(text);
  });

  it("/F13 12 Tf", () => {
    const text = "/F13 12 Tf";
    const operator = PDFOperator.fromString(text);
    expect(operator.name).toBe("Tf");
    expect(operator.parameters.length).toBe(2);
    expect(
      operator.parameters[0] instanceof PDFName && operator.parameters[0].text
    ).toBe("F13");
    expect(
      operator.parameters[1] instanceof PDFNumeric &&
        operator.parameters[1].value
    ).toBe(12);

    const strOperator = operator.toString();
    expect(strOperator).toBe(text);
  });

  it("(Hello world) Tj", () => {
    const text = "(Hello world) Tj";
    const operator = PDFOperator.fromString(text);
    expect(operator.name).toBe("Tj");
    expect(operator.parameters.length).toBe(1);
    expect(
      operator.parameters[0] instanceof PDFLiteralString &&
        operator.parameters[0].text
    ).toBe("Hello world");

    const strOperator = operator.toString();
    expect(strOperator).toBe(text);
  });

  it("<007a>Tj", () => {
    const text = "<007a>Tj";
    const operator = PDFOperator.fromString(text);
    expect(operator.name).toBe("Tj");
    expect(operator.parameters.length).toBe(1);
    expect(
      operator.parameters[0] instanceof PDFHexString &&
        operator.parameters[0].text
    ).toBe("\x00z");

    const strOperator = operator.toString();
    expect(strOperator).toBe("<007a> Tj");
  });

  it("[...]TJ", () => {
    const text =
      "[( )6( A c)5.5(e)-.5(rtifie)5.5(d )6(cop)6.2(y)11.5( o)6.2(f)-1.6( y)11.5(o)6.2(ur marriag)6.2(e c)5.5(e)-.5(rtific)5.5(ate o)6.2(r).6( c)5.5(ourt )6(orde)5.5(r if y)11.5(o)6.2(ur n)6.2(a)-.5(me )6(has)5.5( c)5.5(h).2(a)5.5(nge)5.5(d;)]TJ";
    const operator = PDFOperator.fromString(text);
    expect(operator.name).toBe("TJ");
    expect(operator.parameters.length).toBe(1);
    expect(operator.parameters[0] instanceof PDFArray).toBe(true);
  });
});
