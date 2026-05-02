# `@monitext/nstack`

A robust, multi-engine stack trace parser designed to handle the messy reality of JavaScript error stacks across V8 (Node/Chrome), Firefox, Bun, Deno, and beyond.

Unlike naive regex-based parsers that break on spaces, drive letters, or complex paths, `nstack` uses a **composed heuristic pipeline**—multiple specialized backends working together to extract resources and coordinates with surgical precision.

---

## 🚀 Installation

```bash
npm install @monitext/nstack
# or
pnpm add @monitext/nstack
# or
yarn add @monitext/nstack
```

---

## 🛠️ Usage

### Basic: Parse Stack Traces

```typescript
import { interpretErrorStack } from '@monitext/nstack';

try {
	throw new Error('Something went wrong');
} catch (err) {
	const stack = interpretErrorStack(err);

	stack.forEach((line) => {
		if (line.processed) {
			console.log(`Backends: ${line.backend.join(', ')}`);
			console.log(`Path: ${line.resource}`);
			console.log(`Line/Col: ${line.coord.line}:${line.coord.column}`);
		} else {
			console.warn(`Unparsed line: ${line.raw}`);
		}
	});
}
```

### Simplified: Get Clean Frames

```typescript
import { parseError } from '@monitext/nstack';

try {
	throw new Error('Boom');
} catch (err) {
	const frames = parseError(err);

	frames.forEach((frame) => {
		console.log(`Path: ${frame.path}`);
		console.log(`Line: ${frame.line}, Col: ${frame.column}`);
		console.log(`Resolved by: ${frame.resolvedBy}`);
		if (frame.transforms.length > 0) {
			console.log(`Transforms: ${frame.transforms.join(' → ')}`);
		}
	});
}
```

---

## 🧠 The Multi-Engine Strategy

`nstack` doesn't guess. It iterates through **five specialized backends** to find the most justifiable path extraction, with automatic re-parsing for nested structures.

| Backend           | Purpose                                  | Target Format Examples                 |
| :---------------- | :--------------------------------------- | :------------------------------------- |
| **`parenthesis`** | Structural extraction within `(...)`     | `at method (/path/to/file.ts:10:2)`    |
| **`forward`**     | Scans for strong protocol/drive anchors  | `node:internal/modules/cjs/loader:1:1` |
| **`reverse`**     | Backward heuristic for file-system paths | `/Users/cat/My Projects/index.js:5:2`  |
| **`extension`**   | Fallback for paths with valid extensions | `/var/www/app/dist/server.js`          |
| **`single-file`** | Catches standalone filenames             | `Error in server.js`                   |

> **Backend Composition:** When a backend returns `reparse: true`, the pipeline automatically re-analyzes the extracted resource. This enables handling of nested eval chains like `eval (eval at load (http://host/app.js:10:2), <anonymous>:1:1)`.

---

## 🔍 Extraction Backends in Detail

### 1. Parenthesis Backend

Handles V8-style frames with structural integrity. Uses a **stack-based balance algorithm** to find matching parentheses, avoiding errors with nested structures.

- **Safe for:** Paths containing spaces, complex characters, or nested eval chains
- **Specialty:** Recursively unwraps nested eval structures to find the original source
- **Example:** `at eval (eval at run (/home/user/app.js:10:3), <anonymous>:1:1)` → `/home/user/app.js`

### 2. Forward Backend

The "Optimistic" extractor. Looks for **high-confidence anchors** at the start of resource paths:

- **Protocols (Score: 10):** `http://`, `https://`, `file://`, `webpack:///`, `vite://`
- **Windows Drives (Score: 9):** `C:\`, `D:/`
- **Runtime Prefixes (Score: 8):** `node:`, `bun:`, `native:`, `rsc:`
- **Virtual URIs (Score: 7):** `blob:`, `data:`

Uses a **consolidated master regex** for efficient pattern matching with a scoring hierarchy.

### 3. Reverse Backend

The "Heuristic" extractor. Walks backward from line/column coordinates to find the resource start.

- **Space Handling:** Allows spaces if preceded by a directory separator (`/` or `\`)
- **Safety:** Rejects plain filenames without separators to avoid capturing function names
- **Example:** `/path/with spaces/and (parentheses)/file name.ts:9:2` → `/path/with spaces/and (parentheses)/file name.ts`

### 4. Extension Backend

Fallback resolver for paths with **valid file extensions** but missing line/column anchors.

- **Valid Extensions:** `.js`, `.jsx`, `.cjs`, `.mjs`, `.ts`, `.cts`, `.mts`, `.tsx`, `.svelte`, `.ripple`, `.c`, `.cpp`, `.rs`, `.vue`, `.json`, `.map`, `.node`, `.wasm`, `.mdx`, `.md`, `.html`
- **Requirement:** Must be preceded by a directory separator
- **Behavior:** Appends `:?:?` placeholder coordinates for re-parsing
- **Example:** `/var/www/app/dist/server.js` → `/var/www/app/dist/server.js:?:?`

### 5. Single-File Backend

Catches **standalone filenames** without directory information.

- **Pattern:** Matches filenames surrounded by parentheses, whitespace, or at string boundaries
- **Use Case:** Top-level error messages or simplified console logs
- **Example:** `Error in server.js` → `server.js:?:?`

---

## 📊 Data Structures

### `ParsedStackLine` (Low-Level)

The raw output from `interpretErrorStack()`:

```typescript
type ParsedStackLine =
	| {
			processed: true;
			backend: Backend[]; // Array of backends used (in order)
			raw: string; // Original line
			resource: string; // Extracted File Path / URL
			coord: {
				startIndex: number;
				endIndex: number;
				line: number | null;
				column: number | null;
				coordStr: string; // e.g., ":10:2"
			};
	  }
	| {
			processed: false;
			raw: string;
			coord: RawCoordinate | null;
	  };

