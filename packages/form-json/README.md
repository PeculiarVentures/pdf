# `@peculiar/pdf-form-json`

`@peculiar/pdf-form-json` is a library for working with PDF form data in JSON format. This library provides a FormConverter class that can convert a PDF document with form data into a JSON representation of that data, and also set values on form components based on a JSON payload.

## Installation

Using npm:

```bash
npm install @peculiar/pdf-form-json
```

Using yarn:

```bash
yarn add @peculiar/pdf-form-json
```

## Usage

### Import

```typescript
import { FormConverter } from "@peculiar/pdf-form-json";
```

### Export Form Data to JSON

The export method of the `FormConverter` class can be used to convert a PDF document with form data into a JSON representation of that data. The returned JSON will be of the format:

```typescript
{
  form: {
    [componentName: string]: {
      type: string,
      id: string,
      name: string,
      position: {
        left: number,
        top: number,
        height: number,
        width: number,
      },
      flags: {
        hidden: boolean,
        invisible: boolean,
        locked: boolean,
        lockedContents: boolean,
        noExport: boolean,
        noRotate: boolean,
        noView: boolean,
        noZoom: boolean,
        print: boolean,
        readOnly: boolean,
        readOnlyAnnot: boolean,
        required: boolean,
        toggleNoView: boolean,
      },
      [otherProperties: string]: any,
    },
    ...
  }
}
```

```typescript
import fs from "fs";
import { PDFDocument } from ("@peculiar/pdf-doc");
import { globalFormConverter } from ("@peculiar/pdf-form-json");

// Load PDF document
const pdfBytes = fs.readFileSync("input.pdf");
const pdfDoc = await PDFDocument.load(pdfBytes);

// Export form data to JSON
const formData = globalFormConverter.export(pdfDoc);

// Write JSON to file
fs.writeFileSync("output.json", JSON.stringify(formData, null, 2));
```

### Set Form Component Values from JSON

The setValue method of the FormConverter class can be used to set values on form components based on a JSON payload. The payload should be an array of objects, where each object represents a form component and its updated value. The objects should have the following properties:

- `name` (string): The name of the form component to update.
- `type` (string): The type of the form component to update.
- Additional properties for the specific form component type being updated.

```typescript
import fs from "fs";
import { PDFDocument } from ("@peculiar/pdf-doc");
import { globalFormConverter } from ("@peculiar/pdf-form-json");

// Load PDF document
const pdfBytes = fs.readFileSync("input.pdf");
const pdfDoc = await PDFDocument.load(pdfBytes);

// Update PDF form
globalFormConverter.setValue(doc, [
  {
    name: "Text1",
    type: "text_editor",
    text: "Some message",
  },
  {
    name: "Check Box2",
    type: "check_box",
    checked: true,
  },
  {
    name: "Check Box3",
    type: "check_box",
    checked: false,
  },
  {
    name: "Group4",
    type: "radio_button_group",
    selected: "Choice2",
  },
  {
    name: "Dropdown5",
    type: "combo_box",
    selected: ["option2"],
  }
]);

// Save file
const pdfRaw = await pdfDoc.save();
fs.writeFileSync("output.pdf", pdfRaw, {flags: "w+"})
```
