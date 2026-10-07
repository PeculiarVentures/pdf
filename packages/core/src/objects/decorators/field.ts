import type { PDFDictionary } from "../Dictionary";
import type { PDFObjectTypes } from "../ObjectTypes";
import { PDFObjectConstructor, PDFObject } from "../Object";
import { Maybe } from "./Maybe";

export type PDFObjectType<T extends PDFObjectTypes = PDFObjectTypes> = abstract new () => T;

/**
 * A class, or a function returning it. Use the function form for classes from a module
 * that imports this one back: the decorator runs while that module may still be loading.
 */
export type PDFObjectTypeRef<T extends PDFObjectTypes = PDFObjectTypes> = PDFObjectType<T> | (() => PDFObjectType<T>);

/** Resolves a type reference. Classes have a `prototype`; arrow functions do not. */
function resolvePDFObjectType<T extends PDFObjectTypes>(ref: PDFObjectTypeRef<T>, name: string): PDFObjectType<T> {
  const type = ref.prototype ? (ref as PDFObjectType<T>) : (ref as () => PDFObjectType<T>)();
  if (!type) {
    throw new Error(`Class not loaded for ${name}`);
  }

  return type;
}

export interface PDFDictionaryFieldParameters<T extends PDFObjectTypes, TReturn = any> {
  name: string;
  optional?: boolean;
  type?: PDFObjectTypeRef<T>;
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
    const typeRef = parameters.type;
    let resolvedType: PDFObjectType<T> | undefined;
    const getType = () => (typeRef ? (resolvedType ??= resolvePDFObjectType(typeRef, parameters.name)) : undefined);

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
          const type = getType() as PDFObjectConstructor<T>;
          const maybe = new Maybe(this, parameters.name, !!parameters.indirect, type);

          return maybe;
        } else {
          if (this.has(parameters.name)) {
            const type = getType();
            const value = type ? this.get(parameters.name, type) : this.get(parameters.name);

            // Apply callback function if exists
            const res = parameters.get ? parameters.get.call(this, value as any) : value;

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

          const type = getType();
          if (type && !(result instanceof type)) {
            throw new Error(`PDF Dictionary field '${parameters.name}' contains invalid data type`);
          } else if (!(result instanceof PDFObject)) {
            throw new Error(`PDF Dictionary field '${parameters.name}' must be PDF object`);
          }
          if (parameters.indirect) {
            result.makeIndirect();
          }
          this.modify();
          this.set(parameters.name, result as PDFObjectTypes);
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
      },
    });
  };
}
