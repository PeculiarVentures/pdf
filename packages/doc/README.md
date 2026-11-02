<h1 align="center">
  @peculiar/pdf-doc
</h1>

<div align="center">

![GitHub License](https://img.shields.io/github/license/PeculiarVentures/pdf)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/pdf/release.yml?branch=main&label=release)
[![npm version](https://img.shields.io/npm/v/@peculiar/pdf-doc.svg)](https://www.npmjs.com/package/@peculiar/pdf-doc)
[![npm downloads](https://img.shields.io/npm/dm/@peculiar/pdf-doc.svg)](https://www.npmjs.com/package/@peculiar/pdf-doc)

</div>

High-level PDF document manipulation library built on top of `@peculiar/pdf-core`, providing simplified interfaces for common PDF operations.

## Installation

```bash
npm install @peculiar/pdf-doc reflect-metadata
```

## Breaking Changes In v2

v2 is ESM-only and requires Node.js `^20.19.0 || >=22.12.0` (1.x declared no `engines`). CommonJS code can still `require("@peculiar/pdf-doc")` on these versions; Node.js 22.0–22.11 can't. See the [full notes](https://github.com/PeculiarVentures/pdf#breaking-changes-in-v2) for the x509 3 / pkijs 4 changes, the Reflect polyfill and the `@peculiar/utils` differences.

- **TypeScript compiling to CommonJS:** use `"module": "node20"` or `"nodenext"` (`node16` fails with TS1479). ESM and bundler setups need no changes.
- **Jest in CommonJS mode:** switch to ESM mode or Vitest, or configure an ESM-to-CommonJS transformer and make sure `transformIgnorePatterns` doesn't exclude the `@peculiar/*` packages.
- **Deep imports** (`@peculiar/pdf-doc/build/...`) are blocked by `exports`; import from `@peculiar/pdf-doc`.
- **Peer dependencies:** `@peculiar/x509` (`^3.1.0`), `pkijs` (`^4.0.0`), `asn1js` (`^4.0.0`) and `@peculiar/asn1-schema` (`^3.0.0`) are peers, so certificates, CMS objects and the pkijs engine are your app's copies. npm installs peers automatically.
- **Reflect polyfill:** `@peculiar/x509` 3 no longer loads one. Import `reflect-metadata` (or another Reflect polyfill) once, before any other import.

## Usage

### Basic Document Operations

```typescript
import { PDFDocument } from "@peculiar/pdf-doc";

// Create and save document
const doc = await PDFDocument.create();
doc.pages.create();
const pdfBuffer = await doc.save();

// Load existing document
const loadedDoc = await PDFDocument.load(existingPdfBuffer);
```

### Working with Form Fields

```typescript
// Create form field
const doc = await PDFDocument.create();
const page = doc.pages.create();

// Text field
const textField = doc.getComponentByName("textField1", TextEditor);
textField.text = "Hello World";

// Signature field
const sigField = doc.getComponentByName("signature1", SignatureBox);
await sigField.sign(signParams);
```

### Page Management

```typescript
const doc = await PDFDocument.create();

// Add pages
doc.pages.create();
doc.pages.create();

// Clone with specific pages
const newDoc = await doc.clone({
  pages: [1, 2], // Select pages
});
```

## License

This project is dual-licensed under the AGPL-3.0 and a Commercial License:

### AGPL-3.0

The library is open-source and freely available under the terms of the Affero General Public License (AGPL-3.0). This ensures that modifications and usage in network-based applications (e.g., SaaS) must be shared under the same license.

You can use the library under AGPL-3.0 if:

- Your project is open-source and distributed under a compatible license
- Your use complies with the AGPL-3.0 requirements

### Commercial License

For use in proprietary, closed-source, or commercial projects where the AGPL is not suitable, a commercial license is available. This allows you to use the library without the AGPL's obligations.
