import type { PDFArray } from "./Array";
import type { PDFBoolean } from "./Boolean";
import type { PDFComment } from "./Comment";
import type { PDFDictionary } from "./Dictionary";
import type { PDFHexString } from "./HexString";
import type { PDFIndirectReference } from "./IndirectReference";
import type { PDFLiteralString } from "./LiteralString";
import type { PDFName } from "./Name";
import type { PDFNull } from "./Null";
import type { PDFNumeric } from "./Numeric";
import type { PDFStream } from "./Stream";

const zeroChar = 0x30;
const nineChar = 0x39;
const plusChar = 0x2b;
const minusChar = 0x2d;
const pointChar = 0x2e;

export function isDigit(char: number): boolean {
  return (zeroChar <= char && char <= nineChar) // [0-9]
    || char === plusChar // '+'
    || char === minusChar // '-'
    || char === pointChar; // '.'
}


export enum ObjectTypeEnum {
  Null = "PDFNull",
  Boolean = "PDFBoolean",
  Numeric = "PDFNumeric",
  Name = "PDFName",
  LiteralString = "PDFLiteralString",
  HexString = "PDFHexString",
  IndirectReference = "PDFIndirectReference",
  Array = "PDFArray",
  Dictionary = "PDFDictionary",
  Stream = "PDFStream",
  Comment = "PDFComment",
}


/**
 * Determines if the provided data is an instance of the specified PDF object type.
 * @param data - The data to check.
 * @param name - The name of the PDF object type to check for.
 * @returns True if the provided data is an instance of the specified PDF object type, false otherwise.
 *
 * @remarks This method is internal to fix some circular dependencies.
 */
export function typeOf(data: unknown, name: ObjectTypeEnum.Null): data is PDFNull;
export function typeOf(data: unknown, name: ObjectTypeEnum.Boolean): data is PDFBoolean;
export function typeOf(data: unknown, name: ObjectTypeEnum.Numeric): data is PDFNumeric;
export function typeOf(data: unknown, name: ObjectTypeEnum.Name): data is PDFName;
export function typeOf(data: unknown, name: ObjectTypeEnum.LiteralString): data is PDFLiteralString;
export function typeOf(data: unknown, name: ObjectTypeEnum.HexString): data is PDFHexString;
export function typeOf(data: unknown, name: ObjectTypeEnum.IndirectReference): data is PDFIndirectReference;
export function typeOf(data: unknown, name: ObjectTypeEnum.Array): data is PDFArray;
export function typeOf(data: unknown, name: ObjectTypeEnum.Dictionary): data is PDFDictionary;
export function typeOf(data: unknown, name: ObjectTypeEnum.Stream): data is PDFStream;
export function typeOf(data: unknown, name: ObjectTypeEnum.Comment): data is PDFComment;
export function typeOf(data: unknown, name: string): boolean {
  return !!data && typeof data === "object" && "NAME" in data.constructor && data.constructor.NAME === name;
}
