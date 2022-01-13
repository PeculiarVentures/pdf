import { BufferSourceConverter } from "pvtsutils";

export interface HashedAlgorithm extends Algorithm {
  hash: Algorithm;
}
export interface HashedAlgorithmIdentifier extends Algorithm {
  hash: HashAlgorithmIdentifier;
}

export interface AlgorithmConverter {
  name: string;
  toBER(algorithm: Algorithm | HashedAlgorithm): ArrayBuffer | null;
  fromBER(raw: ArrayBuffer): Algorithm | null;
}

export class AlgorithmFactory {

  public static converters: AlgorithmConverter[] = [];

  public static register(converter: AlgorithmConverter): void {
    this.converters.push(converter);
  }

  public static prepareAlgorithm(algorithm: AlgorithmIdentifier | HashedAlgorithmIdentifier): Algorithm | HashedAlgorithm {
    if (typeof algorithm === "string") {
      return { name: algorithm };
    }

    if ("hash" in algorithm && typeof algorithm.hash === "string") {
      return {
        name: algorithm.name,
        hash: {
          name: algorithm.hash,
        }
      };
    }

    return algorithm;
  }

  public static toBER(algorithm: AlgorithmIdentifier | HashedAlgorithmIdentifier): ArrayBuffer {
    const alg = this.prepareAlgorithm(algorithm);

    for (let i = this.converters.length; i > 0; i--) {
      const converter = this.converters[i - 1];
      const raw = converter.toBER(alg);
      if (raw) {
        return raw;
      }
    }

    throw new Error("Cannot encode Algorithm to BER format. Unsupported algorithm.");
  }

  public static fromBER(raw: BufferSource): Algorithm {
    const arrayBuffer = BufferSourceConverter.toArrayBuffer(raw);

    for (let i = this.converters.length; i > 0; i--) {
      const converter = this.converters[i - 1];
      const raw = converter.fromBER(arrayBuffer);
      if (raw) {
        return raw;
      }
    }

    throw new Error("Cannot decode BER format to Algorithm. Unsupported algorithm identifier.");
  }

}
