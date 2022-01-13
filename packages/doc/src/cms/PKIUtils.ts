import { X509Certificate } from "@peculiar/x509";
import { AsnEncoded } from "./AsnEncoded";
import { Certificate, Extension } from "./PKITypes";

const pkijs = require("pkijs");

class PKICertificate extends AsnEncoded {

  protected onFromSchema(schema: any) {
    return new pkijs.Certificate({ schema });
  }

}

export class PKIUtils {

  public static AUTHORITY_KEY_IDENTIFIER = "2.5.29.35";
  public static SUBJECT_KEY_IDENTIFIER = "2.5.29.14";

  public static x509ToCert(x509Cert: X509Certificate): Certificate {
    const pkiCert = PKICertificate.fromBER(x509Cert.rawData);

    return pkiCert.asn;
  }

  public static certTox509(cert: Certificate): X509Certificate {
    const pkiCert = new PKICertificate();
    pkiCert.asn = cert;
    const raw = pkiCert.toBER();

    return new X509Certificate(raw);
  }

  public static findExtension(cert: Certificate, extnID: string): Extension | null {
    if (cert.extensions) {
      for (const extension of cert.extensions) {
        if (extension.extnID === extnID) {
          return extension;
        }
      }
    }

    return null;
  }

}
