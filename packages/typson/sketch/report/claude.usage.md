# Typson Usage Sketch

## Sample

```ts
import { ty, Infer } from "@monitext/typson";

// --- Function schema ---
const func = ty.function({
  expect: ty.array({ items: ty.string() }),
  /**
   * If return type is a promise, the wrapped function result is itself
   * wrapped in a promise that performs type checking on resolution.
   */
  return: ty.promise(ty.void())
});

const autoTypedFn = func.wrap(actualFn); // (param: string[]) => [err, data]

// --- Standalone promise schema ---
const asyncSchema = ty.promise(ty.null());

// --- Object schema ---
const config = ty.object({
  properties: {
    test: ty.string(),
    pass: ty.boolean({ default: true })
  },
  additionalProperties: true,
  required: ["test"]
});

// Parse — applies defaults, returns Infer<typeof config> | null, no throw
const bar = config.parse({ test: "2" });

// Type guard — narrows to Infer<typeof config>
const isValid = config.is({ test: "1", pass: false });

// Assert — throws if invalid, returns Infer<typeof config>
config.assert({ test: "1", pass: false });

// Schema property access via $ prefix — each node carries the full contract
config.$test.is("hello");
config.$test.assert(42);
config.$test.parse(someInput);

// Nested drill-down
const nested = ty.object({
  properties: {
    meta: ty.object({
      properties: { id: ty.string() }
    })
  }
});

nested.$meta.$id.assert("abc");

// --- Type inference ---
type Config = Infer<typeof config>;
```

## Direction

Typson is a unified type system where schemas are executable contracts that produce both runtime guarantees and compile-time inference.

---

## Design Notes

### What the API got right

**Uniform node contract.** Every `ty.*` node exposes the same three methods — `parse`, `is`, `assert` — regardless of whether it's a string, object, or promise. This composability means there's nothing special to learn when you drill into `config.$test`; it behaves identically to `config` itself. That uniformity is load-bearing — protect it.

**`[err, data]` from `func.wrap`.** Go-style tuple returns fit naturally here. A schema-wrapped function that throws on contract violation would be surprising; one that returns a typed error channel is not. This is the most distinctive surface in the library.

**`$` prefix for schema access.** Zero collision risk, immediately readable, and the convention is already familiar from reactive ecosystems. `config.$test` reads as "the schema for test" without any explanation needed.

---

### Things to nail down before implementation

**Error shape from `func.wrap`.** The `err` in `[err, data]` needs a concrete type. A raw `Error` loses schema context; a Typson-specific error object (e.g. `{ path, expected, received }`) is far more useful — especially given the `@monitext` namespace where observability is already in scope. Schema violations as structured, traceable events would be a natural integration point.

**`parse` return on failure.** Currently sketched as `Infer<typeof config> | null`. Consider whether `null` is enough or if a `{ defaults: ..., errors: ... }` shape would be more useful in practice. `null` is simpler; the richer shape is more debuggable.

**Promise resolution checking.** The comment says type checking happens "along the way" on resolution — but this needs a concrete behavioral spec. Does `func.wrap` return `[err, data]` synchronously with a Promise as `data`, or does it return a Promise of `[err, data]`? The async tuple pattern matters for how callers consume it:

```ts
// Option A — data is a Promise
const [err, promise] = autoTypedFn(args);
const result = await promise;

// Option B — whole thing is awaitable
const [err, result] = await autoTypedFn(args);
```

Option B is almost certainly what you want.

**`$` TypeScript inference depth.** Make sure `$`-prefixed properties are fully generic on the object schema type, not typed as `Record<string, TyNode>`. Losing inference on nested property names at `config.$meta.$id` would undermine the whole point of the drill-down.

---

### Open questions worth deciding early

- Does `ty.function` validate on every call, or only when wrapped? (i.e. is the schema inert until `wrap` is called?)
- Does `additionalProperties: true` mean unknown keys pass through into the parsed result, or are they stripped?
- Is there a `ty.union`, `ty.literal`, `ty.enum`? The primitives sketch implies yes — worth roughing those out early since they affect how `Infer` needs to be typed.
