import { PDFNumeric } from "../Numeric";
import { PDFName } from "../Name";
import { PDFLiteralString } from "../LiteralString";
import { PDFHexString } from "../HexString";
import { PDFBoolean } from "../Boolean";
import { PDFArray } from "../Array";
import { PDFTextString } from "../TextString";
import { PDFDictionary } from "../Dictionary";
import { PDFStream } from "../Stream";
import { PDFObjectTypes } from "../ObjectTypes";
import { PDFDictionaryField } from "./field";

export function PDFNumberField(
  name: string,
  optional = false,
  defaultValue?: number
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFNumeric,
    get: (o) => o.value,
    set: (value: number) => new PDFNumeric(value),
    optional,
    defaultValue
  });
}

export function PDFNameField(
  name: string,
  optional = false,
  defaultValue?: string
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFName,
    get: (o) => o.text,
    set: (value: string) => new PDFName(value),
    optional,
    defaultValue
  });
}

export function PDFLiteralStringField(
  name: string,
  optional = false,
  defaultValue?: string
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFLiteralString,
    get: (o) => o.text,
    set: (value: string) => new PDFLiteralString(value),
    optional,
    defaultValue
  });
}

export function PDFHexStringField(
  name: string,
  optional = false,
  defaultValue?: string
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFHexString,
    get: (o) => o.text,
    set: (value: string) => new PDFHexString(value),
    optional,
    defaultValue
  });
}

export function PDFBooleanField(
  name: string,
  optional = false,
  defaultValue?: boolean
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFBoolean,
    get: (o) => o.value,
    set: (value: boolean) => new PDFBoolean(value),
    optional,
    defaultValue
  });
}
export function PDFArrayField(
  name: string,
  optional = false,
  defaultValue?: PDFArray
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFArray,
    optional,
    defaultValue
  });
}

export function PDFStreamField(
  name: string,
  optional = false
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFStream,
    optional
  });
}

export function PDFTextField(
  name: string,
  prefer: typeof PDFLiteralString | typeof PDFHexString,
  optional = false
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFTextString,
    optional,
    get: (o: PDFTextString) => {
      return o.text;
    },
    set: function (this: PDFDictionary, v: string): PDFTextString {
      if (!this.has(name)) {
        // If field doesn't exist, create new
        this.set(name, new prefer(v));
      }

      // Get filed and set value
      const res = this.get(name, PDFTextString);
      res.text = v;

      return res;
    }
  });
}

export function PDFTextStringField(
  name: string,
  optional = false
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFTextString,
    optional
  });
}

export function PDFArrayOrDictionaryField(
  name: string,
  optional = false
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    optional
  });
}

export function PDFMaybeField(
  name: string,
  type: abstract new () => PDFObjectTypes,
  indirect = false
): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type,
    maybe: true,
    indirect
  });
}
