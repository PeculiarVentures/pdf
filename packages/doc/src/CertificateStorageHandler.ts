import * as core from "@peculiarventures/pdf-core";
import { CMSSignedData, DefaultCertificateStorageHandler, ICertificateStorageHandler } from "./cms";
import { type PDFDocument } from "./Document";
import { X509Certificate, X509Certificates } from "@peculiar/x509";

export interface IPdfCertificateStorageHandler extends ICertificateStorageHandler {
  document: PDFDocument;
  load(): Promise<void>;
}

export class PDFCertificateStorageHandler extends DefaultCertificateStorageHandler implements IPdfCertificateStorageHandler {

  constructor(public document: PDFDocument) {
    super();
  }

  public async load(): Promise<void> {
    await this.loadCertificates();
    await this.loadCRLs();
    await this.loadOCSPs();
  }

  protected findDSS(): core.DocumentSecurityStoreDictionary | null {
    const update = this.document.target.update;
    if (update.catalog
      && update.catalog.DSS) { // TODO Check version of PDF. Must be 2.0
      return update.catalog.DSS;
    }

    return null;
  }

  protected async loadCertificates(): Promise<void> {
    // Reset certificates
    this.certificates = new X509Certificates();

    await this.loadCertificatesFromDSS();
    // this.loadCertificatesFromSignatures();
  }

  protected async loadCertificatesFromDSS(): Promise<void> {
    const dss = this.findDSS();
    if (dss && dss.Certs.has()) {
      for (const cert of dss.Certs.get()) {
        if (cert instanceof core.PDFStream) {
          const certStream = await cert.decode();

          this.certificates.push(new X509Certificate(certStream));
        }
      }
    }
  }

  protected loadCertificatesFromSignatures(): void {
    const catalog = this.document.target.update.catalog;

    if (catalog && catalog.AcroForm.has()) {
      const acroForm = catalog.AcroForm.get();
      if (acroForm.SigFlags) {
        for (const field of acroForm.Fields) {
          if (field instanceof core.PDFDictionary && field.has("FT")) {
            const fieldType = field.get("FT", core.PDFName).text;
            if (fieldType === core.SignatureField.FIELD_TYPE) {
              if (field.has("V")) {
                const sigValue = field.get("V", core.SignatureDictionary);
                if (sigValue.Contents.text) {
                  const cms = CMSSignedData.fromBER(sigValue.Contents.data);
                  this.certificates.push(...cms.certificates);
                }
              }
            }
          }
        }
      }
    }
  }

  protected async loadCRLs(): Promise<void> {
    this.crls = [...this.document.dss.crls];
  }

  protected async loadOCSPs(): Promise<void> {
    this.ocsps = [...this.document.dss.ocsps];
  }

}
