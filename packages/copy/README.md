<h1 align="center">
  @peculiar/pdf-copy
</h1>

<div align="center">

![GitHub License](https://img.shields.io/github/license/PeculiarVentures/pdf)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/pdf/release.yml?branch=main&label=release)
[![npm version](https://img.shields.io/npm/v/@peculiar/pdf-copy.svg)](https://www.npmjs.com/package/@peculiar/pdf-copy)
[![npm downloads](https://img.shields.io/npm/dm/@peculiar/pdf-copy.svg)](https://www.npmjs.com/package/@peculiar/pdf-copy)

</div>

A TypeScript library for copying and merging PDF documents. This module allows you to recreate PDF documents using specified filters, with support for forms, annotations, and document-level features.

## Installation

```bash
npm install @peculiar/pdf-copy
```

## Breaking Changes In v2

v2 is ESM-only and requires Node.js `^20.19.0 || >=22.12.0` (1.x declared no `engines`). CommonJS code can still `require("@peculiar/pdf-copy")` on these versions; Node.js 22.0–22.11 can't. See the [full notes](https://github.com/PeculiarVentures/pdf#breaking-changes-in-v2).

- **TypeScript compiling to CommonJS:** use `"module": "node20"` or `"nodenext"` (`node16` fails with TS1479). ESM and bundler setups need no changes.
- **Jest in CommonJS mode:** switch to ESM mode or Vitest, or configure an ESM-to-CommonJS transformer and make sure `transformIgnorePatterns` doesn't exclude the `@peculiar/*` packages.
- **Deep imports** (`@peculiar/pdf-copy/build/...`) are blocked by `exports`; import from `@peculiar/pdf-copy`.

## Usage

### Basic Document Copy

```typescript
import { PDFDocument } from "@peculiar/pdf-core";
import { PDFCopier } from "@peculiar/pdf-copy";

// Create a new copier instance
const copier = await PDFCopier.create();

// Load source document
const sourceDoc = await PDFDocument.fromPDF(sourcePdfBuffer);

// Copy entire document
copier.append(sourceDoc);

// Save the resulting document
const newPdfBuffer = await copier.save();
```

### Copying Specific Pages

```typescript
// Copy specific pages using page filters
copier.append(sourceDoc, {
  pages: [
    1, // Single page
    [2, 4], // Page range
    [5, undefined], // From page 5 to end
    [undefined, 3], // From start to page 3
  ],
});
```

### Creating with Options

```typescript
const copier = await PDFCopier.create({
  version: 2.0,
  disableCompressedObjects: true,
  disableCompressedStreams: true,
  useXRefTable: true,
  algorithm: "AESV3", // Encryption algorithm
  userPassword: "user123",
  ownerPassword: "owner123",
});
```

### Tracking Copy Progress

```typescript
copier.append(sourceDoc, {
  progressCallback: (info) => {
    console.log("Changed object indexes:", info.changedIndexes);
  },
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
