import * as objects from "../objects";
import { PDFNumeric } from "../objects";
import { PDFDate } from "../structure/common/Date";
import { SignatureReferenceDictionary } from "./SignatureReference";

export enum SignatureType {
  signature = "Sig",
  timeStamp = "DocTimeStamp",
}

export class SignatureDictionary extends objects.PDFDictionary {

  /**
   * The type of PDF object that this dictionary describes; if present, shall be Sig for a signature dictionary or
   * DocTimeStamp for a timestamp signature dictionary.
   * 
   * The default value is: Sig. 
   * @remarks
   * - Optional if Sig 
   * - Required if DocTimeStamp
   */
  @objects.PDFNameField("Type", true, SignatureType.signature)
  public type!: SignatureType;

  /**
   * The name of the preferred signature handler to use when validating this signature
   * 
   * If the Prop_Build entry is not present, it shall be also the
   * name of the signature handler that was used to create the signature. If
   * Prop_Build is present, it may be used to determine the name of the handler that
   * created the signature (which is typically the same as Filter but is not needed to
   * be).
   */
  @objects.PDFNameField("Filter")
  public filter!: string;

  /**
   * A name that describes the encoding of the signature value 
   * and key information in the signature dictionary
   * 
   * (PDF 1.6) The following values for public-key cryptographic signatures 
   * shall be used: adbe.x509.rsa_sha1, adbe.pkcs7.detached, and adbe.pkcs7.sha1
   */
  @objects.PDFNameField("SubFilter", true)
  public subFilter!: string | null;

  /**
   * The signature value
   */
  @objects.PDFDictionaryField({
    type: objects.PDFHexString,
    name: "Contents",
  })
  public Contents!: objects.PDFHexString;

  /**
   * An array of byte strings that shall represent the X.509 certificate chain used when
   * signing and verifying signatures that use public-key cryptography, or a byte string 
   * if the chain has only one entry
   */
  @objects.PDFDictionaryField({
    name: "Cert",
    optional: true,
  })
  public cert!: objects.PDFArray | objects.PDFHexString | null;

  /**
   * An array of pairs of integers (starting byte offset, length in bytes) that shall 
   * describe the exact byte range for the digest calculation
   */
  @objects.PDFMaybeField("ByteRange", objects.PDFArray)
  public ByteRange!: objects.Maybe<objects.PDFArray>;

  /**
   * An array of signature reference dictionaries
   */
  @objects.PDFDictionaryField({
    name: "Reference",
    type: objects.PDFArray,
    cache: true,
    get: o => o.items.map(ref => {
      if (!(ref instanceof objects.PDFDictionary)) {
        throw new TypeError("Unsupported type of the field 'Reference'");
      }

      return new SignatureReferenceDictionary(ref);
    }),
    optional: true,
  })
  public reference!: SignatureReferenceDictionary[] | null;

  /**
   * An array of three integers that shall specify changes to the
   * document that have been made between the previous signature and
   * this signature.
   */
  @objects.PDFDictionaryField({
    name: "Changes",
    type: objects.PDFArray,
    optional: true,
  })
  public changes?: objects.PDFArray;

  /**
   * The name of the person or authority signing the document.
   * This value should be used only when it is not possible to extract the
   * name from the signature
   */
  @objects.PDFDictionaryField({
    name: "Name",
    type: objects.PDFLiteralString,
    optional: true,
  })
  public name!: objects.PDFLiteralString | null;

  /**
   * The time of signing
   */
  @objects.PDFDictionaryField({
    name: "M",
    type: objects.PDFLiteralString,
    get: o => new PDFDate(o),
    optional: true,
  })
  public signingTime!: PDFDate | null;

  /**
   * The CPU host name or physical location of the signing
   */
  @objects.PDFMaybeField("Location", objects.PDFLiteralString)
  public Location!: objects.Maybe<objects.PDFLiteralString>;

  /**
   * The reason for the signing, such as (I agree…)
   */
  @objects.PDFMaybeField("Reason", objects.PDFLiteralString)
  public Reason!: objects.Maybe<objects.PDFLiteralString>;

  /**
   * Information provided by the signer to enable a recipient to
   * contact the signer to verify the signature
   */
  @objects.PDFDictionaryField({
    name: "ContactInfo",
    type: objects.PDFLiteralString,
    optional: true,
  })
  public contactInfo!: objects.PDFLiteralString | null;

  /**
   * The version of the signature handler that was used to create the signature
   */
  @objects.PDFDictionaryField({
    name: "R",
    type: objects.PDFNumeric,
    get: o => o.value,
    optional: true,
  })
  public r!: string | null;

  /**
   * The version of the signature dictionary format
   */
  @objects.PDFDictionaryField({
    name: "V",
    type: objects.PDFNumeric,
    get: o => o.value,
    optional: true,
  })
  public v!: string | null;

  /**
   * A dictionary that may be used by a signature
   * handler to record information that captures the state of the computer
   * environment used for signing, such as the name of the handler used to
   * create the signature, software build date, version, and operating
   * system
   */
  @objects.PDFDictionaryField({
    name: "Prop_Build",
    type: objects.PDFDictionary,
    optional: true,
  })
  public propBuild!: objects.PDFDictionary | null;

  /**
   * The number of seconds since the signer was last authenticated, 
   * used in claims of signature repudiation
   */
  @objects.PDFDictionaryField({
    name: "Prop_AuthTime",
    type: objects.PDFNumeric,
    get: o => o.value,
    optional: true,
  })
  public propAuthTime!: number | null;

  /**
   * The method that shall be used to authenticate the signer, 
   * used in claims of signature repudiation
   */
  @objects.PDFDictionaryField({
    name: "Prop_AuthType",
    type: objects.PDFName,
    get: o => o.text,
    optional: true,
  })
  public propAuthType!: string | null;

  protected override onCreate(): void {
    super.onCreate();

    const document = this.getDocument();

    this.type = SignatureType.signature;
    this.filter = "Adobe.PPKLite";  
    this.Contents = document.createHexString();
  }

}
