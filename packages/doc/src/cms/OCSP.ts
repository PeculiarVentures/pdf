import * as asnOcsp from "@peculiar/asn1-ocsp";
import {
  AlgorithmIdentifier,
  CRLReason,
  CRLReasons,
  Name
} from "@peculiar/asn1-x509";
import * as asnSchema from "@peculiar/asn1-schema";
import * as x509 from "@peculiar/x509";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import {
  ICertificateStorage,
  ICertificateStorageHandler
} from "./ICertificateStorageHandler";
import { AsnEncoded } from "./AsnEncoded";

export interface OCSPResponse {
  certId: CertificateID;
  status:
    | {
        type: "good";
      }
    | {
        type: "revoked";
        revocationTime: Date;
        reason?: keyof typeof CRLReasons;
      }
    | {
        type: "unknown";
      };
  thisUpdate?: Date;
  nextUpdate?: Date;
}

export interface OCSPCreateParams {
  signingAlgorithm: Algorithm;
  signingKey: CryptoKey;
  issuer: x509.X509Certificate;
  responses: OCSPResponse[];
  producedAt?: Date;
}

export class OCSP
  extends AsnEncoded<pkijs.BasicOCSPResponse>
  implements ICertificateStorage
{
  public static async create(params: OCSPCreateParams): Promise<OCSP> {
    const singleResponses = params.responses.map((response) => {
      const certStatus = {
        good: response.status.type === "good" ? null : undefined,
        revoked:
          response.status.type === "revoked"
            ? new asnOcsp.RevokedInfo({
                revocationTime: new Date(),
                revocationReason: response.status.reason
                  ? new CRLReason(CRLReasons[response.status.reason])
                  : undefined
              })
            : undefined,
        unknown: response.status.type === "unknown" ? null : undefined
      };

      return new asnOcsp.SingleResponse({
        certID: asnSchema.AsnConvert.parse(
          response.certId.toBER(),
          asnOcsp.CertID
        ),
        certStatus: new asnOcsp.CertStatus(certStatus),
        thisUpdate: response.thisUpdate,
        nextUpdate: response.nextUpdate
      });
    });
    const responseData = new asnOcsp.ResponseData({
      version: 0,
      responderID: new asnOcsp.ResponderID({
        byName: asnSchema.AsnConvert.parse(
          params.issuer.subjectName.toArrayBuffer(),
          Name
        )
      }),
      producedAt: params.producedAt || new Date(),
      responses: singleResponses
    });
    const responseDataRaw = asnSchema.AsnConvert.serialize(responseData);
    const crypto = pkijs.getCrypto(true);
    const signingAlgorithm = {
      ...params.signingAlgorithm,
      ...params.signingKey.algorithm
    };
    const signature = await crypto.signWithPrivateKey(
      responseDataRaw,
      params.signingKey,
      {
        algorithm: signingAlgorithm
      }
    );

    // convert algorithm to ASN.1
    const signatureAlgorithm = AlgorithmFactory.toBER(signingAlgorithm);

    const basicOcsp = new asnOcsp.BasicOCSPResponse({
      tbsResponseData: responseData,
      signatureAlgorithm: asnSchema.AsnConvert.parse(
        signatureAlgorithm,
        AlgorithmIdentifier
      ),
      signature
    });
    const basicOcspRaw = asnSchema.AsnConvert.serialize(basicOcsp);
    const ocsp = OCSP.fromBER(basicOcspRaw);

    // verify signature
    const ok = await ocsp.verify(params.issuer);
    if (!ok) {
      throw new Error("OCSP signature is invalid");
    }

    return ocsp;
  }

  private _certificateHandler?: ICertificateStorageHandler;
  public get certificateHandler(): ICertificateStorageHandler {
    if (!this._certificateHandler) {
      this._certificateHandler = new OCSPCertificateStorageHandler(this);
    }

    return this._certificateHandler;
  }

  public static fromOCSPResponse(
    data: BufferSource | pkijs.OCSPResponse
  ): OCSP {
    const ocspResp: pkijs.OCSPResponse = BufferSourceConverter.isBufferSource(
      data
    )
      ? pkijs.OCSPResponse.fromBER(data)
      : data;

    if (
      ocspResp.responseBytes &&
      ocspResp.responseBytes.responseType === "1.3.6.1.5.5.7.48.1.1"
    ) {
      const asnBasicResp = asn1js.fromBER(
        ocspResp.responseBytes.response.valueBlock.valueHex
      );
      const basicOcsp = new pkijs.BasicOCSPResponse({
        schema: asnBasicResp.result
      });

      return OCSP.fromSchema(basicOcsp);
    } else {
      throw new Error("Incorrect OCSP response");
    }
  }

  #certificates?: x509.X509Certificate[];
  public get certificates(): ReadonlyArray<x509.X509Certificate> {
    if (!this.#certificates) {
      this.#certificates = [];

      for (const cert of this.asn.certs || []) {
        this.#certificates.push(PKIUtils.certTox509(cert));
      }
    }

    return this.#certificates;
  }

  public toOCSPResponse(): ArrayBuffer {
    const ocspRespSimpl = new pkijs.OCSPResponse();
    ocspRespSimpl.responseStatus.valueBlock.valueDec = 0; // success
    const responseBytes = (ocspRespSimpl.responseBytes =
      new pkijs.ResponseBytes());
    responseBytes.responseType = "1.3.6.1.5.5.7.48.1.1";
    responseBytes.response = new asn1js.OctetString({ valueHex: this.toBER() });

    return ocspRespSimpl.toSchema().toBER(false);
  }

  protected onFromSchema(schema: pkijs.SchemaType): pkijs.BasicOCSPResponse {
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

  public async checkCertStatus(
    cert: x509.X509Certificate
  ): Promise<"good" | "revoked" | "unknown"> {
    const issuer = await this.certificateHandler.findIssuer(cert);
    if (!issuer) {
      throw new Error("Issuer certificate not found");
    }
    const status = await this.asn.getCertificateStatus(
      PKIUtils.x509ToCert(cert),
      PKIUtils.x509ToCert(issuer)
    );

    switch (status.status) {
      case 0:
        return "good";
      case 1:
        return "revoked";
    }
    return "unknown";
  }

  public async verify(issuer: x509.X509Certificate): Promise<boolean> {
    const ok = await pkijs
      .getCrypto(true)
      .verifyWithPublicKey(
        this.asn.tbsResponseData.tbs,
        this.asn.signature,
        pkijs.PublicKeyInfo.fromBER(issuer.publicKey.rawData),
        this.asn.signatureAlgorithm
      );

    return ok;
  }
}

import { AlgorithmFactory } from "./AlgorithmFactory";
import { PKIUtils } from "./PKIUtils";
import { CertificateID } from "./CertID";
import { OCSPCertificateStorageHandler } from "./OCSPCertificateStorageHandler";
