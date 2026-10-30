import * as asn1js from "asn1js";
import { toUint8Array, type BufferSource } from "@peculiar/utils";

/**
 * BER decoder options for input that can carry revocation data. asn1js stops
 * at 10,000 nodes by default, and a signature container or a CRL holds far
 * more. Every node takes at least two bytes, so the limit still bounds the
 * work by the size of the input.
 * @param raw BER-encoded data
 * @returns Options for asn1js and `AsnConvert.parse`'s `berOptions`
 */
export function berOptions(raw: BufferSource): asn1js.FromBerOptions {
  return { maxNodes: Math.max(asn1js.DEFAULT_MAX_NODES, Math.ceil(toUint8Array(raw).byteLength / 2)) };
}

/**
 * Decodes BER with {@link berOptions}.
 * @param raw BER-encoded data
 * @returns asn1js decoding result
 */
export function fromBER(raw: BufferSource): asn1js.FromBerResult {
  return asn1js.fromBER(raw, berOptions(raw));
}
