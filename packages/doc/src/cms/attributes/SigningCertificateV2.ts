import { AsnType, AsnTypeTypes, AsnProp, AsnPropTypes, AsnIntegerArrayBufferConverter, AsnSerializer, AsnConvert } from "@peculiar/asn1-schema";
import { AlgorithmIdentifier, GeneralName, PolicyInformation } from "@peculiar/asn1-x509";
import { X509Certificate } from "@peculiar/x509";
import { AlgorithmFactory } from "../AlgorithmFactory";
import { CmsAttribute } from "./Attribute";
import { CmsAttributeFactory } from "./AttributeFactory";

const pkijs = require("pkijs");

//#region ASN.1

/**
 * ```
 * IssuerSerial ::= SEQUENCE {
 *      issuer                   GeneralNames,
 *      serialNumber             CertificateSerialNumber
 * }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class IssuerSerial {
  @AsnProp({ type: GeneralName })
  public issuer = new GeneralName();

  @AsnProp({ type: AsnPropTypes.Integer, converter: AsnIntegerArrayBufferConverter })
  public serialNumber = new ArrayBuffer(0);
}

/**
 * ```
 * ESSCertIDv2 ::= SEQUENCE {
 *      hashAlgorithm           AlgorithmIdentifier
 *             DEFAULT {algorithm id-sha256},
 *      certHash                Hash,
 *      issuerSerial            IssuerSerial OPTIONAL
 * }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class ESSCertIDv2 {
  @AsnProp({ type: AlgorithmIdentifier })
  public hashAlgorithm = new AlgorithmIdentifier();

  @AsnProp({ type: AsnPropTypes.OctetString })
  public certHash = new ArrayBuffer(0);

  @AsnProp({ type: IssuerSerial, optional: true })
  issuerSerial?: IssuerSerial;
}

/**
 * ```
 * SigningCertificateV2 ::=  SEQUENCE {
 *     certs        SEQUENCE OF ESSCertIDv2,
 *     policies     SEQUENCE OF PolicyInformation OPTIONAL
 * }
 * ```
 */
@AsnType({ type: AsnTypeTypes.Sequence })
export class SigningCertificateV2 {
  @AsnProp({
    type: ESSCertIDv2,
    repeated: "sequence",
  })
  public certs: ESSCertIDv2[] = [];

  @AsnProp({
    type: PolicyInformation,
    repeated: "sequence",
    optional: true
  })
  public policies: PolicyInformation[] = [];
}
//#endregion

export class SigningCertificateV2Attribute extends CmsAttribute {
  public static readonly DEFAULT_IDENTIFIER = "1.2.840.113549.1.9.16.2.47 ";

  public static async create(algorithm: globalThis.AlgorithmIdentifier, cert: X509Certificate): Promise<SigningCertificateV2Attribute> {
    const essCert = new ESSCertIDv2();
    essCert.certHash = await pkijs.getEngine().subtle.digest(algorithm, cert.rawData);
    essCert.hashAlgorithm = AsnConvert.parse(AlgorithmFactory.toBER(algorithm), AlgorithmIdentifier);

    const signingCert = new SigningCertificateV2();
    signingCert.certs.push(essCert);

    return new SigningCertificateV2Attribute(signingCert);
  }

  public set value(v: SigningCertificateV2) {
    const asn = AsnSerializer.toASN(v);
    if (this.asn.values.length) {
      this.asn.values[0] = asn;
    } else {
      this.asn.values.push(asn);
    }
  }

  public get value(): SigningCertificateV2 {
    if (this.asn.values.length) {
      return AsnConvert.parse(this.asn.values[0].toBER(), SigningCertificateV2);
    }

    throw new Error("Attribute value is empty.");
  }

  public constructor(value?: SigningCertificateV2) {
    super();

    this.asn.type = SigningCertificateV2Attribute.DEFAULT_IDENTIFIER;
    if (value) {
      this.value = value;
    }
  }
}

CmsAttributeFactory.register(SigningCertificateV2Attribute.DEFAULT_IDENTIFIER, SigningCertificateV2Attribute);