type Backend = 'forward' | 'reverse' | 'parenthesis' | 'extension' | 'single-file';
```

### `ParsedFrame` (High-Level)

The clean output from `parseError()`:

```typescript
type ParsedFrame = {
	raw: string; // Original line
	path: string | null; // Extracted path (or null if unparseable)
	line: number | null; // Line number (or null)
	column: number | null; // Column number (or null)
	resolvedBy: string | null; // Final backend that resolved the path
	transforms: Backend[]; // Backends used before final resolution
};
```

---

## ⚖️ Why use `nstack`?

Standard parsers often fail when:

1. **Paths have spaces:** `/home/user/my projects/app.js:10:5`
2. **Nested eval chains:** `eval (eval at load (http://host/app.js:10:2), <anonymous>:1:1)`
3. **Cross-runtime:** Mixing traces from browser (URL-based) and Node.js (file-based)
4. **Complex paths:** `/path/with (parentheses)/and spaces/file.ts:1:1`
5. **Missing coordinates:** `Error in server.js` (no line/column info)
6. **Windows paths:** `C:\Program Files\nodejs\node_modules\lib\index.js:10:2`
7. **Protocol variations:** `webpack:///`, `vite://localhost`, `blob:`, `node:`

`nstack` treats stack parsing as a **coordinated effort** between multiple specialized engines, with automatic re-parsing for nested structures.

---

## 🎯 Recent Improvements

### v0.1.0 (Latest)

#### New Features

- ✨ **`parseError()` function** - High-level API returning clean `ParsedFrame` objects
- ✨ **`extension` backend** - Handles paths with valid extensions but no coordinates
- ✨ **`single-file` backend** - Catches standalone filenames (e.g., `server.js`)
- ✨ **`ParsedFrame` type** - Simplified data structure with `path`, `line`, `column`, `resolvedBy`, and `transforms`

#### Optimizations

- 🚀 **`parenthesis` backend** - Rewritten with stack-based balance algorithm for correct nested parenthesis matching
- 🚀 **`forward` backend** - Consolidated master regex with scoring hierarchy (10-7) for anchor detection
- 🚀 **`reverse` backend** - Improved space handling and safety checks
- 🚀 **Coordinate resolution** - Now tracks both `startIndex` and `endIndex` for precise slicing

#### Bug Fixes

- 🐛 Fixed character consumption overshoot in `reverse` backend for paths with spaces
- 🐛 Aligned coordinate output from resolver and locate functions

---

## 📝 Sample Output

Code to produce this sample output can be found in our GitHub: `sketch/playground`

```yaml
# Parenthesis backend (standard V8 format)
- Backend: parenthesis
  Raw: at Object.<anonymous> (/home/cat/dev/project/src/index.ts:12:5)
  Path: /home/cat/dev/project/src/index.ts
  Line/Col: 12:5

# Forward backend (protocol prefix)
- Backend: forward
  Raw: at file:///Users/cat/dev/esm/module.mjs:55:9
  Path: file:///Users/cat/dev/esm/module.mjs
  Line/Col: 55:9

# Forward backend (runtime prefix)
- Backend: forward
  Raw: at node:internal/modules/cjs/loader:1256:14
  Path: node:internal/modules/cjs/loader
  Line/Col: 1256:14

# Forward backend (Windows drive)
- Backend: forward
  Raw: at C:\Users\cat\Desktop\test project\app.js:42:13
  Path: C:\Users\cat\Desktop\test project\app.js
  Line/Col: 42:13

# Reverse backend (path with spaces)
- Backend: reverse
  Raw: at /path/with spaces/and (parentheses)/file name.ts:9:2
  Path: /path/with spaces/and (parentheses)/file name.ts
  Line/Col: 9:2

# Extension backend (no coordinates, valid extension)
- Backend: extension
  Raw: at /var/www/app/dist/server.js
  Path: /var/www/app/dist/server.js
  Line/Col: null:null

# Single-file backend (standalone filename)
- Backend: single-file
  Raw: Error in server.js
  Path: server.js
  Line/Col: null:null

# Multi-backend composition (nested eval)
- Backend: parenthesis,extension
  Raw: at eval (eval at run (/home/cat/dev/app.js:10:3), <anonymous>:1:1)
  Path: /home/cat/dev/app.js
  Line/Col: 10:3

# Multi-backend composition (eval with forward)
- Backend: parenthesis,forward
  Raw: at eval (eval at run (C:\dev\app\runner.js:22:5), <anonymous>:5:10)
  Path: C:\dev\app\runner.js
  Line/Col: 22:5

# Unparsed (no valid resource found)
- Unparsed line: at new Function (<anonymous>)
- Unparsed line: at async Promise.all (index 0)
```

---

## 📜 Supported File Extensions

The `extension` and `single-file` backends recognize these extensions:

`.js`, `.jsx`, `.cjs`, `.mjs`, `.ts`, `.cts`, `.mts`, `.tsx`, `.svelte`, `.ripple`, `.c`, `.cpp`, `.rs`, `.vue`, `.json`, `.map`, `.node`, `.wasm`, `.mdx`, `.md`, `.html`

---

## LICENSE

Apache 2.0

---

_Part of the **Monitext** observability ecosystem._
