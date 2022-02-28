import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import { AlgorithmFactory, AlgorithmConverter, HashedAlgorithm } from "../AlgorithmFactory";

const id_shake128 = "2.16.840.1.101.3.4.2.11";
const id_shake256 = "2.16.840.1.101.3.4.2.12";

const ber_shake128 = Convert.FromHex("300B060960864801650304020B");
const ber_shake256 = Convert.FromHex("300B060960864801650304020C");

export const shakeAlgorithmConverter: AlgorithmConverter = {
  name: "SHAKE",
  toBER(algorithm: Algorithm | HashedAlgorithm): ArrayBuffer | null {
    switch (algorithm.name.toUpperCase()) {
      case "SHAKE128":
        return ber_shake128;
      case "SHAKE256":
        return ber_shake256;
    }

    return null;
  },

  fromBER(raw: ArrayBuffer): Algorithm | null {
    const asn = asn1js.fromBER(raw);
    const algorithmIdentifier = new pkijs.AlgorithmIdentifier({ schema: asn.result });

    switch (algorithmIdentifier.algorithmId) {
      case id_shake128:
        return { name: "shake128" };
      case id_shake256:
        return { name: "shake256" };
    }

    return null;
  },

};

AlgorithmFactory.register(shakeAlgorithmConverter);
