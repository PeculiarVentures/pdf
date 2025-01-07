import { PDFDocument } from "../Document";
import { NumberTrees } from "./NumberTrees";
import { XrefStructure } from "../XrefStructure";

describe("NumberTrees", () => {
  let doc: PDFDocument;

  beforeAll(() => {
    doc = PDFDocument.create({
      disableAscii85Encoding: true,
      disableCompressedStreams: true,
      disableCompressedObjects: true,
      xref: XrefStructure.Table
    });
  });

  describe("creation", () => {
    it("should create empty number tree with default values", () => {
      const tree = NumberTrees.create(doc);
      expect(tree.Kids).toBeNull();
      expect(tree.Names).toBeNull();
      expect(tree.Limits).toBeNull();
    });
  });

  describe("names property", () => {
    let tree: NumberTrees;

    beforeEach(() => {
      tree = NumberTrees.create(doc);
    });

    it("should store names array correctly", () => {
      const namesArray = doc.createArray();
      const ref1 = doc.createString("1").makeIndirect();
      const ref2 = doc.createString("2").makeIndirect();

      namesArray.push(doc.createNumber(1));
      namesArray.push(ref1);
      namesArray.push(doc.createNumber(2));
      namesArray.push(ref2);

      tree.Names = namesArray;
      expect(tree.Names).toBe(namesArray);
    });

    it("should allow null value for Names", () => {
      tree.Names = null;
      expect(tree.Names).toBeNull();
    });
  });

  describe("kids property", () => {
    it("should handle kids array correctly", () => {
      const tree = NumberTrees.create(doc);
      const kidsArray = doc.createArray();
      const ref = doc.createString("1").makeIndirect();
      kidsArray.push(ref);

      tree.set("Kids", kidsArray);

      expect(tree.Kids).toHaveLength(1);
      expect(tree.Kids?.[0]).toBe(ref);
    });

    it("should allow null value for Kids", () => {
      const tree = NumberTrees.create(doc);
      expect(tree.Kids).toBeNull();
    });
  });

  describe("limits property", () => {
    it("should handle limits array correctly", () => {
      const tree = NumberTrees.create(doc);
      const limitsArray = doc.createArray();
      const min = doc.createString("1");
      const max = doc.createString("100");
      limitsArray.push(min);
      limitsArray.push(max);

      tree.set("Limits", limitsArray);

      expect(tree.Limits).toHaveLength(2);
      expect(tree.Limits?.[0]).toBe(min);
      expect(tree.Limits?.[1]).toBe(max);
    });

    it("should allow null value for Limits", () => {
      const tree = NumberTrees.create(doc);
      expect(tree.Limits).toBeNull();
    });
  });
});
