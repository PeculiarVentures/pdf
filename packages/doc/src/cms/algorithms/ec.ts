import * as asn1js from "asn1js";
const pkijs = require("pkijs");
import { Convert } from "pvtsutils";
import { AlgorithmFactory, AlgorithmConverter, HashedAlgorithm } from "../AlgorithmFactory";

const id_group = "1.2.840.10045.4";
const id_sha1WithECDSA = `${id_group}.1`;
const id_sha256WithECDSA = `${id_group}.3.2`;
const id_sha384WithECDSA = `${id_group}.3.3`;
const id_sha512WithECDSA = `${id_group}.3.4`;

const ber_sha1WithECDSA = Convert.FromHex("300b06072a8648ce3d04010500");
const ber_sha256WithECDSA = Convert.FromHex("300c06082a8648ce3d0403020500");
const ber_sha384WithECDSA = Convert.FromHex("300c06082a8648ce3d0403030500");
const ber_sha512WithECDSA = Convert.FromHex("300c06082a8648ce3d0403040500");

export const ecAlgorithmConverter: AlgorithmConverter = {
  name: "EC",
  toBER(algorithm: Algorithm | HashedAlgorithm): ArrayBuffer | null {
    switch (algorithm.name.toUpperCase()) {
      case "ECDSA": {
        if ("hash" in algorithm) {
          switch (algorithm.hash.name) {
            case "SHA-1":
              return ber_sha1WithECDSA;
            case "SHA-256":
              return ber_sha256WithECDSA;
            case "SHA-384":
              return ber_sha384WithECDSA;
            case "SHA-512":
              return ber_sha512WithECDSA;
          }
        }
      }
    }

    return null;
  },

  fromBER(raw: ArrayBuffer): HashedAlgorithm | null {
    const asn = asn1js.fromBER(raw);
    const algorithmIdentifier = new pkijs.AlgorithmIdentifier({ schema: asn.result });

    switch (algorithmIdentifier.algorithmId) {
      case id_sha1WithECDSA:
        return { name: "ECDSA", hash: { name: "SHA-1" } };
      case id_sha256WithECDSA:
        return { name: "ECDSA", hash: { name: "SHA-256" } };
      case id_sha384WithECDSA:
        return { name: "ECDSA", hash: { name: "SHA-384" } };
      case id_sha512WithECDSA:
        return { name: "ECDSA", hash: { name: "SHA-512" } };
    }

    return null;
  },

};

AlgorithmFactory.register(ecAlgorithmConverter);
