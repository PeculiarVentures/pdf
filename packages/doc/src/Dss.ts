import * as core from "@peculiarventures/pdf-core";
import * as cms from "./cms";
import { X509Certificate } from "@peculiar/x509";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import { PDFDocument, PDFVersion } from "./Document";
import { WrapObject } from "./WrapObject";

export class Dss extends WrapObject<core.DocumentSecurityStoreDictionary> {

  #certs: X509Certificate[] = [];
  #crls: cms.CRL[] = [];
  #ocsps: cms.OCSP[] = [];

  constructor(target: core.DocumentSecurityStoreDictionary, document: PDFDocument) {
    super(target, document);

    if (target.Certs.has()) {
      const _certs = this.#certs;
      for (const cert of target.Certs.get()) {
        if (cert instanceof core.PDFStream) {
          const objCert = new X509Certificate(cert.decodeSync());
          _certs.push(objCert);
        }
      }
    }
    if (target.CRLs.has()) {
      const _crls = this.#crls;
      for (const crl of target.CRLs.get()) {
        if (crl instanceof core.PDFStream) {
          try {
            const objCrl = cms.CRL.fromBER(crl.decodeSync());
            _crls.push(objCrl);
          } catch {
            // nothing
          }
        }
      }
    }
    if (target.OCSPs.has()) {
      const _ocsps = this.#ocsps;
      for (const ocsp of target.OCSPs.get()) {
        if (ocsp instanceof core.PDFStream) {
          try {
            const data = ocsp.decodeSync();
            const objOcsp = cms.OCSP.fromOCSPResponse(data);
            _ocsps.push(objOcsp);
          } catch {
            // nothing
          }
        }
      }
    }
  }

  public get certs(): ReadonlyArray<X509Certificate> {
    return this.#certs;
  }

  public get crls(): ReadonlyArray<cms.CRL> {
    return this.#crls;
  }

  public get ocsps(): ReadonlyArray<cms.OCSP> {
    return this.#ocsps;
  }

  public static get(document: PDFDocument): Dss {
    const catalog = document.target.update.catalog;
    if (catalog && catalog.DSS) {
      return new Dss(catalog.DSS, document);
    }
    const dss = core.DocumentSecurityStoreDictionary.create(document.target.update);

    return new Dss(dss, document);
  }

  private addToCatalog() {
    const catalog = this.document.target.update.catalog;
    if (catalog && !catalog.DSS) {
      if (this.document.version !== PDFVersion.v2_0) {
        const extensions = catalog.Extensions.get();
        if (!extensions.ADBE.has()) {
          const adbe = extensions.ADBE.get();
          adbe.BaseVersion = "1.7";
          adbe.ExtensionLevel = 5;
        }
      }

      catalog.DSS = this.target.makeIndirect();
    }
  }

  public add(view: BufferSource | X509Certificate | cms.CRL | cms.OCSP, vri?: string): void {
    this.addToCatalog();

    if (BufferSourceConverter.isBufferSource(view)) {
      try {
        const cert = new X509Certificate(view);
        this.pushCert(cert, vri);
      } catch {
        try {
          const crl = cms.CRL.fromBER(view);
          this.pushCrl(crl, vri);
        } catch {
          try {
            const ocsp = cms.OCSP.fromBER(view);
            this.pushOcsp(ocsp, vri);
          } catch {
            throw new Error("Unsupported type");
          }
        }
      }
    } else if (view instanceof X509Certificate) {
      this.pushCert(view, vri);
    } else if (view instanceof cms.CRL) {
      this.pushCrl(view, vri);
    } else if (view instanceof cms.OCSP) {
      this.pushOcsp(view, vri);
    }
  }

  public addTimeStamp(token: cms.TimeStampToken | BufferSource, signatureThumbprint: string): void {
    signatureThumbprint = signatureThumbprint.toUpperCase();

    if (BufferSourceConverter.isBufferSource(token)) {
      return this.addTimeStamp(cms.TimeStampToken.fromBER(token), signatureThumbprint);
    }

    this.addToCatalog();
    let vri = this.findVri(signatureThumbprint);
    if (!vri) {
      vri = core.ValidationRelatedInformationDictionary.create(this.document.target);
      this.target.VRI.get().set(signatureThumbprint, vri);
    }

    vri.TS = this.document.target.createStream(token.toBER());
  }

