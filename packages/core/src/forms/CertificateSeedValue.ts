import * as objects from "../objects";

export enum CertificateSeedValueFlags {
  subject = 0x01,
  issuer = 0x02,
  oid = 0x04,
  subjectDN = 0x08,
  reserved = 0x10,
  keyUsage = 0x20,
  url = 0x40
}

export enum KeyUsageState {
  notShallBe,
  shallBe,
  notMatter
}

export interface CertificateSeedValueKeyUsages {
  digitalSignature: KeyUsageState;
  nonRepudiation: KeyUsageState;
  keyEncipherment: KeyUsageState;
  dataEncipherment: KeyUsageState;
  keyAgreement: KeyUsageState;
  keyCertSign: KeyUsageState;
  cRLSign: KeyUsageState;
  encipherOnly: KeyUsageState;
  decipherOnly: KeyUsageState;
}

function getKeyUsageState(char?: string) {
  switch (char) {
    case "0":
      return KeyUsageState.notShallBe;
    case "1":
      return KeyUsageState.shallBe;
    default:
      return KeyUsageState.notMatter;
  }
}

function getKeyUsageHandler(
  this: CertificateSeedValueDictionary,
  o: objects.PDFArray
) {
  const res: CertificateSeedValueKeyUsages[] = [];
  for (const item of o.items) {
    if (!(item instanceof objects.PDFLiteralString)) {
      throw new TypeError(
        "Wrong type of KeyUsage item. Must be PDF literal string"
      );
    }

    res.push({
      digitalSignature: getKeyUsageState(item.text[0]),
      nonRepudiation: getKeyUsageState(item.text[1]),
      keyEncipherment: getKeyUsageState(item.text[2]),
      dataEncipherment: getKeyUsageState(item.text[3]),
      keyAgreement: getKeyUsageState(item.text[4]),
      keyCertSign: getKeyUsageState(item.text[5]),
      cRLSign: getKeyUsageState(item.text[6]),
      encipherOnly: getKeyUsageState(item.text[7]),
      decipherOnly: getKeyUsageState(item.text[8])
    });
  }

  return res;
}

export class CertificateSeedValueDictionary extends objects.PDFDictionary {
  /**
   * The type of PDF object that this dictionary describes
   *
   * if present, shall be SVCert for a certificate seed value dictionary
   */
  @objects.PDFDictionaryField({
    name: "Type",
    type: objects.PDFName,
    optional: true
  })
  public type!: objects.PDFName | null;

  /**
   * A set of bit flags specifying the interpretation of specific
   * entries in this dictionary.
   *
   * A value of 1 for the flag means that a signer shall be required
   * to use only the specified values for the entry.
   * A value of 0 means that other values are permissible.
   */
  @objects.PDFDictionaryField({
    name: "Ff",
    type: objects.PDFNumeric,
    optional: true,
    defaultValue: 0,
    get: (o) => o.value
  })
  public ff!: CertificateSeedValueFlags;

  /**
   * An array of byte strings containing DER-encoded X.509v3
   * certificates that are acceptable for signing
   */
  @objects.PDFDictionaryField({
    name: "Subject",
    type: objects.PDFArray,
    optional: true
  })
  public subject!: objects.PDFArray | null;

  /**
   * An array of dictionaries, each specifying a Subject Distinguished Name (DN)
   * that shall be present within the certificate for it to be acceptable for signing
   */
  @objects.PDFDictionaryField({
    name: "SubjectDN",
    type: objects.PDFArray,
    optional: true
  })
  public subjectDN!: objects.PDFArray | null;

  /**
   * An array of ASCII strings, where each string specifies an acceptable
   * key-usage extension that shall be present in the signing certificate
   */
  @objects.PDFDictionaryField({
    name: "KeyUsage",
    type: objects.PDFArray,
    optional: true,
    cache: true,
    get: getKeyUsageHandler
  })
  public keyUsage!: CertificateSeedValueKeyUsages[] | null;

  /**
   * An array of byte strings containing DER-encoded X.509v3 certificates
   * of acceptable issuers
   */
  @objects.PDFDictionaryField({
    name: "Issuer",
    type: objects.PDFArray,
    optional: true
  })
  public issuer!: objects.PDFArray | null;

  @objects.PDFDictionaryField({
    name: "OID",
    type: objects.PDFArray,
    optional: true,
    get: (o) =>
      o.items.map((item) => {
        if (!(item instanceof objects.PDFLiteralString)) {
          throw new TypeError(
            "Wrong type of OID item. Must be PDF literal string"
          );
        }

        return item;
      })
  })
  public oid!: objects.PDFLiteralString[] | null;

  /**
   * A URL, the use for which shall be defined by the URLType entry
   */
  @objects.PDFDictionaryField({
    name: "URL",
    type: objects.PDFLiteralString,
    optional: true
  })
  public url!: objects.PDFLiteralString | null;

  /**
   * A name indicating the usage of the URL entry
   */
  @objects.PDFDictionaryField({
    name: "URLType",
    type: objects.PDFName,
    optional: true,
    get: (o) => o.text
  })
  public urlType!: string | null;
}
