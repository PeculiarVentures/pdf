<h1 align="center">
  pdf
</h1>

<div align="center">

![GitHub License](https://img.shields.io/github/license/PeculiarVentures/pdf)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/pdf/release.yml?branch=main&label=release)
![Coveralls](https://img.shields.io/coverallsCoverage/github/PeculiarVentures/pdf)

</div>

TypeScript libraries for PDF document creation and manipulation, with a focus on signing and encryption scenarios.

## Packages

- [core](packages/core) - Core functionality for PDF document manipulation and processing
- [doc](packages/doc) - PDF document creation and editing, forms and signatures
- [font](packages/font) - Font handling and management for PDF documents
- [copy](packages/copy) - Module for recreating PDF documents using specified filters
- [form-json](packages/form-json) - JSON form data handling for PDF documents
- [repair](packages/repair) - Tools for repairing and fixing corrupted PDF documents
- [cli](packages/cli) - Command-line interface for PDF document manipulation and analysis (`pvpdf`)

`packages/tests` holds private test helpers and is not published.

## Installation

```bash
npm install @peculiar/pdf-doc reflect-metadata
```

npm 7+ also installs the peer dependencies (`@peculiar/x509`, `pkijs`, `asn1js`, `@peculiar/asn1-schema`). The packages run on Node.js `^20.19.0 || >=22.12.0` and in browsers through a bundler. Any WebCrypto implementation works: Node.js's `globalThis.crypto`, the browser's, or `@peculiar/webcrypto` 2.

## Breaking Changes In v2

v2 is ESM-only and requires Node.js `^20.19.0 || >=22.12.0` (1.x declared no `engines`). All `@peculiar/pdf-*` packages move to v2 together; don't mix them with 1.x packages. CommonJS code can still `require()` them on these versions; Node.js 22.0–22.11 can't (`ERR_REQUIRE_ESM`).

- **One ESM build per package:** the CommonJS `build/index.js` and the ESM `build/index.mjs` are replaced by one ES module, `build/index.js`, with `build/index.d.ts`. The `pvpdf` binary is `build/index.js` (was `build/index.cjs`). Deep imports into `build/` are blocked by `exports`.
- **TypeScript compiling to CommonJS:** use `"module": "node20"` or `"nodenext"` (`node16` fails with TS1479). ESM and bundler setups need no changes.
- **Jest in CommonJS mode:** switch to ESM mode or Vitest, or configure an ESM-to-CommonJS transformer and make sure `transformIgnorePatterns` doesn't exclude the `@peculiar/*` packages, `pkijs` and `asn1js`.
- **Peer dependencies:** pdf takes and returns `@peculiar/x509` certificates and pkijs objects, checks them with `instanceof`, and uses the pkijs engine and x509 crypto provider your app sets, so they must be your app's copies. `@peculiar/x509` `^3.1.0` and `pkijs` `^4.0.0` are peers of pdf-core and pdf-doc, `asn1js` `^4.0.0` of pdf-doc, and `@peculiar/asn1-schema` `^3.0.0` of pdf-doc and pdf-font. A conflicting version now fails at install (`ERESOLVE`) instead of at runtime.
- **x509 3, pkijs 4, asn1js 4:** objects created with x509 1/2, pkijs 3 or asn1js 3 fail the `instanceof` checks; see their breaking changes ([x509](https://github.com/PeculiarVentures/x509#breaking-changes-in-v3), [PKI.js](https://github.com/PeculiarVentures/PKI.js#breaking-changes-in-v4), [ASN1.js](https://github.com/PeculiarVentures/ASN1.js#breaking-changes-in-v4)). If you use `@peculiar/webcrypto`, use v2: x509 3 next to webcrypto 1 fails ECDSA signing.
- **Reflect polyfill:** `@peculiar/x509` 3 no longer loads one (x509 1 did). Import `reflect-metadata` (or `core-js/full/reflect`, or `@abraham/reflection`) once, before any other import. Without it, loading pdf fails with `tsyringe requires a reflect polyfill`.
- **`@peculiar/utils` replaces `pvtsutils` and `pvutils`:** `BufferSource` in pdf's signatures is `@peculiar/utils`' type (`ArrayBuffer`, `SharedArrayBuffer` or any `ArrayBufferView`). Malformed UTF-8 and lone surrogates now decode or encode to U+FFFD instead of throwing `URIError`. The signing callback receives `Uint8Array<ArrayBuffer>`.
- **`ArrayBuffer` results:** methods declared to return `ArrayBuffer` now always do (a copy that holds exactly the result). Some returned a `Uint8Array` before (`PDFStream.encode`/`decode`, the CCITTFax/JBIG2/LZW/JPX filters, `PDFCopier.save`), `JPXFilter` returned the whole file buffer, and `Image.export()` returned PNG data followed by zero padding.

pdf-core keeps the `events` package for `PDFContent`, which extends `EventEmitter`: Node.js resolves `events` to its built-in module, and bundlers for browsers use the package.

## Usage

```ts
import "reflect-metadata";
import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import { PDFCryptoEngine } from "@peculiar/pdf-core";
import { PDFDocument } from "@peculiar/pdf-doc";

// The engine pdf uses for signing, verification and encryption (RC4, MD5 and the PDF padding rules).
pkijs.setEngine("pdf", new PDFCryptoEngine({ name: "pdf", crypto }));
x509.cryptoProvider.set(crypto);

const doc = await PDFDocument.load(pdfBytes);
const result = await doc.verify();
for (const item of result.items) {
  console.log(item.states.map((state) => `${state.code}: ${state.type}`));
}
```

See the package READMEs for creating documents, forms, signing and encryption.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is dual-licensed under the AGPL-3.0 and a Commercial License:

### AGPL-3.0

The library is open-source and freely available under the terms of the Affero General Public License (AGPL-3.0). This ensures that modifications and usage in network-based applications (e.g., SaaS) must be shared under the same license.

You can use the library under AGPL-3.0 if:

- Your project is open-source and distributed under a compatible license
- Your use complies with the AGPL-3.0 requirements

### Commercial License

For use in proprietary, closed-source, or commercial projects where the AGPL is not suitable, a commercial license is available. This allows you to use the library without the AGPL's obligations.
