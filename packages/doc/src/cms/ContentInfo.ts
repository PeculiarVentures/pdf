const pkijs = require("pkijs");

import { AsnEncoded } from "./AsnEncoded";

export class CMSContentInfo extends AsnEncoded {

  public static CONTENT_TYPE_DATA = "1.2.840.113549.1.7.1";
  public static CONTENT_TYPE_SIGNED_DATA = "1.2.840.113549.1.7.2";
  public static CONTENT_TYPE_TIME_STAMP_TOKEN = "1.2.840.113549.1.9.16.1.4";

  public get contentType(): string {
    return this.asn.contentType;
  }

  public get content(): ArrayBuffer {
    return this.asn.content.toBER();
  }

  protected onFromSchema(schema: any): any {
    return new pkijs.ContentInfo({ schema });
  }

  public constructor() {
    super();
    
    this.asn = new pkijs.ContentInfo();
  }

}
