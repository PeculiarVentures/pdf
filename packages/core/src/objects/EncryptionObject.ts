export interface EncryptionObject {
  encrypted?: boolean;
  encryptAsync(): Promise<ArrayBuffer>;
  decryptAsync(): Promise<ArrayBuffer>;
}
