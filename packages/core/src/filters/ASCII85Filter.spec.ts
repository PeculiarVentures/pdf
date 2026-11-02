import { describe, it, expect } from "vitest";
import { binary, bytes, toArrayBuffer, toUint8Array } from "@peculiar/utils";
import { ASCII85Filter } from "./ASCII85Filter";

describe("ASCII85Filter", () => {
  const vector: [string, ArrayBuffer, string][] = [
    ["F)Po,GA(E,+Co1uAnbatCif~>", toArrayBuffer(binary.decode("somewhat difficult")), "simple text"],
    ['z!<<*"z~>', new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]).buffer, "data with zero blocks"],
    ["F)Po,GA\n(E,+Co1uA\nnbatCif~>", toArrayBuffer(binary.decode("somewhat difficult")), "formatted data"],
  ];

  vector.forEach(([encoded, decoded, name]) => {
    it(name, async () => {
      const filter = new ASCII85Filter();

      const decodedValue = await filter.decode(toUint8Array(toArrayBuffer(binary.decode(encoded))));
      expect(bytes.equal(decodedValue, decoded)).toBe(true);

      const encodedValue = await filter.encode(toUint8Array(decodedValue));
      expect(bytes.equal(encodedValue, toArrayBuffer(binary.decode(encoded.replace(/\n/g, ""))))).toBe(true);
    });
  });
});
