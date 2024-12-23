import * as objects from "../objects";

export class SignatureMDPDictionary extends objects.PDFDictionary {
  @objects.PDFDictionaryField({
    name: "P",
    type: objects.PDFNumeric,
    get: (o) => o.value
  })
  public p!: number;
}
