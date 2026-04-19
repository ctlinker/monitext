# Monitext Documentation Specification for AI Agents

This document defines the structure and conventions for managing documentation in the Monitext monorepo.

## Structure

Documentation is managed using VitePress and is located in the `docs/` directory.

### Package Documentation

Package documentation is stored in:
`docs/packages/<package-name>/src/<version>/`

- `<package-name>`: The name of the package (e.g., `nstack`, `nbus`).
- `<version>`: The version of the documentation (e.g., `v0.0.1`).
- `index.md`: The main landing page for that version.

### Automatic Versioning

The VitePress configuration dynamically discovers packages and versions.

- The highest version found in `docs/packages/<pkg>/src/` is automatically alias as `/latest/`.
- Sidebars are generated based on the files present in the version directory.

## Contribution Guidelines

### Adding a New Package

1. Create a directory: `docs/packages/<your-package>/src/v0.0.0/`.
2. Add an `index.md` file.
3. The package will automatically appear in the "Packages" navigation dropdown.

### Adding a New Version

1. Copy the current version directory: `cp -r docs/packages/<pkg>/src/v<old> docs/packages/<pkg>/src/v<new>`.
2. Update the content as needed.

### Editing Documentation

- Documentation uses standard Markdown.
- Sidebars are dynamic, so adding a new `.md` file to a version directory will automatically add it to the "Guides" section of the sidebar for that version.

### Syncing READMEs and CHANGELOGs

The `packages/*/README.md` and `packages/*/CHANGELOG.md` files are used as documentation entry points. The `docs/scripts/sync-latest.js` script handles this automatically:

1. `README.md` is synced to `index.md` (Quick Start).
2. `CHANGELOG.md` is synced to `changelog.md` (Changelog).

These files are automatically detected and added to the "Getting Started" section of the sidebar.

## Dynamic Features

- The `rewrites` configuration maps `packages/:pkg/src/:ver/:slug*` to `/:pkg/:ver/:slug*`.
- Accessing `/:pkg/latest/` will always resolve to the highest found version.
