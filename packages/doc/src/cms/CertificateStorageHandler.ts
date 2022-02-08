import { X509Certificate } from "@peculiar/x509";

import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";

export class CmsCertificateStorageHandler extends DefaultCertificateStorageHandler {

  public constructor(public cms: CMSSignedData) {
    super();
  }

  public override findCertificate(serialNumber: BufferSource, issuer: BufferSource): Promise<X509Certificate | null>;
  public override findCertificate(spki: BufferSource): Promise<X509Certificate | null>;
  public override async findCertificate(serialNumber: any, issuer?: any): Promise<X509Certificate | null> {
    const certs: X509Certificate[] = [...this.certificates, ...this.cms.certificates];
    for (const cert of certs) {
      const ok = await this.matchCertificate(cert, serialNumber, issuer);
      if (ok) {
        return cert;
      }
    }

    return null;
  }

}

import type { CMSSignedData } from "./SignedData";
