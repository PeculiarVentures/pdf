import { X509Certificate } from "@peculiar/x509";
import { BufferSource, BufferSourceConverter, } from "pvtsutils";

const asn1js = require("asn1js");
const pkijs = require("pkijs");

import { AsnEncoded } from "./AsnEncoded";

export class OCSP extends AsnEncoded implements ICertificateStorage {
  
  public certificateHandler: ICertificateStorageHandler;

  constructor() {
    super();

    this.certificateHandler = new DefaultCertificateStorageHandler();
  }

  public toOCSPResponse(): ArrayBuffer {
    const ocspRespSimpl = new pkijs.OCSPResponse();
    ocspRespSimpl.responseStatus.valueBlock.valueDec = 0; // success
    const responseBytes = ocspRespSimpl.responseBytes = new pkijs.ResponseBytes();
    responseBytes.responseType = "1.3.6.1.5.5.7.48.1.1";
    responseBytes.response = new asn1js.OctetString({ valueHex: this.toBER() });

    return ocspRespSimpl.toSchema().toBER(false);
  }

  public static fromOCSPResponse(data: BufferSource | OCSPResponse): OCSP {
    const ocspResp: OCSPResponse = (BufferSourceConverter.isBufferSource(data))
      ? new pkijs.OCSPResponse({ schema: asn1js.fromBER(BufferSourceConverter.toArrayBuffer(data)).result })
      : data;

    if (ocspResp.responseBytes.responseType === "1.3.6.1.5.5.7.48.1.1") {
      const asnBasicResp = asn1js.fromBER(ocspResp.responseBytes.response.valueBlock.valueHex);
      const basicOcsp = new pkijs.BasicOCSPResponse({ schema: asnBasicResp.result });

      return OCSP.fromSchema(basicOcsp);
    } else {
      throw new Error("Incorrect OCSP response");
    }
  }

  #certificates?: X509Certificate[];
  public get certificates(): ReadonlyArray<X509Certificate> {
    if (!this.#certificates) {
      this.#certificates = [];

      for (const cert of this.asn.certs) {
        this.#certificates.push(PKIUtils.certTox509(cert));
      }
    }

    return this.#certificates;
  }

  protected onFromSchema(schema: any): any {
    if (schema instanceof pkijs.BasicOCSPResponse) {
      this.asn = schema;

      return schema;
    }

    return new pkijs.BasicOCSPResponse({ schema });
  }

  public get signatureAlgorithm(): Algorithm {
    const raw = this.asn.signatureAlgorithm.toSchema().toBER();

    return AlgorithmFactory.fromBER(raw);
  }

  public get signatureValue(): ArrayBuffer {
    return this.asn.signature.valueBlock.valueHex;
  }

  public async verify(issuer: X509Certificate): Promise<boolean> {
    const issuerPublicKey = await issuer.publicKey.export(this.signatureAlgorithm, ["verify"]);
    const ok = await pkijs.getEngine().subtle.verify(this.signatureAlgorithm, issuerPublicKey, this.signatureValue, this.asn.tbsResponseData.tbs);

    return ok;
  }

}

import { AlgorithmFactory } from "./AlgorithmFactory";
import { PKIUtils } from "./PKIUtils";
import { DefaultCertificateStorageHandler } from "./DefaultCertificateStorageHandler";

import type { ICertificateStorage, ICertificateStorageHandler } from "./ICertificateStorageHandler";
import type { OCSPResponse } from "./PKITypes";

