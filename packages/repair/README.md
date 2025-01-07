# `@peculiar/pdf-repair`

## Description

`@peculiar/pdf-repair` is an intuitive Node.js module, created to diagnose and correct issues within PDF documents. This module uses a suite of predefined rules to validate PDFs, address erroneous objects, insert missing mandatory fields in objects, and assure overall PDF coherence and compliance.

## Installation

```bash
npm install @peculiar/pdf-repair
```

## Features

- Identifying and correcting invalid or corrupted PDF objects.
- Ensuring mandatory fields within PDF objects are present and valid.
- Automatic repair of typical PDF consistency issues.
- A set of predefined rules for validation and repair.

## Usage

Example usage of `@peculiar/pdf-repair`:

```javascript
const fs = require("fs");
const { PDFDocument } = require("@peculiar/pdf-doc");
const PDFRepair = require("@peculiar/pdf-repair");

const data = fs.readFileSync("file.pdf");
const doc = PDFDocument.load(data);

const repair = new PDFRepair();
const repairNotes = await repair.repairDocument(doc);
console.log(repairNotes);

const raw = doc.save();
fs.writeFileSync("newFile.pdf", raw, { flag: "w+" });
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
