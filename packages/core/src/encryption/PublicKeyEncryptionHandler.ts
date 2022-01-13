import * as asn1js from "asn1js";
import { ByteStream } from "bytestreamjs";
import { BufferSource, BufferSourceConverter } from "pvtsutils";
import { utilConcatBuf } from "pvutils";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getRandomValues } = require("pkijs");

import { PDFArray, PDFTextString } from "../objects";
import { FilterDictionary } from "../structure/dictionaries/Filter";
import { PublicKeyEncryptDictionary } from "../structure/dictionaries/PublicKeyEncrypt";
import { algorithms, clientSideParametersPublicKey, staticDataFF } from "./Constants";
import { EncryptionHandler } from "./EncryptionHandler";



export interface globalParametersPublicKey {
  stmKey?: CryptoKey;
  strKey?: CryptoKey;
}


const { ContentInfo, EnvelopedData } = require("pkijs");

const defaultLength = 256;
const supportedAlgorithm = ["AES-CBC", "AES-GCM"];

export class PublicKeyEncryptionHandler extends EncryptionHandler {
  public static readonly NAME = "Adobe.PPKLite";
  public name = PublicKeyEncryptionHandler.NAME;

  public override dictionary!: PublicKeyEncryptDictionary;
  public clientSideParameters?: clientSideParametersPublicKey;
  public globalParameters?: globalParametersPublicKey;

  public async encrypt(stream: BufferSource): Promise<ArrayBuffer> {
    const dataIV = new Uint8Array(16);
    getRandomValues(dataIV);

    const clientSideParameters = await this.getClientSideParameters();
    const encryptOptions = this.dictionary.documentUpdate?.document.options?.crypto?.encrypt;

    if (!encryptOptions) {
      throw new Error("Absent 'encrypt' parameter in 'options'");
    }

    const key = await this.generateKeyCertificateBased(clientSideParameters.algorithm,
      encryptOptions.seed,
      encryptOptions.recipientsBuffer,
      false);

      const streamBuffer = BufferSourceConverter.toArrayBuffer(stream);

    const encryptionsKey = await this.crypto.encrypt({
      name: clientSideParameters.algorithm,
      length: 256,
      iv: dataIV
    },
      key,
      streamBuffer);

    return utilConcatBuf(dataIV, encryptionsKey);
  }
  public async decrypt(stream: BufferSource): Promise<ArrayBuffer> {
    const streamBuffer = BufferSourceConverter.toUint8Array(stream);
    if (this.dictionary.v === 4) {
      if (this.dictionary.stmF === "Identity" && this.dictionary.strF === "Identity") {
        return streamBuffer;
      }
    }

    const clientSideParameters = await this.getClientSideParameters();
    const globalParameters = await this.getGlobalParameters();

    const dataBuffer = streamBuffer.slice(16, streamBuffer.byteLength);
    const ivBuffer = streamBuffer.slice(0, 16);

    // TODO why only stm? where str?
    return this.crypto.decrypt({
      name: clientSideParameters.algorithm,
      length: 256,
      iv: ivBuffer
    },
      globalParameters.stmKey as any,
      dataBuffer);
  }

  public async getClientSideParameters(): Promise<clientSideParametersPublicKey> {
    if (!this.clientSideParameters) {
      const cryptoOptions = this.dictionary.documentUpdate?.document.options?.crypto;
      if (!cryptoOptions) {
        throw new Error("Cannot find Crypto options for PublicKey encryption handler");
      }
      this.clientSideParameters = cryptoOptions;
    }

    return this.clientSideParameters;
  }

  public async getGlobalParameters(): Promise<globalParametersPublicKey> {
    if (!this.globalParameters) {
      let strKey: CryptoKey;

      const getParametersResult = await this.getParametersByNamePublicKey(this.dictionary.stmF);
      if (!getParametersResult) {
        throw new Error("");
      }

      const stmKey = getParametersResult;
      if (this.dictionary.stmF === this.dictionary.strF) {
        strKey = getParametersResult;
      } else {
        const getParametersResultStr = await this.getParametersByNamePublicKey(this.dictionary.strF);
        if (!getParametersResultStr) {
          throw new Error("");
        }
        strKey = getParametersResultStr;
      }

      this.globalParameters = {
        stmKey,
        strKey,
      };
    }

    return this.globalParameters;
  }

