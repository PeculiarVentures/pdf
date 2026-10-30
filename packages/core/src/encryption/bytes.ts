import { toUint8Array, type BufferSource } from "@peculiar/utils";

/**
 * Returns the bytes as a Uint8Array that WebCrypto and pkijs accept: a view of
 * the same memory when it is an ArrayBuffer, otherwise (SharedArrayBuffer) a copy.
 * @param data Buffer source
 * @returns ArrayBuffer-backed view
 */
export function toCryptoBytes(data: BufferSource): Uint8Array<ArrayBuffer> {
  const view = toUint8Array(data);

  return view.buffer instanceof ArrayBuffer ? (view as Uint8Array<ArrayBuffer>) : new Uint8Array(view);
}
