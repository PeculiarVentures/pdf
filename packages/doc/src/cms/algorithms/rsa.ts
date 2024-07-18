import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import { AlgorithmFactory, AlgorithmConverter, HashedAlgorithm } from "../AlgorithmFactory";

const id_pkcs_1 = "1.2.840.113549.1.1";
const id_rsaEncryption = `${id_pkcs_1}.1`;
const id_sha1WithRSAEncryption = `${id_pkcs_1}.5`;
const id_sha256WithRSAEncryption = `${id_pkcs_1}.11`;
const id_sha384WithRSAEncryption = `${id_pkcs_1}.12`;
const id_sha512WithRSAEncryption = `${id_pkcs_1}.13`;
const id_rsaPSS = `${id_pkcs_1}.10`;

const ber_rsaEncryption = Convert.FromHex("300d06092a864886f70d0101010500");
const ber_sha1WithRSAEncryption = Convert.FromHex("300d06092a864886f70d0101050500");
const ber_sha256WithRSAEncryption = Convert.FromHex("300d06092a864886f70d01010b0500");
const ber_sha384WithRSAEncryption = Convert.FromHex("300d06092a864886f70d01010c0500");
const ber_sha512WithRSAEncryption = Convert.FromHex("300d06092a864886f70d01010d0500");
const ber_rsaPSS = Convert.FromHex("300d06092a864886f70d01010a0500");

export const rsaAlgorithmConverter: AlgorithmConverter = {
  name: "RSA",
  toBER(algorithm: Algorithm | HashedAlgorithm): ArrayBuffer | null {
    switch (algorithm.name.toUpperCase()) {
      case "RSASSA-PKCS1-V1_5": {
        if ("hash" in algorithm) {
          switch (algorithm.hash.name) {
            case "SHA-1":
              return ber_sha1WithRSAEncryption;
            case "SHA-256":
              return ber_sha256WithRSAEncryption;
            case "SHA-384":
              return ber_sha384WithRSAEncryption;
            case "SHA-512":
              return ber_sha512WithRSAEncryption;
          }
        } else {
          return ber_rsaEncryption;
        }
        break;
      }
      case "RSA-PSS": {
        return ber_rsaPSS;
      }
    }

    return null;
  },

  fromBER(raw: ArrayBuffer): Algorithm | HashedAlgorithm | null {
    const asn = asn1js.fromBER(raw);
    const algorithmIdentifier = new pkijs.AlgorithmIdentifier({ schema: asn.result });

    switch (algorithmIdentifier.algorithmId) {
      case id_rsaEncryption:
        return { name: "RSASSA-PKCS1-v1_5" };
      case id_sha1WithRSAEncryption:
        return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-1" } };
      case id_sha256WithRSAEncryption:
        return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } };
      case id_sha384WithRSAEncryption:
        return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } };
      case id_sha512WithRSAEncryption:
        return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } };
      case id_rsaPSS:
        return { name: "RSA-PSS" };
    }

    return null;
  },

};

AlgorithmFactory.register(rsaAlgorithmConverter);
