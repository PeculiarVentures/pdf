<h1 align="center">
  @peculiar/pdf-font
</h1>

<div align="center">

![GitHub License](https://img.shields.io/github/license/PeculiarVentures/pdf)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/pdf/release.yml?branch=main&label=release)
[![npm version](https://img.shields.io/npm/v/@peculiar/pdf-font.svg)](https://www.npmjs.com/package/@peculiar/pdf-font)
[![npm downloads](https://img.shields.io/npm/dm/@peculiar/pdf-font.svg)](https://www.npmjs.com/package/@peculiar/pdf-font)

</div>

A library for working with fonts in PDF documents, providing utilities for font loading, embedding, and text rendering.

## Installation

```bash
npm install @peculiar/pdf-font
```

## Breaking Changes In v2

v2 is ESM-only and requires Node.js `^20.19.0 || >=22.12.0` (1.x declared no `engines`). CommonJS code can still `require("@peculiar/pdf-font")` on these versions; Node.js 22.0–22.11 can't. See the [full notes](https://github.com/PeculiarVentures/pdf#breaking-changes-in-v2).

- **TypeScript compiling to CommonJS:** use `"module": "node20"` or `"nodenext"` (`node16` fails with TS1479). ESM and bundler setups need no changes.
- **Jest in CommonJS mode:** switch to ESM mode or Vitest, or configure an ESM-to-CommonJS transformer and make sure `transformIgnorePatterns` doesn't exclude the `@peculiar/*` packages.
- **Deep imports** (`@peculiar/pdf-font/build/...`) are blocked by `exports`; import from `@peculiar/pdf-font`.
- **Peer dependencies:** `@peculiar/asn1-schema` (`^3.0.0`) is a peer, shared with the other `@peculiar/asn1-*` packages in your app. npm installs peers automatically.

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
