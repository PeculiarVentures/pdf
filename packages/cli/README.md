<h1 align="center">
  @peculiar/pdf-cli
</h1>

<div align="center">

![GitHub License](https://img.shields.io/github/license/PeculiarVentures/pdf)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/PeculiarVentures/pdf/release.yml?branch=main&label=release)
[![npm version](https://img.shields.io/npm/v/@peculiar/pdf-cli.svg)](https://www.npmjs.com/package/@peculiar/pdf-cli)
[![npm downloads](https://img.shields.io/npm/dm/@peculiar/pdf-cli.svg)](https://www.npmjs.com/package/@peculiar/pdf-cli)

</div>

Command-line interface for PDF document manipulation and analysis.

## Installation

```bash
npm install -g @peculiar/pdf-cli
```

## Breaking Changes In v2

v2 requires Node.js `^20.19.0 || >=22.12.0` (1.x declared no `engines`). `pvpdf` is an ES module at `build/index.js` (was `build/index.cjs`); the commands are unchanged. See the [full notes](https://github.com/PeculiarVentures/pdf#breaking-changes-in-v2).

## Commands

### info

Displays detailed information about a PDF document.

```bash
pvpdf info <pdf-file>
```

Example:

```bash
pvpdf info document.pdf
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
