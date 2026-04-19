# @monitext/ncatch

Type-safe, Go-style error handling for synchronous and asynchronous JavaScript and TypeScript code.

`ncatch` helps you replace ad-hoc `try/catch` blocks with small tuple-based helpers:

- Success: `[null, data]`
- Failure: `[Error, null]`

## Install

```bash
pnpm add @monitext/ncatch
```

## Why

When you want explicit error handling without exceptions bubbling through your code, `ncatch` gives you a small set of helpers that:

- work with sync and async code
- normalize unknown thrown values into real `Error` instances
- preserve parameter and return types
- keep success and failure handling consistent

## Quick Start

```ts
import { tryCatch } from '@monitext/ncatch';

const [err, data] = tryCatch(() => JSON.parse('{"ok":true}'));

if (err) {
	console.error(err.message);
} else {
	console.log(data.ok);
}
```

Async code works the same way:

```ts
import { tryCatch } from '@monitext/ncatch';

const [err, user] = await tryCatch(async () => {
	return { id: 'u_123', name: 'Ada' };
});

if (err) {
	console.error(err.message);
} else {
	console.log(user.name);
}
```

## API

### `tryCatch`

Safely executes:

- a synchronous function
- an asynchronous function
- a `Promise`

```ts
import { tryCatch } from '@monitext/ncatch';

const [syncErr, syncData] = tryCatch(() => 42);
const [asyncErr, asyncData] = await tryCatch(async () => 42);
const [promiseErr, promiseData] = await tryCatch(Promise.resolve(42));
```

### `trySync`

Use when you want a sync-only helper.

```ts
import { trySync } from '@monitext/ncatch';

const [err, data] = trySync(() => {
	if (Math.random() > 0.5) throw new Error('boom');
	return 'ok';
});
```

### `tryAsync`

Use when you want an async-only helper.

```ts
import { tryAsync } from '@monitext/ncatch';

const [err, data] = await tryAsync(async () => {
	return { ok: true };
});
```

### `createSafeExecutor`

Wraps a function and returns a new function that never throws.

```ts
import { createSafeExecutor } from '@monitext/ncatch';

const safeDivide = createSafeExecutor((a: number, b: number) => {
	if (b === 0) throw new Error('Cannot divide by zero');
	return a / b;
});

const [err, result] = safeDivide(10, 2);
```

It also works for async functions:

```ts
import { createSafeExecutor } from '@monitext/ncatch';

const safeFetchUser = createSafeExecutor(async (id: string) => {
	return { id, active: true };
});

const [err, user] = await safeFetchUser('user_1');
```

### `createResult`

Creates a normalized result tuple in the shape `[error, data, meta]`.

```ts
import { createResult } from '@monitext/ncatch';

const result = createResult({
	error: null,
	data: { id: 'evt_1' },
	meta: { source: 'cache' },
});

// [null, { id: "evt_1" }, { source: "cache" }]
```

Non-`Error` values are converted into an `Error` instance automatically.

```ts
import { createResult } from '@monitext/ncatch';

const [err] = createResult({ error: 'something failed' });
console.log(err instanceof Error); // true
```

### `createError`

Normalizes unknown thrown values into a real `Error`.

```ts
import { createError } from '@monitext/ncatch';

const err = createError('raw failure');
console.log(err.message);
```

## Common Pattern

```ts
import { tryCatch } from '@monitext/ncatch';

export async function loadProfile(id: string) {
	const [err, profile] = await tryCatch(async () => {
		return { id, name: 'Lin' };
	});

	if (err) {
		return {
			ok: false as const,
			message: err.message,
		};
	}

	return {
		ok: true as const,
		profile,
	};
}
```

## Notes

- Thrown strings and other non-`Error` values are converted into `Error` instances.
- `tryCatch` returns a promise only when the input is async.
- `createSafeExecutor` preserves the wrapped function's parameter list.

## License

Apache-2.0
