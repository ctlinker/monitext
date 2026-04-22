# Monitext.ts

## Built-in Workflow

```ts
import { builtInWorkflow } from '@monitext/core';

export const { send, mtxt, obs } = builtInWorkflow({
	mtxt: (data) => {
		console.log(data); // log your way or let the built in do it : { format: "json" | "text" | "html" | "markdown" | "toml" | "yaml" }
	},
	send: {
		url: 'https://monitext.dev/api/v1/workflow',
		project: '',
		apikey: '',
	},
});

mtxt.info('Hello World');
mtxt.error('Hello World', {
	stack: true,
	context: { user: 'John Doe' },
});

const test = mtxt.newLogger('test');
test.info('Hello World');
test.error('Hello World', { stack: true, context: { user: 'John Doe' } });

const safe = obs.safeRun(async () => {
	throw new Error('Hello World');
});

const [err, data] = await safe(); // export the error in this func
if (err) {
	console.log(err);
}
console.log(data);

obs.safe(fn);
obs.bench(fn, options);
obs.trace(fn);

// For a thousand call export how this function is performing on average
const run = obs.instrument(
	async () => {
		throw new Error('Hello World');
	},
	{
		safe: true,
		bench: { iterations: 1000 },
	},
);
const [err, data] = await run();

if (err) {
	console.log(err);
}

console.log(data);
```
