import { AsnConvert } from "@peculiar/asn1-schema";
import * as core from "@peculiar/pdf-core";
import { Convert } from "pvtsutils";
import * as pkijs from "pkijs";
import * as cms from "../cms";
import { type FormObject } from "../FormObject";
import { FormComponentGroup } from "./FormComponent.Group";
import { type SignatureBox } from "./SignatureBox";
import * as types from "./SignatureBox.Types";

const ERR_INCORRECT_BYTE_RANGE =
  "The range of bytes points to an incorrect data";

export class SignatureBoxGroup extends FormComponentGroup<
  core.SignatureField,
  SignatureBox
> {
  public static readonly CONTAINER_SIZE = 2 * 1024;
  public static readonly SUB_FILTER = "ETSI.CAdES.detached";

  public static dictionaryUpdate: types.SignatureDictionaryUpdateCallback =
    async function dictionaryUpdate(dict: core.SignatureDictionary) {
      dict.subFilter = SignatureBoxGroup.SUB_FILTER;
    };

  public get isSigned(): boolean {
    return !!this.target.V;
  }

  public async sign(params: types.SignatureBoxSignParameters): Promise<this> {
    const update = this.target.documentUpdate;
    if (!update) {
      throw new Error("Document update is empty");
    }
    const document = update.document;
    const forms = update.catalog!.AcroForm.get();

    // Create Signature dictionary
    const signValue = core.SignatureDictionary.create(update);
    const byteRange = signValue.ByteRange.get();
    const blockOffset1 = document.createNumber(0, 10);
    const blockLength1 = document.createNumber(0, 10);
    const blockOffset2 = document.createNumber(0, 10);
    const blockLength2 = document.createNumber(0, 10);
    byteRange.push(blockOffset1);
    byteRange.push(blockLength1);
    byteRange.push(blockOffset2);
    byteRange.push(blockLength2);
    signValue.Contents.text = Convert.ToBinary(
      new Uint8Array(params.containerSize || SignatureBoxGroup.CONTAINER_SIZE)
    );

    const dictUpdateCb =
      params.dictionaryUpdate || SignatureBoxGroup.dictionaryUpdate;
    await dictUpdateCb.call(this, signValue);

    this.target.V = signValue.makeIndirect(false);

    // draw contents for all visual signatures
    let sigForm: FormObject | null = null;
    for (const sigBox of this) {
      if (sigBox.width && sigBox.height) {
        if (!sigForm) {
          if (!params.createImage) {
            throw new Error("Signature box requires visual content.");
          }
          sigForm = params.createImage.call(this);
        }
        sigBox.draw(sigForm);
      }
    }

    forms.SigFlags |= core.SignatureFlags.signaturesExist;
    // TODO move flags to params maybe
    forms.SigFlags |= core.SignatureFlags.appendOnly;

    // Serialize document
    await document.toPDF();

    // Set offsets and lengths for the ByteRange
    blockLength1.value = signValue.Contents.view.byteOffset;
    blockLength1.view.set(
      new Uint8Array(Convert.FromBinary(blockLength1.toString()))
    );
    blockOffset2.value =
      signValue.Contents.view.byteOffset + signValue.Contents.view.length;
    blockOffset2.view.set(
      new Uint8Array(Convert.FromBinary(blockOffset2.toString()))
    );
    blockLength2.value = document.view.length - blockOffset2.value;
    blockLength2.view.set(
      new Uint8Array(Convert.FromBinary(blockLength2.toString()))
    );

    // Get signing content
    // Concatenate buffers
    const buffers = [
      document.view.subarray(
        blockOffset1.value,
        blockOffset1.value + blockLength1.value
      ),
      document.view.subarray(
        blockOffset2.value,
        blockOffset2.value + blockLength2.value
      )
    ];
    const content = new Uint8Array(
      buffers.map((o) => o.length).reduce((p, c) => p + c)
    );
    let offset = 0;
    for (const view of buffers) {
      content.set(view, offset);
      offset += view.length;
    }

    const signedData = await params.containerCreate.call(this, content);

    if (signedData.byteLength > signValue.Contents.text.length) {
      throw new Error(
        `Received Contents value is greater than allocated buffer. Allocated buffer must be ${signedData.byteLength}.`
      );
    }
    signValue.Contents.text = Convert.ToBinary(signedData).padEnd(
      signValue.Contents.text.length,
      "\x00"
    );
    signValue.Contents.view.set(
      new Uint8Array(Convert.FromBinary(signValue.Contents.toString()))
    );

    await this.document.save();

    return this;
  }

  public getContent(): Uint8Array {
    const signatureValue = this.getSignatureValue();

    if (!signatureValue.ByteRange.has()) {
      throw new Error(
        "Required field ByteRange is missed in Signature dictionary"
      );
    }
    const byteRange = signatureValue.ByteRange.get().items.map(
      (o) => (o as core.PDFNumeric).value
    );
    const buffers: Uint8Array[] = [];
    const docView = this.target.documentUpdate!.document.view;
    for (let i = 0; i < byteRange.length; i++) {
      const offset = byteRange[i++];
      const length = byteRange[i];
      buffers.push(new Uint8Array(docView.buffer, offset, length));
    }

    // Concatenate buffers
    const signedContent = new Uint8Array(
      buffers.map((o) => o.length).reduce((p, c) => p + c)
    );
    let offset = 0;
    for (const view of buffers) {
      signedContent.set(view, offset);
      offset += view.length;
    }

    return signedContent;
  }

  public async thumbprint(
    crypto: Crypto = pkijs.getCrypto(true).crypto
  ): Promise<string> {
    const signatureValue = this.getSignatureValue();

    const digest = await crypto.subtle.digest(
      "SHA-1",
      signatureValue.Contents.data
    );

    return Convert.ToHex(digest).toUpperCase();
  }

  public getSignatureValue(): core.SignatureDictionary {
    if (!this.target.V) {
      throw new Error("The current signature field is not signed yet.");
    }

    return this.target.V;
  }

  public async verify(
    params: types.SignatureBoxGroupVerifyParams = {}
  ): Promise<types.SignatureVerifyResult> {
    const dateNow = new Date();
    const checkDate = params.checkDate || dateNow;

    const result: types.SignatureVerifyResult = {
      verificationResult: false,
      signedData: null,
      hasSHA1: false,
      name: this.name,
      reason: null,
      location: null,
      signingTime: null,
      checkDate: checkDate,
      signatureType: "signature",
      signerCertificate: null,
      states: []
    };

    try {
      result.name = this.name;

      const signatureValue = this.getSignatureValue();
      result.reason = signatureValue.Reason.has()
        ? await signatureValue.Reason.get().decode()
        : null;
      result.location = signatureValue.Location.has()
        ? await signatureValue.Location.get().decode()
        : null;

      let signedData: cms.CMSSignedData | null = null;
      try {
        signedData = result.signedData = this.getSignedData(signatureValue);
      } catch (e) {
        result.states.push(
          {
            type: "invalid",
            code: "formatting",
            text: "There are errors in the formatting or information contained in the signature",
            data: {
              error: e
            }
          },
          await this.verifySigningTime({ signatureValue, checkDate }),
          {
            type: "invalid",
            text: "The signer's identity has not been verified",
            code: "identity_verification",
            data: {
              state: "not_verified"
            }
          }
        );
      }

      if (signedData) {
        const signer = this.getSigner(signedData);
        const content = this.getContent();

        const subFilter = signatureValue.subFilter;
        // Get signature type
        let signatureType: types.SignatureType =
          subFilter === "ETSI.RFC3161" ? "timestamp" : "signature";

        if (signatureType === "signature") {
          const references = signatureValue.reference;

          if (references) {
            for (const reference of references) {
              if (reference.transformMethod) {
                signatureType = "certified";
                break;
              }
            }
          }
        }

        const timeStamp = await this.getTimeStamp(signedData);
        const signingTime = await this.getSigningTime(
          signedData instanceof cms.TimeStampToken
            ? signedData
            : timeStamp?.value
        );

        result.signingTime = signingTime;
        result.signatureType = signatureType;

        const formattingState = this.verifyFormatting(signatureValue);
        result.states.push(formattingState);

        const verificationResult = await signer.verify(content, checkDate);

        const modificationState = await this.verifyModification(
          verificationResult
        );
        result.states.push(modificationState);

        //Check signature for "signature-time-stamp" attribute
        const ltvState = await this.isLTV(signedData);
        if (signatureType !== "timestamp") {
          const signingTimeState = await this.verifySigningTime({
            signedData,
            signatureValue,
            checkDate: dateNow
          });
          result.states.push(signingTimeState);
        }

        //#region Certificate chain status
        if (verificationResult.signerCertificate) {
          result.signerCertificate = verificationResult.signerCertificate;
          const chain = new cms.CertificateChain();
          chain.certificateHandler.parent = signedData.certificateHandler;

          // If PDF is LTV
          let chainResult: cms.CertificateChainResult | undefined;
          if (ltvState) {
            // Try Chain validation with Revocations
            // Get all revocations
            chainResult = await chain.build(
              verificationResult.signerCertificate,
              {
                checkDate: signingTime || checkDate,
                revocationMode: "offline"
              }
            );

            // if chain status is no revocation then verify chain with online revocations
            if (
              chainResult.resultCode ===
              cms.CertificateChainStatusCode.revocationNotFound
            ) {
              result.states.push(
                this.makeLtvState(false, chainResult.resultMessage)
              );
              chainResult = await chain.build(
                verificationResult.signerCertificate,
                {
                  checkDate,
                  revocationMode: "online",
                  preferCRL: params.preferCRL
                }
              );
            } else {
              result.states.push(this.makeLtvState(true));
            }
          } else {
            // verify chain with online revocations
            chainResult = await chain.build(
              verificationResult.signerCertificate,
              {
                checkDate,
                revocationMode: "online",
                preferCRL: params.preferCRL
              }
            );
            if (chainResult.result === true && chainResult.chain.length === 1) {
              result.states.push(this.makeLtvState(true));
            } else {
              result.states.push(
                this.makeLtvState(
                  false,
                  "PDF document doesn't have revocation items"
                )
              );
            }
          }

          switch (chainResult.result) {
            case true:
              result.states.push({
                type: "valid",
                text: "The signer's identity has been verified",
                code: "identity_verification",
                data: {
                  state: "verified",
                  ...chainResult
                }
              });
              break;
            case false:
              result.verificationResult = false;
              result.states.push({
                type: "invalid",
                text: "The signer's identity has not been verified",
                code: "identity_verification",
                data: {
                  state: "not_verified",
                  ...chainResult
                }
              });
              break;
            default:
              result.verificationResult = false;
              result.states.push({
                type: "info",
                text: "The signer's identity has not been verified yet",
                code: "identity_verification",
                data: {
                  state: "not_verified",
                  ...chainResult
                }
              });
          }
        }
        //#endregion
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof Object) {
        if ("signerCertificate" in error)
          result.signerCertificate = error.signerCertificate;

        if ("message" in error) {
          result.message = error.message;

          if (
            result.message ===
            "Validation of signer's certificate failed: No valid certificate paths found"
          ) {
            result.message =
              "The signer\x27s certificate was issued by a untrusted certificate authority";

            result.states.push({
              type: "invalid",
              text: "The signer\x27s certificate was issued by a untrusted certificate authority",
              code: "untrusted_cert_authority",
              data: {
                certificate: result.signerCertificate,
                certChain: result.certificatePath
              }
            });
          }
        }

        if ("type" in error) {
          result.states.push(error);
        }
      } else {
        result.states.push({
          type: "invalid",
          text: `Document is corrupted and can not be read ${error}`,
          code: "document_corrupted",
          data: {
            error
          }
        });

        result.message = error;
      }

      if (result.message) {
        result.states.push({
          type: "invalid",
          text: result.message,
          code: "error",
          data: {
            error: result.message,
            stack: error.stack
          }
        });
      }

      if (error instanceof Object === false) return result;

      if ("signatureVerified" in error) {
        switch (error.signatureVerified) {
          case true:
            result.states.push({
              type: "valid",
              text: "The document has not been modified since it was signed",
              code: "document_modification",
              data: {
                state: "not_modified"
              }
            });
            break;
          case false:
            result.states.push({
              type: "invalid",
              text: "The document has been modified since it was signed",
              code: "document_modification",
              data: {
                state: "modified"
              }
            });
            break;
          default:
            result.states.push({
              type: "invalid",
              text: "The integrity of the document is unknown",
              code: "document_modification",
              data: {
                state: "error"
              }
            });
        }
      }

      if ("signerCertificateVerified" in error) {
        switch (error.signerCertificateVerified) {
          case true:
            result.states.push({
              type: "valid",
              text: "The signer's identity has been verified",
              code: "identity_verification",
              data: {
                state: "verified"
              }
            });
            break;
          case false:
            result.states.push({
              type: "invalid",
              text: "The signer's identity has not been verified",
              code: "identity_verification",
              data: {
                state: "not_verified"
              }
            });
            break;
          default:
            result.states.push({
              type: "invalid",
              text: "Status of the signer's identity validation is unknown",
              code: "identity_verification",
              data: {
                state: "error"
              }
            });
        }
      }
    }

    // Update `verificationResult`
    result.verificationResult = !result.states.some(
      (o) => o.type === "invalid"
    );

    return result;
  }

  protected async getAllLtvRevocations(
    signedData: cms.CMSSignedData
  ): Promise<Array<cms.CRL | cms.OCSP>> {
    const revocations: cms.RevocationItem[] = [];
    if (signedData.revocations) {
      for (const revocation of signedData.revocations) {
        revocations.push(revocation);
      }
    }

    // Load revocation items form Adobe attribute
    for (const signer of signedData.signers) {
      for (const attr of signer.signedAttributes) {
        if (attr.type === cms.id_adbe_revocationInfoArchival) {
          const adobeAttr = attr as cms.AdobeRevocationInfoArchival;
          for (const crl of adobeAttr.crl) {
            revocations.push(crl);
          }
          for (const ocsp of adobeAttr.ocsp) {
            revocations.push(ocsp);
          }
          for (const ocsp of adobeAttr.otherRevInfo) {
            revocations.push(ocsp);
          }
        }
      }

      const signatureThumbprint = await this.thumbprint();
      const vri = this.document.dss.findVri(signatureThumbprint);
      // CRL
      if (vri && vri.CRL.has()) {
        const crls = vri.CRL.get();
        for (const crl of crls) {
          if (crl instanceof core.PDFStream) {
            const stream = crl.decodeSync();
            revocations.push(cms.CRL.fromBER(stream));
          }
        }
      }

      // OCSP
      if (vri && vri.OCSP.has()) {
        const ocsps = vri.OCSP.get();
        for (const ocsp of ocsps) {
          if (ocsp instanceof core.PDFStream) {
            const stream = ocsp.decodeSync();
            revocations.push(cms.OCSP.fromOCSPResponse(stream));
          }
        }
      }
    }

    return revocations;
  }

  protected makeLtvState(state: true): types.LtvState;
  protected makeLtvState(state: false, reason: string): types.LtvState;
  protected makeLtvState(state: boolean, reason?: string): types.LtvState {
    if (state) {
      return {
        type: "info",
        text: "Signature is LTV enabled",
        code: "ltv",
        data: {
          state
        }
      };
    } else {
      return {
        type: "info",
        text: "Signature is not LTV enabled",
        code: "ltv",
        data: {
          state,
          reason
        }
      };
    }
  }

  protected async verifySigningTime({
    signedData,
    signatureValue,
    checkDate
  }: types.VerifySigningTimeParams): Promise<types.SigningTimeStates> {
    if (signedData) {
      const timeStampRes = await this.getTimeStamp(signedData);
      const signer = this.getSigner(signedData);

      if (timeStampRes) {
        // Embedded timestamp
        const { source, value: timeStamp } = timeStampRes;
        timeStamp.certificateHandler.parent = signedData.certificateHandler;
        const tsaResult = await timeStamp.verify(
          signer.asn.signature.valueBlock.valueHex,
          checkDate
        );
        const state: types.EmbeddedSigningTimeState = {
          type: "valid",
          text:
            source === "embedded"
              ? "The signature includes an embedded timestamp"
              : "The signature includes a timestamp embedded in the document",
          code: "signing_time",
          data: {
            type: source,
            date: timeStamp.info.genTime,
            signature: tsaResult,
            info: tsaResult.info
          }
        };

        // Verify TSA signing certificate
        const tsaSigner = tsaResult.signers[0];
        if (tsaSigner && tsaSigner.signerCertificate) {
          state.data.signer = tsaSigner.signerCertificate;
        }

        if (
          tsaResult.signatureVerified &&
          tsaSigner &&
          tsaSigner.signerCertificate
        ) {
          const tsaCertChain = new cms.CertificateChain();
          tsaCertChain.certificateHandler.parent = timeStamp.certificateHandler;
          state.data.signer = tsaSigner.signerCertificate;
          state.data.chain = await tsaCertChain.build(
            tsaSigner.signerCertificate,
            { checkDate, revocationMode: "online" }
          );
        }

        if (
          tsaResult.signatureVerified &&
          state.data.chain &&
          state.data.chain.resultCode === cms.CertificateChainStatusCode.badDate
        ) {
          // * Not testable: timestamp validation always uses token's own date
          // TODO: Remove this check if it is not needed
          state.text += " but it is expired";
        } else if (
          !tsaResult.signatureVerified ||
          !state.data.chain ||
          !state.data.chain.result
        ) {
          state.type = "invalid";
          state.text += " but it is invalid";
        }

        return state;
      }
    }

    if (signatureValue.signingTime) {
      // Local time
      const state: types.LocalSigningTimeState = {
        type: "info",
        text: "Signing time is from the clock on the signer's computer",
        code: "signing_time",
        data: {
          type: "local",
          date: signatureValue.signingTime.getDate()
        }
      };

      return state;
    }

    // Time is not available
    const status: types.EmptySigningTimeState = {
      type: "info",
      text: "Signing time is not available",
      code: "signing_time",
      data: {
        type: "empty"
      }
    };

    return status;
  }

  protected getSignedData(
    signatureValue: core.SignatureDictionary
  ): cms.CMSSignedData {
    const cmsSignaedDataType =
      signatureValue.subFilter === "ETSI.RFC3161"
        ? cms.TimeStampToken
        : cms.CMSSignedData;
    const signedData = cmsSignaedDataType.fromBER(signatureValue.Contents.data);
    signedData.certificateHandler.parent = this.document.certificateHandler;

    return signedData;
  }

  protected getSigner(signedData: cms.CMSSignedData): cms.CMSSignerInfo {
    if (signedData.signers.length !== 1) {
      throw new Error(
        "Cannot get SignerInfo from SignedData. Incorrect amount of signers, must be one."
      );
    }
    const signer = signedData.signers[0];

    return signer;
  }

  protected async getTimeStamp(signedData: cms.CMSSignedData): Promise<{
    source: "embedded" | "dss";
    value: cms.TimeStampToken;
  } | null> {
    const signer = signedData.signers[0];
    const tsa = signer.unsignedAttributes.find(
      (o) => o instanceof cms.TimeStampTokenAttribute
    ) as cms.TimeStampTokenAttribute | undefined;
    if (!tsa) {
      const signatureThumbprint = await this.thumbprint();
      const vri = this.document.dss.findVri(signatureThumbprint);
      if (vri && vri.TS) {
        const raw = await vri.TS.decode();

        return {
          source: "dss",
          value: cms.TimeStampToken.fromBER(raw)
        };
      }
    } else {
      return {
        source: "embedded",
        value: tsa.token
      };
    }

    return null;
  }

  protected async getSigningTime(
    timeStamp?: cms.TimeStampToken | null
  ): Promise<Date | null> {
    // Looking for the signing time in Signature TimeStamp
    if (timeStamp) {
      return timeStamp.info.genTime;
    }

    // Looking for the signing time in SignatureValue dictionary
    if (this.target.V && this.target.V.signingTime) {
      return this.target.V.signingTime.getDate();
    }

    return null;
  }

  protected verifyFormatting(
    signatureValue: core.SignatureDictionary
  ): types.FormattingState {
    const state: types.FormattingState = {
      type: "valid",
      code: "formatting",
      text: "There are not errors in formatting",
      data: {}
    };

    try {
      const doc = this.document.target;
      if (doc.wrongStructure) {
        return {
          type: "warn",
          code: "formatting",
          text: "Document structure doesn't match PDF specification",
          data: {}
        };
      }
      const byteRange = signatureValue.ByteRange.get(true);
      const contentView = signatureValue.Contents.view;
      if (!signatureValue.documentUpdate) {
        throw new Error("Cannot get the document update object.");
      }
      const updateView = signatureValue.documentUpdate.view;
      const byteRange1 = byteRange.get(0, core.PDFNumeric).value;
      const byteRange2 = byteRange.get(1, core.PDFNumeric).value;
      const byteRange3 = byteRange.get(2, core.PDFNumeric).value;
      const byteRange4 = byteRange.get(3, core.PDFNumeric).value;
      const check1 = byteRange1 === 0;
      const check2 = byteRange2 === contentView.byteOffset;
      const begin2 = byteRange3;
      const check3 = begin2 === contentView.byteOffset + contentView.length;

      if (!(check1 && check2 && check3)) {
        const index = !check1 ? 0 : !check2 ? 1 : 2;
        throw new Error(
          `${ERR_INCORRECT_BYTE_RANGE}. ByteRange[${index}] points to an incorrect data.`
        );
      }

      const lastOffset = byteRange3 + byteRange4;

      const updateViewReader = new core.ViewReader(updateView);
      updateViewReader.end();
      updateViewReader.backward = true;
      const updateEofIndex = updateViewReader.findIndex("%%EOF");

      const documentViewReader = new core.ViewReader(doc.view);
      documentViewReader.position = lastOffset - 1;
      documentViewReader.backward = true;
      let eofIndex = documentViewReader.findIndex("%%EOF");

      // Check that Update section ends with %%EOF marker with EOL characters
      if (eofIndex === -1 || updateEofIndex !== eofIndex) {
        throw new Error(
          `${ERR_INCORRECT_BYTE_RANGE}. The %%EOF marker is not found.`
        );
      }
      eofIndex += 1; // index points to F, but we need to point to the next character
      if (eofIndex !== lastOffset) {
        if (lastOffset - eofIndex > 3) {
          // Acrobat allows up to 3 bytes after %%EOF marker
          throw new Error(
            `${ERR_INCORRECT_BYTE_RANGE}. Too many bytes after %%EOF marker.`
          );
        }
        const eolText = Convert.ToBinary(
          doc.view.subarray(eofIndex, lastOffset)
        );
        if (/^(?:\r|\n)*$/.test(eolText) === false) {
          throw new Error(
            `${ERR_INCORRECT_BYTE_RANGE}. EOL contains invalid characters.`
          );
        }
      }

      // Check if the Update section is the last section in the document
      // the byte range points includes all bytes to the end of the file
      let lastUpdate = doc.update;
      if (lastUpdate.view.length === 0 && lastUpdate.previous) {
        lastUpdate = lastUpdate.previous;
      }
      if (
        lastUpdate === signatureValue.documentUpdate &&
        lastOffset !== doc.view.length
      ) {
        throw new Error(
          `${ERR_INCORRECT_BYTE_RANGE}. Document contains extra bytes after signed data.`
        );
      }
    } catch (e) {
      const state: types.FormattingState = {
        type: "invalid",
        code: "formatting",
        text: "There are errors in formatting",
        data: {
          error: e instanceof Error ? e : new Error("Unknown error")
        }
      };

      return state;
    }

    return state;
  }

  protected async verifyModification(
    verificationResult: cms.CMSSignerInfoVerifyResult
  ): Promise<types.DocumentModificationState> {
    switch (verificationResult.signatureVerified) {
      case true:
        return {
          type: "valid",
          text: "The document has not been modified since it was signed",
          code: "document_modification",
          data: {
            state: "not_modified"
          }
        };
      case false:
        return {
          type: "invalid",
          text: "The document has been modified since it was signed",
          code: "document_modification",
          data: {
            state: "modified"
          }
        };
      default: {
        let text =
          "There are errors in formatting or information contained in this signature";
        if (verificationResult.message) {
          text = verificationResult.message;
        }

        return {
          type: "invalid",
          text,
          code: "document_modification",
          data: {
            state: "error"
          }
        };
      }
    }
  }

  protected async isLTV(signedData: cms.CMSSignedData): Promise<boolean> {
    // DSS
    const signatureThumbprint = await this.thumbprint();
    const vri = this.document.dss.findVri(signatureThumbprint);
    if (vri) {
      if (
        (vri.CRL.has() && vri.CRL.get().length) ||
        (vri.OCSP.has() && vri.OCSP.get().length)
      ) {
        return true;
      }
    } else if (
      this.document.dss.crls.length ||
      this.document.dss.ocsps.length
    ) {
      return true;
    }

    // CAdES
    if (signedData.revocations.length) {
      return true;
    }

    for (const signer of signedData.signers) {
      for (const attr of signer.signedAttributes) {
        if (attr.type === cms.id_adbe_revocationInfoArchival) {
          const attrValue = attr.values[0];
          if (attrValue) {
            const adobeAttr = AsnConvert.parse(
              attrValue,
              cms.RevocationInfoArchival
            );
            if (
              (adobeAttr.crl && adobeAttr.crl.length) ||
              (adobeAttr.ocsp && adobeAttr.ocsp.length)
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}
