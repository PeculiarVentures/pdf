import { BufferSource, BufferSourceConverter, Convert } from "pvtsutils";
import * as pkijs from "pkijs";
import { Name, X509Certificate } from "@peculiar/x509";

import { PDFArray, PDFHexString, PDFStream, PDFTextString } from "../objects";
import { CryptoFilterMethods, EncryptDictionary, PublicKeyCryptoFilterDictionary, PublicKeyEncryptDictionary, PublicKeyPermissionFlags, TrailerDictionary } from "../structure";
import { staticDataFF } from "./Constants";
import { EncryptionHandler, EncryptionHandlerCreateParams } from "./EncryptionHandler";
import { EncryptionAlgorithms, EncryptionKey, EncryptionKeys } from "./EncryptionAlgorithms";

export interface PublicKeyEncryptionHandlerCreateParams extends EncryptionHandlerCreateParams {
  permission?: PublicKeyPermissionFlags;
  algorithm: CryptoFilterMethods;
  encryptMetadata?: boolean;
  recipients: X509Certificate[];
}

interface ComputeEncryptionKeyParams {
  algorithm: CryptoFilterMethods;
  seed: BufferSource;
  recipients: ArrayBuffer;
  crypto: pkijs.ICryptoEngine;
  encryptMetadata: boolean;
}

async function computeEncryptionKey(params: ComputeEncryptionKeyParams): Promise<ArrayBuffer> {
  const { seed, recipients, crypto } = params;

  // The file encryption key used by 7.6.3.1, "Algorithm 1: Encryption of data using the RC4 or AES
  // algorithms" shall be calculated by means of an SHA-1 message digest operation, for a key length of 128
  // bits. For the file encryption key used by 7.6.3.2 "Algorithm 1.A: Encryption of data using the AES
  // algorithms", a SHA-256 digest operation shall be used for a key length of 256 bits.
  let digestAlg = "SHA-1";
  let keySize = 128;
  if (params.algorithm === CryptoFilterMethods.AES256) {
    digestAlg = "SHA-256";
    keySize = 256;
  }

  // Create combined buffer
  // a) The 20 bytes of seed. 
  // b) The bytes of each item in the Recipients array of CMS objects in the order in which they appear in the
  //    array.
  // c) 4 bytes with the value 0xFF if the key being generated is intended for use in document-level encryption
  //    and the document metadata is being left as plaintext
  // d) The first n/8 bytes of the resulting digest shall be used as the file encryption key, where n is the bit length
  //    of the file encryption key. 
  const encryptMetadata = params.encryptMetadata ? new Uint8Array() : staticDataFF;
  const combinedBuffer = BufferSourceConverter.concat(seed, recipients, encryptMetadata);
  // const combinedBuffer = BufferSourceConverter.concat(seed, recipients);

  const digest = await crypto.digest(digestAlg, combinedBuffer);

  return digest.slice(0, keySize >> 3);
}

const DefaultCryptFilter = "DefaultCryptFilter";

export interface Recipient {
  key: CryptoKey | BufferSource;
  certificate: X509Certificate;
  crypto: Crypto;
}

export type CertificateHandle = (id?: {
  serialNumber: string;
  issuer: string;
  algorithm: Algorithm;
}) => Promise<Recipient | null>;

export class PublicKeyEncryptionHandler extends EncryptionHandler {
  public static readonly NAME = "Adobe.PubSec";

