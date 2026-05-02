# @monitext/nstack

## 0.1.1

### Patch Changes

- fixed minor bug in `forward` path extraction backend: "blob" protocol shadowed by "http" like

## 0.1.0

### Minor Changes

- optimised all path extraction/resoltion backend function
- added `extension` backend for previously non supported path (without :line:col)
- added new user facing function `parseError`
- added `single-file` backend to handle previously non supported file (without :line:col)

## 0.0.1

### Patch Changes

- fixed extra char consumption for backend `reverse` on `resource path` containing spaces
