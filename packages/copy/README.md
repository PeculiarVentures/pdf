# `@peculiar/pdf-copy`

A TypeScript library for copying and merging PDF documents. This module allows you to recreate PDF documents using specified filters, with support for forms, annotations, and document-level features.

## Installation

```bash
npm install @peculiar/pdf-copy
```

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
    [undefined, 3] // From start to page 3
  ]
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
  ownerPassword: "owner123"
});
```

### Tracking Copy Progress

```typescript
copier.append(sourceDoc, {
  progressCallback: (info) => {
    console.log("Changed object indexes:", info.changedIndexes);
  }
});
```
