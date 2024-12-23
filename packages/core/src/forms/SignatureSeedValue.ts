import * as objects from "../objects";
import { SignatureMDPDictionary } from "./SignatureMDP";

export enum SignatureSeedValueFlags {
  filter = 0x01,
  subFilter = 0x02,
  v = 0x04,
  reasons = 0x08,
  legalAttestation = 0x10,
  addRevInfo = 0x20,
  digestMethod = 0x40
}

export class SignatureSeedValueDictionary extends objects.PDFDictionary {
  /**
   * The type of PDF object that this dictionary describes
   *
   * if present, shall be SV for a seed value dictionary
   */
  @objects.PDFDictionaryField({
    name: "Type",
    type: objects.PDFName,
    optional: true,
    get: (o) => o.text
  })
  public type!: objects.PDFName | null;

  /**
   * A set of bit flags specifying the interpretation of specific entries in this dictionary.
   *
   * A value of 1 for the flag indicates that the associated entry is a required constraint.
   * A value of 0 indicates that the associated entry is an optional constraint.
   */
  @objects.PDFDictionaryField({
    name: "Ff",
    type: objects.PDFNumeric,
    optional: true,
    get: (o) => o.value,
    defaultValue: 0
  })
  public ff!: SignatureSeedValueFlags;

  /**
   * The signature handler that shall be used to sign the signature field
   */
  @objects.PDFDictionaryField({
    name: "Filter",
    type: objects.PDFName,
    optional: true,
    get: (o) => o.text
  })
  public filter!: string | null;

  /**
   * An array of names indicating encodings to use when signing
   */
  @objects.PDFDictionaryField({
    name: "SubFilter",
    type: objects.PDFArray,
    optional: true
  })
  public subFilter!: objects.PDFArray | null;

  /**
   * An array of names indicating acceptable digest
   * algorithms to use while signing. The value shall be one of SHA1,
   * SHA256, SHA384, SHA512 and RIPEMD160. The default value is
   * implementation-specific
   */
  @objects.PDFDictionaryField({
    name: "DigestMethod",
    type: objects.PDFArray,
    optional: true
  })
  public digestMethod!: objects.PDFArray | null;

  /**
   * The minimum required capability of the signature field seed
   * value dictionary parser. A value of 1 specifies that the parser shall be
   * able to recognize all seed value dictionary entries in a PDF 1.5 file. A
   * value of 2 specifies that it shall be able to recognize all seed value
   * dictionary entries specified
   */
  @objects.PDFDictionaryField({
    name: "V",
    type: objects.PDFNumeric,
    optional: true
  })
  public v!: number | null;

  /**
   * A certificate seed value dictionary containing
   * information about the characteristics of the certificate that shall be used
   * when signing
   */
  @objects.PDFDictionaryField({
    name: "Cert",
    type: objects.PDFDictionary,
    optional: true
  })
  public cert!: objects.PDFDictionary | null;

  /**
   * An array of text strings that specifying possible reasons for
   * signing a document. If specified, the reasons supplied in this entry
   * replace those used by conforming products
   */
  @objects.PDFDictionaryField({
    name: "Reasons",
    type: objects.PDFArray,
    optional: true
  })
  public reasons!: objects.PDFArray | null;

  /**
   * A dictionary containing a single entry whose key is
   * P and whose value is an integer between 0 and 3
   */
  @objects.PDFDictionaryField({
    name: "MDP",
    type: objects.PDFDictionary,
    optional: true,
    cache: true,
    get: (o) => new SignatureMDPDictionary(o)
  })
  public mdp!: SignatureMDPDictionary | null;

  /**
   * A time stamp dictionary containing two entries
   */
  @objects.PDFDictionaryField({
    name: "TimeStamp",
    type: objects.PDFDictionary,
    optional: true
  })
  public timeStamp!: objects.PDFDictionary | null;

  /**
   * An array of text strings specifying possible legal attestations
   */
  @objects.PDFDictionaryField({
    name: "LegalAttestation",
    type: objects.PDFArray,
    optional: true
  })
  public legalAttestation!: objects.PDFArray | null;

  /**
   * A flag indicating whether revocation checking shall be carried out
   */
  @objects.PDFDictionaryField({
    name: "AddRevInfo",
    type: objects.PDFBoolean,
    optional: true,
    defaultValue: false
  })
  public addRevInfo!: boolean;
}
