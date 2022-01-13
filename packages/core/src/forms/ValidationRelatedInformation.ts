import { Maybe, PDFArray, PDFDateField, PDFDictionary, PDFDictionaryField, PDFLiteralString, PDFMaybeField, PDFName, PDFNameField, PDFStream, PDFStreamField } from "../objects";
import { PDFDate } from "../structure/common/Date";

export class ValidationRelatedInformationDictionary extends PDFDictionary {

  public static readonly TYPE = "VRI";

  /**
   *  If present, shall be VRI for a validation-related information dictionary
   */
  @PDFNameField("Type", true, ValidationRelatedInformationDictionary.TYPE)
  public type!: typeof ValidationRelatedInformationDictionary.TYPE;

  /**
   * An array of (indirect references to) streams, each containing one DER encoded 
   * X.509 certificate (see RFC 5280). This array contains certificates that were used
   * in the validation of this signature
   */
  @PDFMaybeField("Cert", PDFArray)
  public Cert!: Maybe<PDFArray>;

  /**
   * An array of indirect references to streams that are all
   * CRLs used to determine the validity of the certificates in the chains 
   * related to this signature. Each stream shall reference a CRL that is an entry 
   * in the CRLs array in the DSS dictionary
   */
  @PDFMaybeField("CRL", PDFArray)
  public CRL!: Maybe<PDFArray>;

  /**
   * An array of indirect references to streams that are all OCSPs used to determine 
   * the validity of the certificates in the chains related to this signature. 
   * Each stream shall reference an OCSP that is an entry in the OCSPs array in the
   * DSS dictionary
   */
   @PDFMaybeField("OCSP", PDFArray)
   public OCSP!: Maybe<PDFArray>;
  
  /**
   * The date/time at which this signature VRI dictionary was created. 
   * TU shall be a date string
   */
  @PDFDateField("TU", true)
  public TU!: PDFDate | null;

  /**
   * A stream containing the DER-encoded timestamp (see RFC 3161 as updated
   * by RFC 5816) that contains the date/time at which this signature VRI dictionary 
   * was created
   */
  @PDFStreamField("TS", true)
  public TS!: PDFStream | null;

}
