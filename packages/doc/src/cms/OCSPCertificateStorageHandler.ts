import { X509Certificate, X509Certificates } from "@peculiar/x509";
import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";
import type { OCSP } from "./OCSP";

export class OCSPCertificateStorageHandler extends DefaultCertificateStorageHandler {
  public constructor(private ocsp: OCSP) {
    super();

    this.certificates = new X509Certificates(
      (ocsp.certificates || []) as X509Certificate[]
    );
  }
}
