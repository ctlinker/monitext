# `@monitext/nstack`

A robust, multi-engine stack trace parser designed to handle the messy reality of JavaScript error stacks across V8 (Node/Chrome), Firefox, Bun, and Deno.

Unlike naive parsers that break on spaces or drive letters, `nstack` uses a **composed heuristic pipeline**—multiple focused strategies working together to extract resources and coordinates with precision.

---

## 🚀 Installation

```bash
npm install @monitext/nstack
# or
yarn add @monitext/nstack
```

---

## 🛠️ Usage

```typescript
import { interpretErrorStack } from "@monitext/nstack";

try {
    throw new Error("Something went wrong");
} catch (err) {
    const stack = interpretErrorStack(err);

    stack.forEach(line => {
        if (line.processed) {
            console.log(`Backend: ${line.backend}`);
            console.log(`Path: ${line.resource}`);
            console.log(`Line/Col: ${line.coord.line}:${line.coord.column}`);
        } else {
            console.warn(`Unparsed line: ${line.raw}`);
        }
    });
}
```

---

## 🧠 The Multi-Engine Strategy

`nstack` doesn't guess. It iterates through specialized backends to find the most "justifiable" path extraction.

| Backend | Logic | Target Format Examples |
| :--- | :--- | :--- |
| **`parenthesis`** | Structural extraction within `(...)` | `at method (/path/to/file.ts:10:2)` |
| **`forward`** | Scans for strong protocol/drive anchors | `node:internal/modules/cjs/loader:1:1` |
| **`reverse`** | Backward heuristic for file-system paths | `/Users/cat/My Projects/index.js:5:2` |

> Note: backends can automaticaly compose if required, (currently only for nested evals)

---

## 🔍 Extraction Backends in Detail

### 1. Parenthesis Backend

Strictly handles V8-style frames. It ensures structural integrity by matching `(` and `)` around coordinates.

* **Safe for:** Paths containing spaces or complex characters.
* **Fails on:** Nested parentheses (like `eval` stacks) to avoid ambiguous slicing.

> The `parenthesis` backend compose with any other backend in case of nested eval

### 2. Forward Backend

The "Optimistic" extractor. It looks for **Strong Anchors** at the start of strings:

* Protocols: `http://`, `https://`, `file://`, `webpack:///`.
* Runtimes: `node:`, `bun:`, `native:`.
* Windows: `C:\`, `D:/`, etc.

### 3. Reverse Backend

The "Heuristic" extractor. It walks backward from the line/column coordinates.

* **Space Handling:** It allows spaces if they are preceded by a directory separator (`/` or `\`), making it compatible with folders like `Program Files`.
* **Safety:** Rejects plain filenames without separators to avoid capturing function names as paths.

---

## 📊 Data Structures

### `ParsedStackLine`

```typescript
type ParsedStackLine = 
    | {
        processed: true;
        backend: "forward" | "reverse" | "parenthesis";
        raw: string;      // Original line
        resource: string; // Extracted File Path / URL
        coord: {
            line: number | null;
            column: number | null;
            coordStr: string;
        };
      }
    | {
        processed: false;
        raw: string;
        coord: RawCoordinate | null;
      };
```

---

## ⚖️ Why use `nstack`?

Standard parsers often fail when:

1. **Paths have spaces:** `/home/user/my projects/app.js`
2. **Anonymous functions:** `at Object.callback (index.js:10:5)` vs `at index.js:10:5`
3. **Cross-runtime:** Mixing traces from a browser (URL based) and Node.js (File based).

`nstack` treats stack parsing as a **coordinated effort** between multiple specialized engines rather than a single fragile Regex.

## Sample Output

Code to produce this sample output can be found on our github : `sketch/playground`

```yaml
- Backend: parenthesis
  Raw: at Object.<anonymous> (/home/cat/dev/project/src/index.ts:12:5)
  Path: /home/cat/dev/project/src/index.ts
  Line/Col: 12:5

- Backend: parenthesis
  Raw: at Module._compile (node:internal/modules/cjs/loader:1256:14)
  Path: node:internal/modules/cjs/loader
  Line/Col: 1256:14

- Backend: parenthesis
  Raw: at Module._extensions..js (node:internal/modules/cjs/loader:1310:10)
  Path: node:internal/modules/cjs/loader
  Line/Col: 1310:10

- Backend: parenthesis
  Raw: at run (/var/www/app/dist/server.js:88:23)
  Path: /var/www/app/dist/server.js
  Line/Col: 88:23

- Backend: parenthesis
  Raw: at processTicksAndRejections (node:internal/process/task_queues:96:5)
  Path: node:internal/process/task_queues
  Line/Col: 96:5

