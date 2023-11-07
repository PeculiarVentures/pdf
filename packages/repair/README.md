# `@peculiarventures/pdf-repair`

## Description
`@peculiarventures/pdf-repair` is an intuitive Node.js module, created to diagnose and correct issues within PDF documents. This module uses a suite of predefined rules to validate PDFs, address erroneous objects, insert missing mandatory fields in objects, and assure overall PDF coherence and compliance.

## Installation
```bash
npm install @peculiarventures/pdf-repair
```

## Features

- Identifying and correcting invalid or corrupted PDF objects.
- Ensuring mandatory fields within PDF objects are present and valid.
- Automatic repair of typical PDF consistency issues.
- A set of predefined rules for validation and repair.

## Usage

Example usage of `@peculiarventures/pdf-repair`:

```javascript
const fs = require('fs');
const { PDFDocument } = require('@peculiarventures/pdf-doc');
const PDFRepair = require('@peculiarventures/pdf-repair');

const data = fs.readFileSync("file.pdf");
const doc = PDFDocument.load(data);

const repair = new PDFRepair();
const repairNotes = await repair.repairDocument(doc);
console.log(repairNotes);

const raw = doc.save();
fs.writeFileSync("newFile.pdf", raw, { flag: "w+" });
```
