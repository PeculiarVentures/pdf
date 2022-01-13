import *  as assert from "assert";
import { PDFArray, PDFHexString, PDFLiteralString, PDFName, PDFNumeric } from "../objects";
import { PDFOperator } from "./Operator";

context("PDFOperator", () => {

  it("BT", () => {
    const text = "BT";
    const operator = PDFOperator.fromString(text);
    assert.strictEqual(operator.name, "BT");
    assert.strictEqual(operator.parameters.length, 0);

    const strOperator = operator.toString();
    assert.strictEqual(strOperator, text);
  });

  it("/F13 12 Tf", () => {
    const text = "/F13 12 Tf";
    const operator = PDFOperator.fromString(text);
    assert.strictEqual(operator.name, "Tf");
    assert.strictEqual(operator.parameters.length, 2);
    assert.strictEqual(operator.parameters[0] instanceof PDFName && operator.parameters[0].text, "F13");
    assert.strictEqual(operator.parameters[1] instanceof PDFNumeric && operator.parameters[1].value, 12);

    const strOperator = operator.toString();
    assert.strictEqual(strOperator, text);
  });

  it("(Hello world) Tj", () => {
    const text = "(Hello world) Tj";
    const operator = PDFOperator.fromString(text);
    assert.strictEqual(operator.name, "Tj");
    assert.strictEqual(operator.parameters.length, 1);
    assert.strictEqual(operator.parameters[0] instanceof PDFLiteralString && operator.parameters[0].text, "Hello world");

    const strOperator = operator.toString();
    assert.strictEqual(strOperator, text);
  });

  it("<007a>Tj", () => {
    const text = "<007a>Tj";
    const operator = PDFOperator.fromString(text);
    assert.strictEqual(operator.name, "Tj");
    assert.strictEqual(operator.parameters.length, 1);
    assert.strictEqual(operator.parameters[0] instanceof PDFHexString && operator.parameters[0].text, "007a");

    const strOperator = operator.toString();
    assert.strictEqual(strOperator, "<007a> Tj");
  });
  it("[...]TJ", () => {
    const text = "[( )6( A c)5.5(e)-.5(rtifie)5.5(d )6(cop)6.2(y)11.5( o)6.2(f)-1.6( y)11.5(o)6.2(ur marriag)6.2(e c)5.5(e)-.5(rtific)5.5(ate o)6.2(r).6( c)5.5(ourt )6(orde)5.5(r if y)11.5(o)6.2(ur n)6.2(a)-.5(me )6(has)5.5( c)5.5(h).2(a)5.5(nge)5.5(d;)]TJ";
    const operator = PDFOperator.fromString(text);
    assert.strictEqual(operator.name, "TJ");
    assert.strictEqual(operator.parameters.length, 1);
    assert.ok(operator.parameters[0] instanceof PDFArray);
  });

});
