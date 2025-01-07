import {
  RsaSaPssParams,
  sha1,
  sha256,
  sha384,
  sha512,
  id_sha1,
  id_sha256,
  id_sha384,
  id_sha512
} from "@peculiar/asn1-rsa";
import { AlgorithmIdentifier } from "@peculiar/asn1-x509";
import { AsnConvert } from "@peculiar/asn1-schema";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import {
  AlgorithmFactory,
  AlgorithmConverter,
  HashedAlgorithm
} from "../AlgorithmFactory";

const id_pkcs_1 = "1.2.840.113549.1.1";
const id_rsaEncryption = `${id_pkcs_1}.1`;
const id_sha1WithRSAEncryption = `${id_pkcs_1}.5`;
const id_sha256WithRSAEncryption = `${id_pkcs_1}.11`;
const id_sha384WithRSAEncryption = `${id_pkcs_1}.12`;
const id_sha512WithRSAEncryption = `${id_pkcs_1}.13`;
const id_rsaPSS = `${id_pkcs_1}.10`;
const id_mgf1 = `${id_pkcs_1}.8`;

const ber_rsaEncryption = Convert.FromHex("300d06092a864886f70d0101010500");
const ber_sha1WithRSAEncryption = Convert.FromHex(
  "300d06092a864886f70d0101050500"
);
const ber_sha256WithRSAEncryption = Convert.FromHex(
  "300d06092a864886f70d01010b0500"
);
const ber_sha384WithRSAEncryption = Convert.FromHex(
  "300d06092a864886f70d01010c0500"
);
const ber_sha512WithRSAEncryption = Convert.FromHex(
  "300d06092a864886f70d01010d0500"
);

function getHashAlgorithmIdentifier(
  hashAlgorithmName: string
): AlgorithmIdentifier {
  switch (hashAlgorithmName.toUpperCase()) {
    case "SHA-1":
      return sha1;
    case "SHA-256":
      return sha256;
    case "SHA-384":
      return sha384;
    case "SHA-512":
      return sha512;
    default:
      throw new Error(`Unsupported hash algorithm: ${hashAlgorithmName}`);
  }
}

function prepareRsaSsaParams(algorithm: HashedAlgorithm): ArrayBuffer {
  switch (algorithm.hash.name.toUpperCase()) {
    case "SHA-1":
      return ber_sha1WithRSAEncryption;
    case "SHA-256":
      return ber_sha256WithRSAEncryption;
    case "SHA-384":
      return ber_sha384WithRSAEncryption;
    case "SHA-512":
      return ber_sha512WithRSAEncryption;
    default:
      return ber_rsaEncryption;
  }
}

function prepareRsaPssParams(algorithm: HashedAlgorithm): ArrayBuffer {
  const params = new RsaSaPssParams();
  const algorithmIdentifier = new AlgorithmIdentifier({
    algorithm: id_rsaPSS
  });

  if ("saltLength" in algorithm && typeof algorithm.saltLength === "number") {
    params.saltLength = algorithm.saltLength;
  }

  if ("hash" in algorithm) {
    const hashAlgorithm = getHashAlgorithmIdentifier(algorithm.hash.name);
    if (hashAlgorithm) {
      params.hashAlgorithm = hashAlgorithm;
      params.maskGenAlgorithm = new AlgorithmIdentifier({
        algorithm: id_mgf1,
        parameters: AsnConvert.serialize(hashAlgorithm)
      });
    }
  }

  algorithmIdentifier.parameters = AsnConvert.serialize(params);

  return AsnConvert.serialize(algorithmIdentifier);
}

export const rsaAlgorithmConverter: AlgorithmConverter = {
  name: "RSA",
  toBER(algorithm: Algorithm | HashedAlgorithm): ArrayBuffer | null {
    switch (algorithm.name.toUpperCase()) {
      case "RSASSA-PKCS1-V1_5":
        return prepareRsaSsaParams(algorithm as HashedAlgorithm);
      case "RSA-PSS":
        return prepareRsaPssParams(algorithm as HashedAlgorithm);
      default:
        return null;
    }
  },
  fromBER(raw: ArrayBuffer): Algorithm | HashedAlgorithm | RsaPssParams | null {
    const asn = asn1js.fromBER(raw);
    const algorithmIdentifier = new pkijs.AlgorithmIdentifier({
      schema: asn.result
    });

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
      case id_rsaPSS: {
        if (!algorithmIdentifier.algorithmParams) {
          return { name: "RSA-PSS" };
        }
        const rsaPssParams = AsnConvert.parse(
          algorithmIdentifier.algorithmParams.valueBeforeDecode,
          RsaSaPssParams
        );
        const hashAlgorithm = rsaPssParams.hashAlgorithm.algorithm;
        const saltLength = rsaPssParams.saltLength;

        switch (hashAlgorithm) {
          case id_sha1:
            return { name: "RSA-PSS", hash: { name: "SHA-1" }, saltLength };
          case id_sha256:
            return { name: "RSA-PSS", hash: { name: "SHA-256" }, saltLength };
          case id_sha384:
            return { name: "RSA-PSS", hash: { name: "SHA-384" }, saltLength };
          case id_sha512:
            return { name: "RSA-PSS", hash: { name: "SHA-512" }, saltLength };
          default:
            return { name: "RSA-PSS", hash: { name: "SHA-1" }, saltLength };
        }
      }
      default:
        return null;
    }
  }
};

AlgorithmFactory.register(rsaAlgorithmConverter);
