# `@peculiar/pdf-core`

A powerful and flexible TypeScript library for PDF document manipulation, supporting both creation and modification of PDF files. The library provides comprehensive functionality for working with PDF objects, incremental updates, cross-reference tables, and encryption.

## Installation

```bash
npm install @peculiar/pdf-core
```

## Usage

### Creating a New PDF Document

```typescript
import { PDFDocument } from "@peculiar/pdf-core";

// Create a new PDF document
const doc = PDFDocument.create();

// Add a new page
await doc.addPage();

// Convert to PDF buffer
const pdfBuffer = await doc.toPDF();
```

### Reading an Existing PDF

```typescript
import { PDFDocument } from "@peculiar/pdf-core";

// Read from buffer or string
const doc = await PDFDocument.fromPDF(existingPdfBuffer);

// Get the catalog
const catalog = doc.catalog;
```

### Working with Objects

```typescript
import { PDFDocument } from "@peculiar/pdf-core";

const doc = PDFDocument.create();

// Create basic objects
const numberObj = doc.createNumber(42);
const stringObj = doc.createString("Hello, PDF!");
const arrayObj = doc.createArray(doc.createNumber(1), doc.createString("item"));

// Create a dictionary
const dictObj = doc.createDictionary(
  ["Key1", doc.createNumber(1)],
  ["Key2", doc.createString("value")]
);

// Create stream
const streamObj = doc.createStream(new Uint8Array([1, 2, 3, 4]));

// Make objects indirect
const indirectObj = numberObj.makeIndirect();
```

### Incremental Updates

The library supports incremental updates, allowing you to modify PDF documents without rewriting the entire file. This approach preserves the original document's history and is more efficient for changes.

```typescript
const doc = await PDFDocument.fromPDF(existingPdfBuffer);

// Create new incremental update
await doc.createUpdate();

// Make modifications
const page = await doc.addPage();
// ... make other changes ...

// Save with incremental update
const updatedPdf = await doc.toPDF();
```

### XRef Support

The library handles both main XRef formats:

- Traditional XRef tables
- XRef streams (PDF 1.5+)

Both formats are automatically detected and processed when reading PDFs, and the library can write in either format.

### Encryption

The library implements a comprehensive Encryption Handler based on WebCrypto API, supporting both password protection and certificate-based (PKI) encryption methods. You can secure PDF documents with user and owner passwords, or use X.509 certificates for PKI-based encryption with granular permission controls.

## License

This project is dual-licensed under the AGPL-3.0 and a Commercial License:

### AGPL-3.0

The library is open-source and freely available under the terms of the Affero General Public License (AGPL-3.0). This ensures that modifications and usage in network-based applications (e.g., SaaS) must be shared under the same license.

You can use the library under AGPL-3.0 if:

- Your project is open-source and distributed under a compatible license
- Your use complies with the AGPL-3.0 requirements

### Commercial License

For use in proprietary, closed-source, or commercial projects where the AGPL is not suitable, a commercial license is available. This allows you to use the library without the AGPL's obligations.
