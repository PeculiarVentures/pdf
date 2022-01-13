import { PDFString } from "../../objects";
import { PDFLiteralString } from "../../objects/LiteralString";
import type { PDFDocumentUpdate } from "../DocumentUpdate";

const regexData = /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:(Z)|(?:([-+])(\d{2})'(\d{2})))?/;

export class PDFDate extends PDFLiteralString {

  public async getDateAsync(): Promise<Date> {
    await this.decode();
    if (this.encrypted === undefined || this.encrypted) {
      throw new Error("Date is encrypted");
    }

    return this.getDate();
  }

  public getDate(): Date {
    const date = regexData.exec(this.text);
    if (!date) {
      throw new Error(`Cannot parse date '${this.text}'.'`);
    }

    // yyyy-mm-ddThh:mm:00.000+0000
    let dateString = `${date[1]}-${date[2]}-${date[3]}T${date[4]}:${date[5]}:${date[6]}.000`;
    if (date[7]) {
      // Z
      dateString += "+0000";
    } else {
      // +/-ZONE
      dateString += `${date[8]}${date[9]}${date[10]}`;
    }

    return new Date(dateString);
  }

  public setDate(date: Date): void {
    const timeZoneOffset = date.getTimezoneOffset();

    let timeZoneString = "Z";

    const timeZoneHours = Math.floor(Math.abs(timeZoneOffset / 60));
    const timeZoneMinutes = Math.abs(timeZoneOffset % 60);
    const timeZoneHoursAndMinutes = `${timeZoneHours.toString().padStart(2, "0")}'${timeZoneMinutes.toString().padStart(2, "0")}'`;

    switch (true) {
      case (timeZoneOffset > 0):
        timeZoneString = `-${timeZoneHoursAndMinutes}`;
        break;
      case (timeZoneOffset < 0):
        timeZoneString = `+${timeZoneHoursAndMinutes}`;
        break;
    }

    const year = date.getFullYear().toString().padStart(4, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    const second = date.getSeconds().toString().padStart(2, "0");
    const stringDate = `D:${year}${month}${day}${hour}${minute}${second}${timeZoneString}`;

    // (D:YYYYMMDDHHmmSSOHH'mm)
    // where:
    // YYYY shall be the year
    // MM shall be the month (01–12)
    // DD shall be the day (01–31)
    // HH shall be the hour (00–23)
    // mm shall be the minute (00–59)
    // SS shall be the second (00–59) 
    // O shall be the relationship of local time to Universal Time (UT), and shall be denoted by one of the
    // characters PLUS SIGN (U+002B) (+), HYPHEN-MINUS (U+002D) (-), or LATIN CAPITAL LETTER Z
    // (U+005A) (Z) (see below)
    // HH followed by APOSTROPHE (U+0027) (') shall be the absolute value of the offset from UT in hours
    // (00–23)
    // mm shall be the absolute value of the offset from UT in minutes (00–59) 

    this.encrypted = false;
    this.text = stringDate;
  }

  constructor(param?: Date | PDFString | string | BufferSource) {
    super((param instanceof Date) ? "" : param);

    if (param instanceof Date) {
      this.setDate(param);
    }
  }

  public static createDate(update: PDFDocumentUpdate, date = new Date): PDFDate {
    const pdfDate = this.create(update);

    pdfDate.setDate(date);

    return pdfDate;
  }
}
