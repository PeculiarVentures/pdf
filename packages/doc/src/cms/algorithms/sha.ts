import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import { AlgorithmFactory, AlgorithmConverter, HashedAlgorithm } from "../AlgorithmFactory";

const id_sha1 = "1.3.14.3.2.26";
const id_sha256 = "2.16.840.1.101.3.4.2.1";
const id_sha384 = "2.16.840.1.101.3.4.2.2";
const id_sha512 = "2.16.840.1.101.3.4.2.3";

const ber_sha1 = Convert.FromHex("300906052b0e03021a0500");
const ber_sha256 = Convert.FromHex("300d06096086480165030402010500");
const ber_sha384 = Convert.FromHex("300d06096086480165030402020500");
const ber_sha512 = Convert.FromHex("300d06096086480165030402030500");

export const shaAlgorithmConverter: AlgorithmConverter = {
  name: "SHA",
  toBER(algorithm: Algorithm | HashedAlgorithm): ArrayBuffer | null {
    switch (algorithm.name.toUpperCase()) {
      case "SHA-1":
        return ber_sha1;
      case "SHA-256":
        return ber_sha256;
      case "SHA-384":
        return ber_sha384;
      case "SHA-512":
        return ber_sha512;
    }

    return null;
  },

  fromBER(raw: ArrayBuffer): Algorithm | null {
    const asn = asn1js.fromBER(raw);
    const algorithmIdentifier = new pkijs.AlgorithmIdentifier({ schema: asn.result });

    switch (algorithmIdentifier.algorithmId) {
      case id_sha1:
        return { name: "SHA-1" };
      case id_sha256:
        return { name: "SHA-256" };
      case id_sha384:
        return { name: "SHA-384" };
      case id_sha512:
        return { name: "SHA-512" };
    }

    return null;
  },

};

AlgorithmFactory.register(shaAlgorithmConverter);
