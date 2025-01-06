# `@peculiar/pdf-font`

A library for working with fonts in PDF documents, providing utilities for font loading, embedding, and text rendering.

## Installation

```bash
npm install @peculiar/pdf-font
```

## Usage

### Basic Font Operations

```typescript
import { FontFactory, DefaultFonts } from "@peculiar/pdf-font";

// Use default font
const helvetica = FontFactory.createDefault(DefaultFonts.Helvetica);

// Load custom TrueType font
const fontBuffer = await loadFontFile("path/to/font.ttf");
const customFont = FontFactory.create(fontBuffer);
```

### Working with Font Metrics

```typescript
// Get font metrics
const metrics = font.fontInfo;
console.log(metrics.ascent); // Font ascender
console.log(metrics.descent); // Font descender
console.log(metrics.unitsPerEm); // Font units per em

// Get glyph information
const glyph = font.findGlyph(unicodeCodePoint);
console.log(glyph.advanceWidth); // Glyph width
console.log(glyph.unicode); // Unicode values
```

### Font Information

```typescript
// Access font name information
const fontName = font.fontInfo.name;
console.log(fontName.fontFamily); // Font family name
console.log(fontName.fullName); // Full font name
console.log(fontName.postScriptName); // PostScript name
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
