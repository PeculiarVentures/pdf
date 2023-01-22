import { BufferSourceConverter, Convert } from "pvtsutils";

import type { EncryptionObject } from "./EncryptionObject";

import { PDFString } from "./String";

export abstract class PDFTextString extends PDFString implements EncryptionObject {

  public encrypted?: boolean;

  public async encryptAsync(): Promise<ArrayBuffer> {
    const parent = this.findIndirect(true);

    const textView = Convert.FromBinary(this.text);
    if (!parent || !this.documentUpdate?.document.encryptHandler) {
      return textView;
    }

    return this.documentUpdate.document.encryptHandler.encrypt(textView, this);
  }

  public async decryptAsync(): Promise<ArrayBuffer> {
    const parent = this.findIndirect(true);

    const textView = Convert.FromBinary(this.text);
    if (!parent || !this.documentUpdate?.document.encryptHandler) {
      return textView;
    }

    return this.documentUpdate.document.encryptHandler.decrypt(textView, this);
  }

  public async encode(): Promise<string> {
    if (this.encrypted === false) {
      if (this.documentUpdate?.document.encryptHandler) {
        const decryptedText = await this.encryptAsync();
        this.text = Convert.ToBinary(decryptedText);
        this.encrypted = true;
      }
    }

    return this.text;
  }

  public async decode(): Promise<string> {
    if (this.encrypted === undefined || this.encrypted) {
      if (this.documentUpdate?.document.encryptHandler) {
        const decryptedText = await this.decryptAsync();
        this.text = Convert.ToBinary(decryptedText);
      }

      this.encrypted = false;
    }

    return this.text;
  }

  public abstract toArrayBuffer(): ArrayBuffer;

  public toUint8Array(): Uint8Array {
    return BufferSourceConverter.toUint8Array(this.toArrayBuffer());
  }

  protected override onCopy(copy: PDFTextString): void {
    super.onCopy(copy);

    copy.encrypted = this.encrypted;
  }
}