  public findVri(signatureThumbprint: string): core.ValidationRelatedInformationDictionary | null {
    if (this.document.dss.target.VRI.has()) {
      const vri = this.document.dss.target.VRI.get();
      if (vri.has(signatureThumbprint)) {
        return vri.get(signatureThumbprint, core.ValidationRelatedInformationDictionary);
      }
    }

    return null;
  }

  private createPDFStream(view: BufferSource): core.PDFStream {
    const obj = core.PDFStream.create(this.document.target.update);
    obj.stream = BufferSourceConverter.toUint8Array(view);

    return obj;
  }

  private pushCert(cert: X509Certificate, vri?: string): core.PDFStream {
    let stream: core.PDFStream | null = null;
    const certsArray = this.target.Certs.get();
    for (const item of certsArray) {
      if (item instanceof core.PDFStream && BufferSourceConverter.isEqual(item.decodeSync(), cert.rawData)) {
        stream = item;
        break;
      }
    }

    if (!stream) {
      stream = this.createPDFStream(cert.rawData).makeIndirect();
      certsArray.push(stream);
      this.#certs.push(cert);
    }

    if (vri) {
      vri = vri.toUpperCase();
      const vriDict = this.target.VRI.get();
      const vriItemDict = (vriDict.has(vri))
        ? vriDict.get(vri, core.ValidationRelatedInformationDictionary, true)
        : core.ValidationRelatedInformationDictionary.create(this.document.target.update);
      // TODO Dont push the same values
      vriItemDict.Cert.get().push(stream);

      vriDict.set(vri, vriItemDict);
    }

    return stream;
  }

  private pushCrl(crl: cms.CRL, vri?: string): core.PDFStream {
    let stream: core.PDFStream | null = null;
    const crlArray = this.target.CRLs.get();
    for (const item of crlArray) {
      if (item instanceof core.PDFStream && BufferSourceConverter.isEqual(item.decodeSync(), crl.toBER())) {
        stream = item;
        break;
      }
    }

    if (!stream) {
      stream = this.createPDFStream(crl.toBER()).makeIndirect();
      crlArray.push(stream);
      this.#crls.push(crl);
    }

    if (vri) {
      vri = vri.toUpperCase();
      const vriDict = this.target.VRI.get();
      const vriItemDict = (vriDict.has(vri))
        ? vriDict.get(vri, core.ValidationRelatedInformationDictionary, true)
        : core.ValidationRelatedInformationDictionary.create(this.document.target.update);
      vriItemDict.CRL.get().push(stream);

      vriDict.set(vri, vriItemDict);
    }

    return stream;
  }

  private pushOcsp(ocsp: cms.OCSP, vri?: string): core.PDFStream {
    let stream: core.PDFStream | null = null;
    const ocspArray = this.target.OCSPs.get();
    const ocspResp = ocsp.toOCSPResponse();
    for (const item of ocspArray) {
      if (item instanceof core.PDFStream && BufferSourceConverter.isEqual(item.decodeSync(), ocspResp)) {
        stream = item;
        break;
      }
    }

    if (!stream) {
      // Get OCSPBasic
      stream = this.createPDFStream(ocspResp).makeIndirect();
      ocspArray.push(stream);
      this.#ocsps.push(ocsp);
    }

    if (vri) {
      vri = vri.toUpperCase();
      const vriDict = this.target.VRI.get();
      const vriItemDict = (vriDict.has(vri))
        ? vriDict.get(vri, core.ValidationRelatedInformationDictionary, true)
        : core.ValidationRelatedInformationDictionary.create(this.document.target.update);
      vriItemDict.OCSP.get().push(stream);

      vriDict.set(vri, vriItemDict);
    }

    return stream;
  }
}
