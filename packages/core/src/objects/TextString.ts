import { Convert } from "pvtsutils";

import type { EncryptionObject } from "./EncryptionObject";

import { PDFString } from "./String";

export abstract class PDFTextString extends PDFString implements EncryptionObject {

  public encrypted?: boolean;

  public async encryptAsync(): Promise<ArrayBuffer> {
    const parent = this.findIndirect(true);

    const textView = Convert.FromBinary(this.text);
    if (!parent || !this.documentUpdate?.encryptHandler) {
      return textView;
    }

    return this.documentUpdate.encryptHandler.encrypt(textView, parent);
  }

  public async decryptAsync(): Promise<ArrayBuffer> {
    const parent = this.findIndirect(true);

    const textView = Convert.FromBinary(this.text);
    if (!parent || !this.documentUpdate?.encryptHandler) {
      return textView;
    }

    return this.documentUpdate.encryptHandler.decrypt(textView, parent);
  }

  public async encode(): Promise<string> {
    if (this.encrypted === false) {
      if (this.documentUpdate?.encryptHandler) {
        const decryptedText = await this.encryptAsync();
        this.text = Convert.ToBinary(decryptedText);
        this.encrypted = true;
      }
    }

    return this.text;
  }

  public async decode(): Promise<string> {
    if (this.encrypted === undefined || this.encrypted) {
      if (this.documentUpdate?.encryptHandler) {
        const decryptedText = await this.decryptAsync();
        this.text = Convert.ToBinary(decryptedText);
      }

      this.encrypted = false;
    }

    return this.text;
  }

  public abstract toArrayBuffer(): ArrayBuffer;

  protected override onCopy(copy: PDFTextString): void {
    super.onCopy(copy);

    copy.encrypted = this.encrypted;
  }
}