  public static async create(params: PublicKeyEncryptionHandlerCreateParams): Promise<PublicKeyEncryptionHandler> {
    const doc = params.document;
    const crypto = params.crypto || pkijs.getCrypto(true);

    // params
    const permissions = params.permission || 0;

    // create Encrypt dictionary
    const encrypt = PublicKeyEncryptDictionary.create(doc).makeIndirect(false);

    // fill Encrypt dictionary
    encrypt.Filter = PublicKeyEncryptionHandler.NAME;
    encrypt.P = permissions;

    let encryptionKeys: EncryptionKeys | null = null;
    switch (params.algorithm) {
      case CryptoFilterMethods.AES128:
        throw new Error("Cannot create PublicKeyEncryptionHandler. AES128 crypto mechanism is not supported");
        // encrypt.SubFilter = "adbe.pkcs7.s4";
        // encrypt.Length = 128;
        // encrypt.V = 4; // CF, StmF, and StrF
        break;
      case CryptoFilterMethods.AES256: {
        let encryptionKey: EncryptionKey | null = null;
        // create StdCF Crypto Filter
        if (!params.disableStream || !params.disableString) {
          const filter = PublicKeyCryptoFilterDictionary.create(doc);
          filter.CFM = params.algorithm;
          if (params.encryptMetadata === false) {
            filter.EncryptMetadata = params.encryptMetadata;
          }
          filter.Length = 256;
          encrypt.CF.get().set(DefaultCryptFilter, filter);

          const seed = crypto.getRandomValues(new Uint8Array(20));
          const combined = BufferSourceConverter.concat(seed, new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]));

          filter.Recipients = doc.createArray();
          const recipientBuffers: BufferSource[] = [];
          for (const recipient of params.recipients) {
            const envelopedData = new pkijs.EnvelopedData({
              version: 0,
              // NOTE: Acrobat doesn't work with constructed OctetString
              disableSplit: true,
            });
            //region Add recipient to CMS EnvelopedData
            envelopedData.addRecipientByCertificate(pkijs.Certificate.fromBER(recipient.rawData), { useOAEP: false, oaepHashAlgorithm: "SHA-256" });
            //endregion

            await envelopedData.encrypt({
              name: "AES-CBC",
              length: 128,
            } as AesKeyGenParams, combined);

            const cms = new pkijs.ContentInfo({
              contentType: "1.2.840.113549.1.7.3",
              content: envelopedData.toSchema()
            });

            const cmsRaw = cms.toSchema().toBER(false);
            recipientBuffers.push(cmsRaw);
            filter.Recipients.push(doc.createHexString(cmsRaw));
          }

          const key = await computeEncryptionKey({
            algorithm: params.algorithm,
            recipients: BufferSourceConverter.concat(recipientBuffers),
            seed: seed.slice(0, 20),
            encryptMetadata: filter.EncryptMetadata,
            crypto,
          });

          encryptionKey = {
            type: params.algorithm,
            raw: BufferSourceConverter.toUint8Array(key),
          };
        }

        encryptionKeys = {
          stream: {
            type: CryptoFilterMethods.None,
            raw: new Uint8Array(),
          },
          string: {
            type: CryptoFilterMethods.None,
            raw: new Uint8Array(),
          },
        };
        encrypt.StmF = "Identity";
        encrypt.StrF = "Identity";

        if (encryptionKey && !params.disableStream) {
          encryptionKeys.stream = encryptionKey;
          encrypt.StmF = DefaultCryptFilter;
        }
        if (encryptionKey && !params.disableString) {
          encryptionKeys.string = encryptionKey;
          encrypt.StrF = DefaultCryptFilter;
        }

        encrypt.SubFilter = "adbe.pkcs7.s5";
        encrypt.V = 5; // CF, StmF, and StrF

        break;
      }
      default:
        throw new Error("Unknown crypto method.");
    }

    // initialize Standard handler
    const handler = new PublicKeyEncryptionHandler(encrypt, crypto);
    if (encryptionKeys) {
      handler.#keys = encryptionKeys;
    }
    handler.crypto = crypto;

    // get xref for ID getting
    if (!doc.update.xref) {
      throw new Error("Cannot set ID for the PDF document handler. The XRef object is empty.");
    }
    const xref = doc.update.xref as unknown as TrailerDictionary;

    // If PDF has encryption it shall have the ID filed in XRef object
    let id = crypto.getRandomValues(new Uint8Array(16));
    if (!xref.has("ID")) {
      // Create ID object
      xref.set("ID", doc.createArray(
        doc.createHexString(id),
        doc.createHexString(crypto.getRandomValues(new Uint8Array(16))),
      ));
    } else {
      id = xref.get("ID", PDFArray).get(0, PDFHexString).toUint8Array();
    }

    doc.update.xref!.Encrypt = encrypt;

    return handler;
  }
  public name: typeof PublicKeyEncryptionHandler.NAME = PublicKeyEncryptionHandler.NAME;

  public override dictionary!: PublicKeyEncryptDictionary;

  public onCertificate?: CertificateHandle;

  public async authenticate(): Promise<void> {
    await this.#getKeys();
  }

  public async encrypt(stream: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer> {
    return EncryptionAlgorithms.encrypt({
      key: await this.#getKey(target),
      data: stream,
      target,
      crypto: this.crypto,
    });
  }

  public async decrypt(stream: BufferSource, target: PDFStream | PDFTextString): Promise<ArrayBuffer> {
    return EncryptionAlgorithms.decrypt({
      key: await this.#getKey(target),
      data: stream,
      target,
      crypto: this.crypto,
    });
  }

  /**
   * cached file encryption keys
   */
  #keys?: EncryptionKeys;

  /**
   * Returns encryption key for specified object
   * @param target PDF object
   * @returns Encryption key
   */
  async #getKey(target: PDFStream | PDFTextString): Promise<EncryptionKey> {
    // Get crypto key for the target object
    const keys = await this.#getKeys();

    return (target instanceof PDFStream)
      ? keys.stream // use StmF key for Stream
      : keys.string; // use StrF key for Literal and Hexadecimal strings
  }

  /**
   * Gets cached or computes encryption keys using the user password
   * @returns Encryption keys
   */
  async #getKeys(): Promise<EncryptionKeys> {
    if (this.#keys) {
      return this.#keys;
    }

    if (this.dictionary.V >= 4) {
      if (this.dictionary.StmF === this.dictionary.StrF) {
        const key = await this.getKeyF(this.dictionary.StmF);

        this.#keys = {
          stream: key,
          string: key,
        };
      } else {
        const keys = await Promise.all([
          this.getKeyF(this.dictionary.StmF),
          this.getKeyF(this.dictionary.StrF),
        ]);

        this.#keys = {
          stream: keys[0],
          string: keys[1],
        };
      }
    } else {
      throw new Error("Crypto mechanisms with V less than 4 are not supported.");
    }

    return this.#keys;
  }

  /**
   * Returns encryption file key for specified Crypto Filter Name (eg CFStd)
   * @param filterName Filter name
   * @returns Encryption key
   */
  protected async getKeyF(filterName: string): Promise<EncryptionKey> {
    if (filterName === EncryptDictionary.IDENTITY) {
      return {
        type: CryptoFilterMethods.None,
        raw: new Uint8Array,
      };
    }

    // get specified crypto filter
    const filter = this.dictionary.CF.get(true).getItem(filterName, PublicKeyCryptoFilterDictionary);

    const recipients = this.dictionary.SubFilter === "adbe.pkcs7.s5"
      ? (filter.Recipients instanceof PDFTextString ? new PDFArray(filter.Recipients) : filter.Recipients)
      : this.dictionary.Recipients;

    // Making "recipient's buffer" (for symmetric key generation)
    const recipientViews: Uint8Array[] = [];
    for (const recipient of recipients) {
      if (!(recipient instanceof PDFTextString)) {
        throw new Error("Item is not a string");
      }
      recipientViews.push(recipient.toUint8Array());
    }
    const recipientsBuffer = BufferSourceConverter.concat(...recipientViews);

    // Compare each element of the "Recipients" array with each client-side certificate
    let cmsEnveloped;

    for (let i = 0; i < recipientViews.length; i++) {
      const recipientView = recipientViews[i];
      let contentInfo;
      try {
        contentInfo = pkijs.ContentInfo.fromBER(recipientView);
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        throw new Error(`Incorrect structure for item #${i} of "Recipients" array. ${message}`);
      }

      try {
        cmsEnveloped = new pkijs.EnvelopedData({ schema: contentInfo.content });
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        throw new Error(`Incorrect structure for item #${i} of "Recipients" array. ${message}`);
      }

      // Check we do have only one recipient in the CMS Enveloped Data
      if (cmsEnveloped.recipientInfos.length !== 1) {
        throw new Error(`Incorrect value in "recipientInfos" for item #${i} of "Recipients" array.`);
      }

      const recipientInfo = cmsEnveloped.recipientInfos[0];
      // Check that we have "KeyTransRecipientInfo" for the recipient
      if (!(recipientInfo.value instanceof pkijs.KeyTransRecipientInfo
        && recipientInfo.variant === 1)) {
        throw new Error(`Incorrect value in "recipientInfos" for item #${i} of "Recipients" array.`);
      }

      if (!this.onCertificate) {
        throw new Error("Cannot get certificate private key, 'onCertificate' callback is empty.");
      }

      if (!(recipientInfo.value.rid instanceof pkijs.IssuerAndSerialNumber)) {
        throw new Error("Cannot get the recipient ID. Unsupported type of the recipient ID");
      }

      // Convert the recipient ID to JSON compatible with @peculiar/x509
      const issuerName = new Name(recipientInfo.value.rid.issuer.toSchema().toBER());
      const serialNumber = Convert.ToHex(recipientInfo.value.rid.serialNumber.valueBlock.valueHexView);
      const algorithm: Algorithm = this.crypto.getAlgorithmByOID(recipientInfo.value.keyEncryptionAlgorithm.algorithmId, true, "keyEncryptionAlgorithm");
      if (algorithm.name === "RSA-OAEP") {
        const schema = recipientInfo.value.keyEncryptionAlgorithm.algorithmParams;
        const rsaOAEPParams = new pkijs.RSAESOAEPParams({ schema });

        (algorithm as RsaHashedKeyAlgorithm).hash = this.crypto.getAlgorithmByOID(rsaOAEPParams.hashAlgorithm.algorithmId, true, "rsaOAEPParams.hashAlgorithm");
      }
      const recipient = await this.onCertificate({
        issuer: issuerName.toString(),
        serialNumber: serialNumber,
        algorithm,
      });

      if (recipient) {
        const decryptedKey = BufferSourceConverter.isBufferSource(recipient.key)
          ? await cmsEnveloped.decrypt(0, {
            recipientCertificate: pkijs.Certificate.fromBER(recipient.certificate.rawData),
            recipientPrivateKey: recipient.key,
          })
          : await cmsEnveloped.decrypt(0, {
            recipientCertificate: pkijs.Certificate.fromBER(recipient.certificate.rawData),
            recipientPrivateKey: recipient.key,
            crypto: recipient.crypto,
          });

        // Generate symmetric key
        const key = await computeEncryptionKey({
          algorithm: filter.CFM,
          seed: decryptedKey.slice(0, 20),
          recipients: recipientsBuffer,
          encryptMetadata: filter.EncryptMetadata,
          crypto: this.crypto,
        });

        return {
          type: filter.CFM,
          raw: BufferSourceConverter.toUint8Array(key),
        };
      }
    }

    throw new Error("Can not find a recipient");
  }

}
