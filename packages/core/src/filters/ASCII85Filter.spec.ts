import { BufferSourceConverter, Convert } from "pvtsutils";
import { ASCII85Filter } from "./ASCII85Filter";

describe("ASCII85Filter", () => {
  const vector: [string, ArrayBuffer, string][] = [
    [
      "F)Po,GA(E,+Co1uAnbatCif~>",
      Convert.FromBinary("somewhat difficult"),
      "simple text"
    ],
    [
      'z!<<*"z~>',
      new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]),
      "data with zero blocks"
    ],
    [
      "F)Po,GA\n(E,+Co1uA\nnbatCif~>",
      Convert.FromBinary("somewhat difficult"),
      "formatted data"
    ]
  ];

  vector.forEach(([encoded, decoded, name]) => {
    it(name, async () => {
      const filter = new ASCII85Filter();

      const decodedValue = await filter.decode(
        BufferSourceConverter.toUint8Array(Convert.FromBinary(encoded))
      );
      expect(BufferSourceConverter.isEqual(decodedValue, decoded)).toBe(true);

      const encodedValue = await filter.encode(
        BufferSourceConverter.toUint8Array(decodedValue)
      );
      expect(
        BufferSourceConverter.isEqual(
          encodedValue,
          Convert.FromBinary(encoded.replace(/\n/g, ""))
        )
      ).toBe(true);
    });
  });
});
