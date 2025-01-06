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
