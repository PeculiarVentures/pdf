import type { PDFDictionary } from "./Dictionary";
import type { PDFObjectTypes } from "./ObjectReader";
import type { PDFObjectConstructor } from "./Object";

export interface PDFDictionaryFieldParameters<T extends PDFObjectTypes, TReturn = any> {
  name: string;
  optional?: boolean;
  type?: abstract new () => T;
  indirect?: boolean;
  get?: (object: T) => TReturn;
  set?: (object: TReturn) => T;
  cache?: boolean;
  defaultValue?: TReturn;
  maybe?: boolean;
}

const cache = new WeakMap<PDFObject, Map<string | symbol, any>>();

export function PDFDictionaryField<T extends PDFObjectTypes = PDFObjectTypes, TReturn = any>(parameters: PDFDictionaryFieldParameters<T, TReturn>): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    //#region Check parameters
    if ("type" in parameters && !parameters.type) {
      throw new Error(`Class not loaded for ${parameters.name}`);
    }
    if (parameters.maybe && !parameters.type) {
      throw new Error("Parameter 'maybe' shall be used with parameter 'type'.");
    }
    //#endregion
    Object.defineProperty(target, propertyKey, {
      enumerable: false,
      get: function (this: PDFDictionary) {
        let cachedObject: Map<string | symbol, any> | undefined = cache.get(this);
        if (!cachedObject) {
          // Init cashed map
          cachedObject = new Map();
          cache.set(this, cachedObject);
        }

        if (parameters.cache && cachedObject.has(propertyKey)) {
          // Return cached value
          return cachedObject.get(propertyKey);
        }

        if (parameters.maybe) {
          const type = parameters.type as PDFObjectConstructor<T>;
          const maybe = new Maybe(this, parameters.name, !!parameters.indirect, type);

          return maybe;
        } else {
          if (this.has(parameters.name)) {
            const value = parameters.type
              ? this.get(parameters.name, parameters.type)
              : this.get(parameters.name);

            // Apply callback function if exists
            const res = parameters.get
              ? parameters.get.call(this, value as any)
              : value;

            if (parameters.cache) {
              // Set value to cache
              cachedObject.set(propertyKey, res);
            }

            return res;
          } else if (!(parameters.optional || parameters.defaultValue !== undefined)) {
            throw new Error(`Cannot get required filed '${parameters.name}' from the PDF Dictionary`);
          }
        }

        return parameters.defaultValue ?? null;
      },
      set: function (this: PDFDictionary, value: TReturn) {
        if (value === undefined || value === null) {
          this.delete(parameters.name);
        } else {
          const result = parameters.set ? parameters.set.call(this, value) : value;

          if (parameters.type && !(result instanceof parameters.type)) {
            throw new Error(`PDF Dictionary field '${parameters.name}' contains invalid data type`);
          } else if (!(result instanceof PDFObject)) {
            throw new Error(`PDF Dictionary field '${parameters.name}' must be PDF object`);
          }
          if (parameters.indirect) {
            result.makeIndirect();
          }
          if (!result.isIndirect()) {
            result.ownerElement = this;
          }
          this.modify();
          this.set(parameters.name, result);
        }

        // Erase PDF object content
        this.view = PDFObject.DEFAULT_VIEW;

        if (parameters.cache) {
          let cachedObject: Map<string | symbol, any> | undefined = cache.get(this);
          if (!cachedObject) {
            cachedObject = new Map();
            cache.set(this, cachedObject);
          }
          cachedObject.set(propertyKey, value);
        }
      }
    });
  };
}

export function PDFNumberField(name: string, optional = false, defaultValue?: number): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFNumeric,
    get: o => o.value,
    set: (value: number) => new PDFNumeric(value),
    optional,
    defaultValue
  });
}

export function PDFNameField(name: string, optional = false, defaultValue?: string): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFName,
    get: o => o.text,
    set: (value: string) => new PDFName(value),
    optional,
    defaultValue,
  });
}

export function PDFLiteralStringField(name: string, optional = false, defaultValue?: string): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFLiteralString,
    get: o => o.text,
    set: (value: string) => new PDFLiteralString(value),
    optional,
    defaultValue,
  });
}

export function PDFHexStringField(name: string, optional = false, defaultValue?: string): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFHexString,
    get: o => o.text,
    set: (value: string) => new PDFHexString(value),
    optional,
    defaultValue,
  });
}

export function PDFBooleanField(name: string, optional = false, defaultValue?: boolean): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFBoolean,
    get: o => o.value,
    set: (value: boolean) => new PDFBoolean(value),
    optional,
    defaultValue,
  });
}
export function PDFArrayField(name: string, optional = false, defaultValue?: PDFArray): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFArray,
    optional,
    defaultValue,
  });
}

export function PDFStreamField(name: string, optional = false): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFStream,
    optional
  });
}

export function PDFDateField(name: string, optional = false, defaultValue?: Date): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFDate,
    optional,
    defaultValue,
  });
}

export function PDFTextStringField(name: string, optional = false): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type: PDFTextString,
    optional,
  });
}

export function PDFArrayOrDictionaryField(name: string, optional = false): PropertyDecorator {
  return PDFDictionaryField({
    name,
    optional,
  });
}

export function PDFMaybeField(name: string, type: abstract new () => PDFObjectTypes, indirect = false): PropertyDecorator {
  return PDFDictionaryField({
    name,
    type,
    maybe: true,
    indirect,
  });
}

import { PDFObject } from "./Object";
import { PDFNumeric } from "./Numeric";
import { PDFName } from "./Name";
import { PDFLiteralString } from "./LiteralString";
import { PDFHexString } from "./HexString";
import { PDFBoolean } from "./Boolean";
import { PDFTextString } from "./TextString";
import { PDFStream } from "./Stream";
import { PDFArray } from "./Array";
import { Maybe } from "./Maybe";
// TODO Move Date decorator to structure/common
import { PDFDate } from "../structure/common/Date";
