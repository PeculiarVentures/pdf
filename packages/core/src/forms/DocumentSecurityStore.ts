import { Maybe, PDFArray, PDFDictionary, PDFMaybeField, PDFNameField } from "../objects";

export class DocumentSecurityStoreDictionary extends PDFDictionary {

  public static readonly TYPE = "DSS";

  /**
   * If present, shall be DSS for a document security store dictionary
   */
  @PDFNameField("Type", true, DocumentSecurityStoreDictionary.TYPE)
  public Type!: typeof DocumentSecurityStoreDictionary.TYPE | null;

  /**
   * This dictionary contains Signature VRI dictionaries
   */
  @PDFMaybeField("VRI", PDFDictionary)
  public VRI!: Maybe<PDFDictionary>;

  /**
   * An array of indirect reference to streams, each containing one DER encoded X.509 certificate (see RFC 5280).
   * This array contains certificates that may be used in the validation of any signatures in the document.
   */
  @PDFMaybeField("Certs", PDFArray)
  public Certs!: Maybe<PDFArray>;

  /**
   * An array of indirect references to streams, each containing a DER encoded
   * Online Certificate Status Protocol (OCSP) response (see RFC 6960). This
   * array contains OCSPs that may be used in the validation of the signatures
   * in the document
   */
  @PDFMaybeField("OCSPs", PDFArray)
  public OCSPs!: Maybe<PDFArray>;

  /**
   * An array of indirect references to streams, each containing a DER encoded
   * Certificate Revocation List (CRL) (see RFC 5280). This array contains
   * CRLs that may be used in the validation of the signatures in the document
   */
  @PDFMaybeField("CRLs", PDFArray)
  public CRLs!: Maybe<PDFArray>;

  protected override onCreate(): void {
    super.onCreate();

    this.Type = DocumentSecurityStoreDictionary.TYPE;
  }

}
