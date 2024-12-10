import { AsnConvert } from "@peculiar/asn1-schema";
import { TSTInfo } from "@peculiar/asn1-tsp";
import * as pkijs from "pkijs";

import { CMSSignedData, CMSSignedDataVerifyResult } from "./SignedData";

export interface TimeStampVerifyResult extends CMSSignedDataVerifyResult {
  info: TSTInfo;
}

export class TimeStampToken extends CMSSignedData {

  public info = new TSTInfo();

  protected override onFromSchema(schema: pkijs.SchemaType): pkijs.ContentInfo {
    const result = super.onFromSchema(schema);

    const info = this.signedData.encapContentInfo.eContent!.valueBlock.valueHex;
    this.info = AsnConvert.parse(info, TSTInfo);

    return result;
  }

  public override async verify(data?: BufferSource, checkDate = new Date(), signer?: CMSSignerInfo): Promise<TimeStampVerifyResult> {
    const cmsResult = await super.verify(data, checkDate, signer);

    const tsResult: TimeStampVerifyResult = {
      ...cmsResult,
      info: this.info,
    };

    return tsResult;
  }

}

import type { CMSSignerInfo } from "./SignerInfo";
