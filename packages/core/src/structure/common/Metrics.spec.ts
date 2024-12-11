import { Metrics } from "./Metrics";

describe("Metrics", () => {
  describe("basic operations", () => {
    let metrics: Metrics;

    beforeEach(() => {
      metrics = Metrics.createWithoutDocument();
    });

    it("should create with default values", () => {
      expect(metrics.toArray()).toEqual([1, 0, 0, 1, 0, 0]);
    });

    it("should get/set values correctly", () => {
      metrics.a = 2;
      metrics.b = 3;
      metrics.c = 4;
      metrics.d = 5;
      metrics.e = 6;
      metrics.f = 7;

      expect(metrics.a).toBe(2);
      expect(metrics.b).toBe(3);
      expect(metrics.c).toBe(4);
      expect(metrics.d).toBe(5);
      expect(metrics.e).toBe(6);
      expect(metrics.f).toBe(7);
    });
  });

  describe("utility methods", () => {
    it("should convert degrees to radians", () => {
      expect(Metrics.toRadians(180)).toBe(Math.PI);
      expect(Metrics.toRadians(90)).toBe(Math.PI / 2);
      expect(Metrics.toRadians(0)).toBe(0);
    });

    it("should convert metrics array to matrix", () => {
      const result = Metrics.toMatrix([1, 2, 3, 4, 5, 6]);
      expect(result).toEqual([
        [1, 2, 0],
        [3, 4, 0],
        [5, 6, 1]
      ]);
    });
  });

  describe("transformations", () => {
    let metrics: Metrics;

    beforeEach(() => {
      metrics = Metrics.createWithoutDocument();
    });

    it("should translate correctly", () => {
      metrics.translate("10pt", "20pt");
      expect(metrics.toArray()).toEqual([1, 0, 0, 1, 10, 20]);
    });

    it("should scale correctly", () => {
      metrics.scale(2, 3);
      expect(metrics.toArray()).toEqual([2, 0, 0, 3, 0, 0]);
    });

    it("should rotate correctly", () => {
      metrics.rotate(90);
      const result = metrics.toArray();
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(1);
      expect(result[2]).toBeCloseTo(-1);
      expect(result[3]).toBeCloseTo(0);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(0);
    });

    it("should skew correctly", () => {
      metrics.skew(45, 0);
      const result = metrics.toArray();
      expect(result[0]).toBe(1);
      expect(result[1]).toBeCloseTo(0.785);
      expect(result[2]).toBe(0);
      expect(result[3]).toBe(1);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(0);
    });
  });

  describe("complex transformations", () => {
    let metrics: Metrics;

    beforeEach(() => {
      metrics = Metrics.createWithoutDocument();
    });

    it("should apply multiple transformations", () => {
      metrics.transform([
        { type: "scale", width: 2, height: 2 },
        { type: "rotate", angle: 90 },
        { type: "translate", x: "10pt", y: "10pt" }
      ]);

      const result = metrics.toArray();
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(2);
      expect(result[2]).toBeCloseTo(-2);
      expect(result[3]).toBeCloseTo(0);
      expect(result[4]).toBe(10);
      expect(result[5]).toBe(10);
    });

    it("should handle empty transformations array", () => {
      metrics.transform([]);
      expect(metrics.toArray()).toEqual([1, 0, 0, 1, 0, 0]);
    });

    it("should handle skew transformation", () => {
      metrics.transform([{ type: "skew", a: 45, b: 45 }]);

      const result = metrics.toArray();
      expect(result[0]).toBe(1);
      expect(result[1]).toBeCloseTo(0.785);
      expect(result[2]).toBeCloseTo(0.785);
      expect(result[3]).toBe(1);
      expect(result[4]).toBe(0);
      expect(result[5]).toBe(0);
    });
  });
});
