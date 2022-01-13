const pkijs = require("pkijs");
import { isEqualBuffer } from "pvutils";
import { ICertificateStorageHandler, IResult } from "./ICertificateStorageHandler";
import { SubjectKeyIdentifierExtension, X509Certificate, X509Certificates } from "@peculiar/x509";
import { BufferSourceConverter, Convert } from "pvtsutils";
import { PKIUtils } from "./PKIUtils";
import { CRL } from "./CRL";
import { OCSP } from "./OCSP";
import { IsTrustedResult } from ".";

export class DefaultCertificateStorageHandler implements ICertificateStorageHandler {

  public parent: ICertificateStorageHandler | null = null;

  public static async getSKI(cert: X509Certificate): Promise<ArrayBuffer> {
    const skiExt = cert.getExtension(SubjectKeyIdentifierExtension);
    if (skiExt) {
      return Convert.FromHex(skiExt.keyId);
    }
    // compute SHA-1 digest from certificate's public key
    const crypto = pkijs.getCrypto() as Crypto;

    return cert.publicKey.getKeyIdentifier(crypto);
  }

  public static async isIssuerCertificate(leaf: X509Certificate, issuer: X509Certificate): Promise<boolean> {
    // leaf certificate's issuer name must be equal to issuer's subject name
    if (leaf.issuer !== issuer.subject) {
      return false;
    }

    const akiExt = PKIUtils.findExtension(PKIUtils.x509ToCert(leaf), PKIUtils.AUTHORITY_KEY_IDENTIFIER);
    if (akiExt) {
      const issuerSKI = await DefaultCertificateStorageHandler.getSKI(issuer);
      if ("keyIdentifier" in akiExt.parsedValue) {
        if (!isEqualBuffer(akiExt.parsedValue.keyIdentifier.valueBlock.valueHex, issuerSKI)) {
          return false;
        }
      } else if ("authorityCertIssuer" in akiExt.parsedValue
        && "authorityCertSerialNumber" in akiExt.parsedValue) {
        const pkiIssuer = PKIUtils.x509ToCert(issuer);
        const { authorityCertIssuer, authorityCertSerialNumber } = akiExt.parsedValue;
        if (!(pkiIssuer.subject.isEqual(authorityCertIssuer)
          && pkiIssuer.serialNumber.isEqual(authorityCertSerialNumber))) {
          return false;
        }
      }
    }

    try {
      const res = await leaf.verify({
        publicKey: issuer,
        signatureOnly: true,
      });
      
      return res;
    } catch {
      return false;
    }
  }

  public certificates = new X509Certificates();
  public crls: CRL[] = [];
  public ocsps: OCSP[] = [];

  public findCertificate(serialNumber: BufferSource, issuer: BufferSource): Promise<X509Certificate | null>;
  public findCertificate(spki: BufferSource): Promise<X509Certificate | null>;
  public async findCertificate(serialNumber: any, issuer?: any): Promise<X509Certificate | null> {
    if (this.parent) {
      const cert = await this.parent.findCertificate(serialNumber, issuer);
      if (cert) {
        return cert;
      }
    }

    for (const cert of this.certificates) {
      const ok = await this.matchCertificate(cert, serialNumber, issuer);
      if (ok) {
        return cert;
      }
    }

    return null;
  }

  public matchCertificate(cert: X509Certificate, serialNumber: BufferSource, issuer: BufferSource): Promise<boolean>;
  public matchCertificate(cert: X509Certificate, spki: BufferSource): Promise<boolean>;
  // @internal
  public matchCertificate(cert: X509Certificate, serialNumber: any, issuer?: any): Promise<boolean>;
  public async matchCertificate(cert: X509Certificate, serialNumber: any, issuer?: any): Promise<boolean> {
    if (serialNumber && issuer) {
      // serial number and issuer
      serialNumber = BufferSourceConverter.toArrayBuffer(serialNumber);
      issuer = BufferSourceConverter.toArrayBuffer(issuer);

      const pkiCert = PKIUtils.x509ToCert(cert);
      if (isEqualBuffer(pkiCert.serialNumber.valueBlock.valueHex, serialNumber)
        && isEqualBuffer(pkiCert.issuer.valueBeforeDecode, issuer)) {
        return true;
      }
    } else {
      // spki
      serialNumber = BufferSourceConverter.toArrayBuffer(serialNumber);
      const ski = await DefaultCertificateStorageHandler.getSKI(cert);

      if (isEqualBuffer(ski, serialNumber)) {
        return true;
      }
    }

    return false;
  }

  public async findIssuer(cert: X509Certificate): Promise<X509Certificate | null> {
    if (this.parent) {
      const issuerCert = await this.parent.findIssuer(cert);
      if (issuerCert) {
        return issuerCert;
      }
    }

    let issuerCert: X509Certificate | null = null;
    // Self-signed certificate
    if (await cert.isSelfSigned()) {
      issuerCert = cert;
    } else {
      for (const item of this.certificates) {
        const isIssuer = await DefaultCertificateStorageHandler.isIssuerCertificate(cert, item);
        if (isIssuer) {
          issuerCert = item;
          break;
        }
      }
    }

    return issuerCert;
  }

  public async isTrusted(cert: X509Certificate): Promise<IsTrustedResult> {
    if (this.parent) {
      const trusted = await this.parent.isTrusted(cert);
      if (trusted) {
        return trusted;
      }
    }

    return {
      target: this,
      result: false,
    };
  }

  public async findCRL(cert: X509Certificate): Promise<IResult<CRL | null>> {
    if (this.parent) {
      const res = await this.parent.findCRL(cert);
      if (res.result) {
        return res;
      }
    }

    // Looking for the crl in internal items
    for (const crl of this.crls) {
      const issuer = await this.findIssuer(cert);
      if (issuer && issuer.subject === crl.issuer) {
        const ok = await crl.verify(issuer);
        if (ok) {
          return {
            result: crl,
            target: this,
          };
        }
      }
    }

    return {
      result: null,
      target: this,
    };
  }

  public async findOCSP(cert: X509Certificate): Promise<IResult<OCSP | null>> {
    if (this.parent) {
      const result = await this.parent.findOCSP(cert);

      if (result) {
        return result;
      }
    }

    return {
      target: this,
      result: null,
    };
  }
}
