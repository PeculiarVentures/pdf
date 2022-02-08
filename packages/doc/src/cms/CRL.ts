import { X509Certificate, Name } from "@peculiar/x509";

const pkijs = require("pkijs");

import { AsnEncoded } from "./AsnEncoded";

export class CRL extends AsnEncoded {

  protected onFromSchema(schema: any): any {
    if (schema instanceof pkijs.CertificateRevocationList) {
      this.asn = schema;
      
      return schema;
    }

    return new pkijs.CertificateRevocationList({ schema });
  }

  public get issuer(): string {
    const issuerRaw = this.asn.issuer.toSchema().toBER();
    
    return new Name(issuerRaw).toString();
  }

  public async verify(issuer: X509Certificate): Promise<boolean> {
    try {
      return this.asn.verify({
        issuerCertificate: PKIUtils.x509ToCert(issuer),
      });
    } catch(e) {
      return false;
    }
  }

}

import { PKIUtils } from "./PKIUtils";
