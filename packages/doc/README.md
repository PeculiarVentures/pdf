# `@peculiar/pdf-doc`

High-level PDF document manipulation library built on top of `@peculiar/pdf-core`, providing simplified interfaces for common PDF operations.

## Installation

```bash
npm install @peculiar/pdf-doc
```

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
  pages: [1, 2] // Select pages
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
