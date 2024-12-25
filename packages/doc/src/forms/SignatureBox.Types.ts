import * as core from "@peculiarventures/pdf-core";
import { TSTInfo } from "@peculiar/asn1-tsp";
import { X509Certificate, X509Certificates } from "@peculiar/x509";
import * as cms from "../cms";
import { FormObject } from "../FormObject";
import { type SignatureBoxGroup } from "./SignatureBox.Group";

export type SignatureBoxCreateImageCallback = (
  this: SignatureBoxGroup
) => FormObject;
export type SignatureDictionaryUpdateCallback = (
  this: SignatureBoxGroup,
  filed: core.SignatureDictionary
) => Promise<void>;
export type SignatureFieldSigningCallback = (
  this: SignatureBoxGroup,
  data: Uint8Array
) => Promise<ArrayBuffer>;

export interface SignatureBoxSignParameters {
  containerSize?: number;
  createImage?: SignatureBoxCreateImageCallback;
  dictionaryUpdate?: SignatureDictionaryUpdateCallback;
  containerCreate: SignatureFieldSigningCallback;
}

export type SignatureType = "signature" | "timestamp" | "certified";
type SignatureStateType = "info" | "invalid" | "valid" | "warn";

export interface SignatureState {
  type: SignatureStateType;
  text: string;
  code: string;
  data: unknown;
}

export interface EmbeddedTimestampState extends SignatureState {
  type: "info";
  code: "embedded_timestamp";
  text: string;
  data: {
    valid: boolean;
    certChain: X509Certificates;
  };
}

export interface SigningTimeState extends SignatureState {
  code: "signing_time";
  data: {
    type: "local" | "empty" | "embedded" | "dss";
  };
}

export interface EmptySigningTimeState extends SigningTimeState {
  type: "info";
  data: {
    type: "empty";
  };
}

export interface LocalSigningTimeState extends SigningTimeState {
  type: "info";
  data: {
    type: "local";
    date: Date;
  };
}

export interface EmbeddedSigningTimeState extends SigningTimeState {
  type: "valid" | "invalid";
  data: {
    type: "embedded" | "dss";
    date: Date;
    signature?: cms.CMSSignedDataVerifyResult;
    signer?: X509Certificate;
    chain?: cms.CertificateChainResult;
    info: TSTInfo;
  };
}

export type SigningTimeStates =
  | EmptySigningTimeState
  | LocalSigningTimeState
  | EmbeddedSigningTimeState;

export interface SigningTimeVerifiedState extends SignatureState {
  type: "info";
  code: "signing_time_verified";
  data: cms.CertificateChainResult;
}

export interface SigningTimeLocalState extends SignatureState {
  type: "info";
  code: "signing_time_from_local";
  data: null;
}

export interface DocumentModificationState extends SignatureState {
  code: "document_modification";
  data: {
    state: "not_modified" | "modified" | "error";
  };
}

export interface LtvState extends SignatureState {
  text: string;
  code: "ltv";
  data: {
    state: boolean;
    reason?: string;
  };
}

export interface SigningCertificateData extends cms.CertificateChainResult {
  state: "verified" | "not_verified";
}

export interface SignerCertificateState extends SignatureState {
  text: string;
  code: "identity_verification";
  data: SigningCertificateData;
}

export interface FormattingState extends SignatureState {
  type: "valid" | "invalid" | "warn";
  code: "formatting";
  data: {
    error?: Error;
  };
}

export type SignatureStates =
  | SignatureState
  | DocumentModificationState
  | SigningTimeStates
  | FormattingState
  | SignerCertificateState
  | LtvState
  | DocumentModificationState;

/**
 * Result of signature verification
 */
export interface SignatureVerifyResult {
  /** CMS signed data object */
  signedData: cms.CMSSignedData | null;
  /** Overall verification result */
  verificationResult: boolean;
  /** Optional verification message */
  message?: string;
  /** The date to check the signature */
  checkDate: Date | null;
  /** Indicates if signature uses SHA-1 algorithm */
  hasSHA1: boolean;
  /** Signer's name */
  name: string | null;
  /** Signing location */
  location: string | null;
  /** Signing reason */
  reason: string | null;
  /** Date and time when signature was created */
  signingTime: Date | null;
  /** Type of the signature */
  signatureType: SignatureType;
  /** Signer's certificate */
  signerCertificate: X509Certificate | null;
  /** Certificate validation chain result */
  certificatePath?: cms.CertificateChainResult;
  /** Array of signature validation states */
  states: SignatureStates[];
}

export interface SignatureBoxGroupVerifyParams {
  preferCRL?: boolean;
  checkDate?: Date;
}

export interface VerifySigningTimeParams {
  signedData?: cms.CMSSignedData;
  signatureValue: core.SignatureDictionary;
  checkDate: Date;
}
