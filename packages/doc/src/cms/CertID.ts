import { X509Certificate } from "@peculiar/x509";
import { Convert } from "pvtsutils";
import * as pkijs from "pkijs";

import { AsnEncoded } from "./AsnEncoded";

export class CertificateID extends AsnEncoded<CertID> {
  public static DEFAULT_VIEW = new Uint8Array(0);

  public static async create(algorithm: AlgorithmIdentifier, cert: X509Certificate, issuer: X509Certificate): Promise<CertificateID> {
    const pkiCertId = new pkijs.CertID();
    await pkiCertId.createForCertificate(PKIUtils.x509ToCert(cert), {
      hashAlgorithm: typeof (algorithm) === "string"
        ? algorithm
        : algorithm.name,
      issuerCertificate: PKIUtils.x509ToCert(issuer),
    });

    const res = new CertificateID();
    res.fromSchema(pkiCertId);

    return res;
  }

  public get hashAlgorithm(): Algorithm {
    const raw = this.asn.hashAlgorithm.toSchema().toBER();

    return AlgorithmFactory.fromBER(raw);
  }
  public get issuerNameHash(): ArrayBuffer {
    return this.asn.issuerNameHash.valueBlock.valueHex;
  }

  public get issuerKeyHash(): ArrayBuffer {
    return this.asn.issuerKeyHash.valueBlock.valueHex;
  }

  public get serialNumber(): string {
    return Convert.ToHex(this.asn.serialNumber.valueBlock.valueHex);
  }

  protected onFromSchema(schema: any): any {
    if (schema instanceof pkijs.CertID) {
      return schema;
    }

    return new pkijs.CertID({ schema });
  }

  public equal(certId: CertificateID): boolean {
    return this.asn.isEqual(certId.asn);
  }

}

import { PKIUtils } from "./PKIUtils";
import { AlgorithmFactory } from "./AlgorithmFactory";

import type { CertID } from "./PKITypes";