- Backend: forward
  Raw: at C:\Users\cat\Desktop\test project\app.js:42:13
  Path: C:\Users\cat\Desktop\test project\app.js
  Line/Col: 42:13

- Backend: parenthesis
  Raw: at Object.<anonymous> (C:\Program Files\nodejs\node_modules\lib\index.js:10:2)
  Path: C:\Program Files\nodejs\node_modules\lib\index.js
  Line/Col: 10:2

- Backend: parenthesis
  Raw: at fetchData (https://example.com/api/client.js:120:17)
  Path: https://example.com/api/client.js
  Line/Col: 120:17

- Backend: parenthesis
  Raw: at async main (https://cdn.example.com/bundle.min.js:1:9932)
  Path: https://cdn.example.com/bundle.min.js
  Line/Col: 1:9932

- Backend: forward
  Raw: at file:///Users/cat/dev/esm/module.mjs:55:9
  Path: file:///Users/cat/dev/esm/module.mjs
  Line/Col: 55:9

- Backend: forward
  Raw: at file:///C:/Users/cat/dev/esm/windows.mjs:101:33
  Path: file:///C:/Users/cat/dev/esm/windows.mjs
  Line/Col: 101:33

- Backend: forward
  Raw: at blob:https://example.com/3f1c9d2a-aaaa-bbbb-cccc-ddddeeeeffff:23:7
  Path: https://example.com/3f1c9d2a-aaaa-bbbb-cccc-ddddeeeeffff
  Line/Col: 23:7

- Backend: parenthesis,reverse
  Raw: at eval (eval at <anonymous> (/home/cat/dev/project/src/eval.ts:10:3), <anonymous>:1:1)
  Path: /home/cat/dev/project/src/eval.ts
  Line/Col: 10:3

- Backend: parenthesis,forward
  Raw: at eval (eval at run (C:\dev\app\runner.js:22:5), <anonymous>:5:10)
  Path: C:\dev\app\runner.js
  Line/Col: 22:5

- Unparsed line: at new Function (<anonymous>)

- Backend: parenthesis
  Raw: at Function.executeUserCode (node:vm:132:12)
  Path: node:vm
  Line/Col: 132:12

- Backend: forward
  Raw: at webpack:///src/components/Button.tsx:77:14
  Path: webpack:///src/components/Button.tsx
  Line/Col: 77:14

- Backend: forward
  Raw: at webpack:///(webpack)/bootstrap:19:1
  Path: webpack:///(webpack)/bootstrap
  Line/Col: 19:1

- Backend: forward
  Raw: at vite://localhost/src/main.ts:33:11
  Path: vite://localhost/src/main.ts
  Line/Col: 33:11

- Backend: forward
  Raw: at http://localhost:5173/src/App.tsx?t=1680000000000:45:21
  Path: http://localhost:5173/src/App.tsx?t=1680000000000
  Line/Col: 45:21

- Unparsed line: at async Promise.all (index 0)

- Unparsed line: at async Promise.allSettled (index 2)

- Unparsed line: at some weird line without coords

- Unparsed line: at another:broken:line

- Unparsed line: at maybe (missing:coord)

- Backend: reverse
  Raw: at /path/with spaces/and (parentheses)/file name.ts:9:2
  Path: /path/with spaces/and (parentheses)/file name.ts
  Line/Col: 9:2

- Backend: reverse
  Raw: at /path/with spaces and file name.ts:9:2
  Path: /path/with spaces and file name.ts
  Line/Col: 9:2

- Backend: forward
  Raw: at C:\path with spaces\file (copy).js:100:20
  Path: C:\path with spaces\file (copy).js
  Line/Col: 100:20

- Backend: forward
  Raw: at mixed://protocol/that/isnt/real:12:34
  Path: mixed://protocol/that/isnt/real
  Line/Col: 12:34

- Unparsed line: at /trailing/colon/path.ts:

- Unparsed line: at C:\weird\windows\path.js:

- Backend: reverse
  Raw: at index.ts:22
  Path: index.ts
  Line/Col: 22:null

- Backend: reverse
  Raw: at internal/process/execution.js:80:27
  Path: internal/process/execution.js
  Line/Col: 80:27

- Backend: forward
  Raw: at node:internal/main/run_main_module:23:47
  Path: node:internal/main/run_main_module
  Line/Col: 23:47

- Unparsed line: at <anonymous>

- Backend: parenthesis,reverse
  Raw: eval (eval at processJob (eval at bootstrap (eval at c (/home/cat/dev/project/src/eval.ts:10:3), <anonymous>:1:1), worker.js:5:2), runner.js:12:8)
  Path: /home/cat/dev/project/src/eval.ts
  Line/Col: 10:3
```

---

## LICENSE

Apache 2.0

---

*Part of the **Monitext** observability ecosystem.*