  public async getParametersByNamePublicKey(filterName: string): Promise<CryptoKey> {
    // Initial variables
    let recipientsBuffer = new ArrayBuffer(0);

    let recipientIndex = (-1);
    let certificateIndex = (-1);

    const clientSideParameters = await this.getClientSideParameters();

    if (!this.dictionary.cf) {
      throw new Error("No parameter's dictionary for default filter for input type");
    }

    const streamFilterParameters = this.dictionary.cf.get(filterName, FilterDictionary);
    // TODO change check
    if (!(streamFilterParameters instanceof FilterDictionary)) {
      throw new Error(`${filterName} is not Filter Dictionary`);
    }

    // TODO check
    // const recipientsArray = streamFilterParameters.get("Recipients");
    const recipientsArray = this.dictionary.recipients;
    if (!(recipientsArray instanceof PDFArray)) {
      throw new Error("Incorrect 'Recipients' type");
    }

    // Making "recipient's buffer" (for symmetric key generation)
    for (let i = 0; i < recipientsArray.items.length; i++) {
      const item = recipientsArray.items[i];
      if (!(item instanceof PDFTextString)) {
        throw new Error("Item is not a string");
      }
      recipientsBuffer = utilConcatBuf(recipientsBuffer, item.toArrayBuffer());
    }

    // Compare each element of the "Recipients" array with each client-side certificate
    // Initial variables
    let cmsEnveloped;
    let cmsContentInfo;

    for (let i = 0; i < recipientsArray.items.length; i++) {
      // Get CMS Enveloped Data from LiteralString
      const buffer = new ByteStream({
        string: recipientsArray.items[i]
      });

      const asn1 = asn1js.fromBER(buffer.buffer);
      if (asn1.offset === (-1))
        throw new Error(`Incorrect structure for item #${i} of "Recipients" array`);

      try {
        cmsContentInfo = new ContentInfo({ schema: asn1.result });
      } catch (ex) {
        throw new Error(`Incorrect structure for item #${i} of "Recipients" array`);
      }

      try {
        cmsEnveloped = new EnvelopedData({ schema: cmsContentInfo.content });
      } catch (ex) {
        throw new Error(`Incorrect structure for item #${i} of "Recipients" array`);
      }

      // Check we do have only one recipient in the CMS Enveloped Data
      if (cmsEnveloped.recipientInfos.length !== 1) {
        throw new Error(`Incorrect value in "recipientInfos" for item #${i} of "Recipients" array`);
      }

      // Check that we have "KeyTransRecipientInfo" for the recipient
      if (cmsEnveloped.recipientInfos[0].variant !== 1) {
        throw new Error(`Incorrect value in "recipientInfos" for item #${i} of "Recipients" array`);
      }

      for (let j = 0; j < clientSideParameters.certificates.length; j++) {
        if (clientSideParameters.certificates[j].issuer.isEqual(cmsEnveloped.recipientInfos[0].value.rid.issuer)) {
          if (clientSideParameters.certificates[j].serialNumber.isEqual(cmsEnveloped.recipientInfos[0].value.rid.serialNumber)) {
            recipientIndex = i;
            certificateIndex = j;
            break;
          }
        }
      }

      if (recipientIndex !== (-1))
        break;
    }

    if (recipientIndex === (-1))
      throw new Error("Can not find a recipient");

    const decryptedKey = await cmsEnveloped.decrypt(0, {
      recipientCertificate: clientSideParameters.certificates[certificateIndex],
      recipientPrivateKey: clientSideParameters.keys[certificateIndex]
    });

    // Generate symmetric key
    return await this.generateKeyCertificateBased(clientSideParameters.algorithm, decryptedKey.slice(0, 20), recipientsBuffer);
  }

  public async generateKeyCertificateBased(algorithm: string, seed: ArrayBuffer, recipients: ArrayBuffer, partiallyEncrypted = false): Promise<CryptoKey> {
    if (!supportedAlgorithm.includes(algorithm.toUpperCase())) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Create combined buffer
    let combinedBuffer = utilConcatBuf(seed, recipients);
    if (partiallyEncrypted) {
      combinedBuffer = utilConcatBuf(combinedBuffer, staticDataFF);
    }

    const digestResult = await this.crypto.digest(algorithms.sha256, combinedBuffer);

    return this.crypto.importKey("raw",
      digestResult,
      {
        name: algorithm,
        length: defaultLength,
      },
      true,
      ["decrypt", "encrypt"]
    );
  }
}
