import { Convert } from "pvtsutils";

export class PDFOperator {

  public static readonly NAME_REGEX = /([A-Z0-9*'"]+)\s*$/i;
  public static readonly SPACE_CHAR = " ";
  public static readonly DEFAULT_NAME = "";

  public name = PDFOperator.DEFAULT_NAME;
  public parameters: PDFObjectTypes[] = [];

  public static create(name: string, ...parameters: PDFObjectTypes[]): PDFOperator {
    const operator = new PDFOperator();

    operator.name = name;
    operator.parameters.push(...parameters);

    return operator;
  }

  public static fromString(data: string): PDFOperator {
    const operator = new PDFOperator();
    operator.fromString(data);

    return operator;
  }

  public fromString(data: string): void {
    const nameRegex = new RegExp(PDFOperator.NAME_REGEX);
    const nameMatches = nameRegex.exec(data);
    if (!nameMatches) {
      throw new Error("Cannot get operator name");
    }

    this.name = nameMatches[1];
    const parameters = data.substring(0, nameMatches.index);

    if (parameters) {
      const parametersView = Convert.FromBinary(parameters.trimEnd());
      const parametersReader = new ViewReader(parametersView);

      while (true) {
        const obj = PDFObjectReader.read(parametersReader);
        this.parameters.push(obj);

        if (parametersReader.isEOF) {
          break;
        }
      }
    }
  }

  public toString(): string {
    const res = [
      ...this.parameters.map(o => Convert.ToBinary(o.toPDF())),
      this.name,
    ];

    return res.join(PDFOperator.SPACE_CHAR);
  }
}

import { PDFObjectReader, PDFObjectTypes } from "../objects";
import { ViewReader } from "../ViewReader";
