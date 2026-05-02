import { describe, expect, it } from 'vitest';
import { interpretErrorStack, parseError } from '../src/lib/parse';

function createErrorWithStack(stack: string) {
	const err = new Error('fixture');
	err.stack = stack;
	return err;
}

describe('interpretErrorStack', () => {
	it('returns an empty array for header-only stacks', () => {
		expect(interpretErrorStack(createErrorWithStack('Error'))).toEqual([]);
	});

	it('returns an empty array for empty stacks', () => {
		expect(interpretErrorStack(createErrorWithStack(''))).toEqual([]);
	});

	it('uses resource as the public field instead of path', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', '    at /home/cat/project/src/index.ts:12:8'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['reverse']);
		expect(result[0]?.raw).toBe('at /home/cat/project/src/index.ts:12:8');
		expect(result[0]?.resource).toBe('/home/cat/project/src/index.ts');
		expect(result[0]?.coord?.line).toBe(12);
		expect(result[0]?.coord?.column).toBe(8);
		expect(result[0]?.coord?.coordStr).toBe(':12:8');
	});

	it('parses parenthesized frames without keeping coordinates in the resource', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', '    at readConfig (/home/cat/with space/app.ts:44:2)'].join(
					'\n',
				),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['parenthesis']);
		expect(result[0]?.resource).toBe('/home/cat/with space/app.ts');
		expect(result[0]?.coord?.line).toBe(44);
		expect(result[0]?.coord?.column).toBe(2);
	});

	it('supports firefox style frames', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['TypeError: boom', 'at render@http://localhost:3000/src/main.ts:42:17'].join(
					'\n',
				),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['forward']);
		expect(result[0]?.resource).toBe('http://localhost:3000/src/main.ts');
		expect(result[0]?.coord?.line).toBe(42);
		expect(result[0]?.coord?.column).toBe(17);
	});

	it("does not treat arbitrary '@' inside a resource-like string as firefox format", () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'prefix /tmp/file.js@myprefix:12:3'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['reverse']);
		expect(result[0]?.resource).toBe('/tmp/file.js@myprefix');
		expect(result[0]?.coord?.line).toBe(12);
		expect(result[0]?.coord?.column).toBe(3);
	});

	it('handles windows paths with spaces without relying on token splitting', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				[
					'Error: boom',
					String.raw`    at load (C:\Program Files\My App\index.js:20:5)`,
				].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['parenthesis']);
		expect(result[0]?.resource).toBe(String.raw`C:\Program Files\My App\index.js`);
		expect(result[0]?.coord?.line).toBe(20);
		expect(result[0]?.coord?.column).toBe(5);
	});

	it("keeps nested eval lines intact instead of splitting on inner 'at'", () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				[
					'Error: boom',
					'    at eval (eval at loadConfig (http://localhost:5173/src/main.ts:30:12), <anonymous>:1:1)',
				].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['parenthesis', 'forward']);
		expect(result[0]?.resource).toBe('http://localhost:5173/src/main.ts');
		expect(result[0]?.coord?.line).toBe(30);
		expect(result[0]?.coord?.column).toBe(12);
	});

	it('handles node internal modules', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				[
					'Error: boom',
					'at Module._compile (node:internal/modules/cjs/loader:1256:14)',
				].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['parenthesis']);
		expect(result[0]?.raw).toBe(
			'at Module._compile (node:internal/modules/cjs/loader:1256:14)',
		);
		expect(result[0]?.resource).toBe('node:internal/modules/cjs/loader');
		expect(result[0]?.coord?.line).toBe(1256);
		expect(result[0]?.coord?.column).toBe(14);
		expect(result[0]?.coord?.coordStr).toBe(':1256:14');
	});

	it('handles webpack protocol URLs', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'at webpack:///src/components/Button.tsx:77:14'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['forward']);
		expect(result[0]?.resource).toBe('webpack:///src/components/Button.tsx');
		expect(result[0]?.coord?.line).toBe(77);
		expect(result[0]?.coord?.column).toBe(14);
	});

	it('handles blob URLs', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'at blob:https://example.com/3f1c9d2a:23:7'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['forward']);
		expect(result[0]?.resource).toBe('blob:https://example.com/3f1c9d2a');
		expect(result[0]?.coord?.line).toBe(23);
		expect(result[0]?.coord?.column).toBe(7);
	});

	it('handles paths with parentheses in directory names', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'at /path/with (parens)/file.ts:10:5'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['reverse']);
		expect(result[0]?.resource).toBe('/path/with (parens)/file.ts');
		expect(result[0]?.coord?.line).toBe(10);
		expect(result[0]?.coord?.column).toBe(5);
	});

	it('handles file:// protocol URLs', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'at file:///Users/cat/dev/esm/module.mjs:55:9'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['forward']);
		expect(result[0]?.resource).toBe('file:///Users/cat/dev/esm/module.mjs');
		expect(result[0]?.coord?.line).toBe(55);
		expect(result[0]?.coord?.column).toBe(9);
	});

	it('handles Windows paths with forward slashes', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'at C:/Users/cat/dev/app.js:100:20'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['forward']);
		expect(result[0]?.resource).toBe('C:/Users/cat/dev/app.js');
		expect(result[0]?.coord?.line).toBe(100);
		expect(result[0]?.coord?.column).toBe(20);
	});

	it('handles paths without column numbers', () => {
		const result = interpretErrorStack(
			createErrorWithStack(['Error: boom', 'at /home/cat/app.ts:42'].join('\n')),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toEqual(['reverse']);
		expect(result[0]?.resource).toBe('/home/cat/app.ts');
		expect(result[0]?.coord?.line).toBe(42);
		expect(result[0]?.coord?.column).toBeNull();
	});

	it('handles unparseable lines gracefully', () => {
		const result = interpretErrorStack(
			createErrorWithStack(
				['Error: boom', 'at some weird line without coords'].join('\n'),
			),
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.processed).toBe(false);
		expect(result[0]?.raw).toBe('at some weird line without coords');
		expect(result[0]?.coord).toBeNull();
	});

	it('handles multiple lines in a stack trace', () => {
		const stack = [
			'Error: Test error',
			'at Object.<anonymous> (/home/cat/dev/project/src/index.ts:12:5)',
			'at Module._compile (node:internal/modules/cjs/loader:1256:14)',
			'at Module._extensions..js (node:internal/modules/cjs/loader:1310:10)',
			'at run (/var/www/app/dist/server.js:88:23)',
		].join('\n');

		const result = interpretErrorStack(createErrorWithStack(stack));

		expect(result).toHaveLength(4);
		expect(result[0]?.processed).toBe(true);
		expect(result[0]?.backend).toContain('parenthesis');
		expect(result[0]?.resource).toBe('/home/cat/dev/project/src/index.ts');
	});
});

describe('parseError', () => {
	it('returns ParsedFrame array with all fields', () => {
		const stack = [
			'Error: Test error',
			'at /home/cat/dev/project/src/index.ts:12:5',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			raw: 'at /home/cat/dev/project/src/index.ts:12:5',
			path: '/home/cat/dev/project/src/index.ts',
			line: 12,
			column: 5,
			resolvedBy: 'reverse',
			transforms: [],
		});
	});

	it('returns null values for unparseable lines', () => {
		const stack = ['Error: Test error', 'at some weird line without coords'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			raw: 'at some weird line without coords',
			path: null,
			line: null,
			column: null,
			resolvedBy: null,
			transforms: [],
		});
	});

	it('tracks transforms for multi-backend resolution', () => {
		const stack = [
			'Error: Test error',
			'at eval (eval at loadConfig (http://localhost:5173/src/main.ts:30:12), <anonymous>:1:1)',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.resolvedBy).toBe('forward');
		expect(result[0]?.transforms).toEqual(['parenthesis']);
		expect(result[0]?.path).toBe('http://localhost:5173/src/main.ts');
		expect(result[0]?.line).toBe(30);
		expect(result[0]?.column).toBe(12);
	});

	it('handles nested eval chains with multiple transforms', () => {
		const stack = [
			'Error: Test error',
			String.raw`at eval (eval at run (C:\dev\app\runner.js:22:5), <anonymous>:5:10)`,
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.resolvedBy).toBe('forward');
		expect(result[0]?.transforms).toEqual(['parenthesis']);
		expect(result[0]?.path).toBe(String.raw`C:\dev\app\runner.js`);
	});

	it('handles paths with spaces in directory names', () => {
		const stack = ['Error: Test error', 'at /home/user/my projects/app.js:10:5'].join(
			'\n',
		);

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('/home/user/my projects/app.js');
		expect(result[0]?.line).toBe(10);
		expect(result[0]?.column).toBe(5);
	});

	it('handles Windows paths with Program Files', () => {
		const stack = [
			'Error: Test error',
			String.raw`at C:\Program Files\nodejs\node_modules\lib\index.js:10:2`,
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe(
			String.raw`C:\Program Files\nodejs\node_modules\lib\index.js`,
		);
	});

	it('handles node internal modules', () => {
		const stack = [
			'Error: Test error',
			'at node:internal/process/execution.js:80:27',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('node:internal/process/execution.js');
		expect(result[0]?.line).toBe(80);
		expect(result[0]?.column).toBe(27);
	});

	it('handles file protocol URLs', () => {
		const stack = [
			'Error: Test error',
			'at file:///Users/cat/dev/esm/module.mjs:55:9',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('file:///Users/cat/dev/esm/module.mjs');
		expect(result[0]?.resolvedBy).toBe('forward');
	});

	it('handles webpack protocol URLs', () => {
		const stack = [
			'Error: Test error',
			'at webpack:///src/components/Button.tsx:77:14',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('webpack:///src/components/Button.tsx');
		expect(result[0]?.line).toBe(77);
		expect(result[0]?.column).toBe(14);
	});

	it('handles blob URLs', () => {
		const stack = ['Error: Test error', 'at blob:https://example.com/3f1c9d2a:23:7'].join(
			'\n',
		);

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('blob:https://example.com/3f1c9d2a');
	});

	it('handles paths with parentheses in directory names', () => {
		const stack = ['Error: Test error', 'at /path/with (parens)/file.ts:10:5'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('/path/with (parens)/file.ts');
	});

	it('handles parenthesized frames', () => {
		const stack = [
			'Error: Test error',
			'at Object.<anonymous> (/home/cat/dev/project/src/index.ts:12:5)',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('/home/cat/dev/project/src/index.ts');
		expect(result[0]?.resolvedBy).toBe('parenthesis');
	});

	it('handles Firefox-style frames with @', () => {
		const stack = [
			'TypeError: boom',
			'at render@http://localhost:3000/src/main.ts:42:17',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('http://localhost:3000/src/main.ts');
		expect(result[0]?.line).toBe(42);
		expect(result[0]?.column).toBe(17);
	});

	it('handles paths without column numbers', () => {
		const stack = ['Error: Test error', 'at /home/cat/app.ts:42'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('/home/cat/app.ts');
		expect(result[0]?.line).toBe(42);
		expect(result[0]?.column).toBeNull();
	});

	it('handles empty stack', () => {
		const result = parseError(createErrorWithStack(''));
		expect(result).toEqual([]);
	});

	it('handles header-only stack', () => {
		const result = parseError(createErrorWithStack('Error: Test'));
		expect(result).toEqual([]);
	});

	it('handles complex nested eval with parenthesis backend', () => {
		const stack = [
			'Error: Test error',
			'at eval (eval at processJob (eval at bootstrap (eval at c (/home/cat/dev/project/src/eval.ts:10:3), <anonymous>:1:1), worker.js:5:2), runner.js:12:8)',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('/home/cat/dev/project/src/eval.ts');
		expect(result[0]?.line).toBe(10);
		expect(result[0]?.column).toBe(3);
	});

	it('handles mixed backend stack traces', () => {
		const stack = [
			'Error: Complex error',
			'at Object.<anonymous> (/home/cat/dev/project/src/index.ts:12:5)',
			'at node:internal/modules/cjs/loader:1256:14',
			String.raw`at C:\Users\cat\Desktop\test project\app.js:42:13`,
			'at /path/with spaces/and (parentheses)/file name.ts:9:2',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(4);

		// First frame: parenthesis backend
		expect(result[0]?.path).toBe('/home/cat/dev/project/src/index.ts');
		expect(result[0]?.resolvedBy).toBe('parenthesis');

		// Second frame: parenthesis backend (node: is inside parens)
		expect(result[1]?.path).toBe('node:internal/modules/cjs/loader');

		// Third frame: forward backend (Windows drive)
		expect(result[2]?.path).toBe(String.raw`C:\Users\cat\Desktop\test project\app.js`);
		expect(result[2]?.resolvedBy).toBe('forward');

		// Fourth frame: reverse backend (spaces and parens)
		expect(result[3]?.path).toBe('/path/with spaces/and (parentheses)/file name.ts');
		expect(result[3]?.resolvedBy).toBe('reverse');
	});
});

describe('Edge Cases', () => {
	it('handles very long paths', () => {
		const longPath = '/very' + '/long'.repeat(50) + '/path/file.ts:1:1';
		const stack = ['Error: Test', `at function (${longPath})`].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe(longPath.replace(/:1:1$/, ''));
	});

	it('handles paths with special characters', () => {
		const stack = [
			'Error: Test',
			'at /path/with-dashes_and_underscores/file.name.ts:10:5',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('/path/with-dashes_and_underscores/file.name.ts');
	});

	it('handles URLs with query parameters', () => {
		const stack = [
			'Error: Test',
			'at http://localhost:5173/src/App.tsx?t=1680000000000:45:21',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('http://localhost:5173/src/App.tsx?t=1680000000000');
	});

	it('handles native runtime prefix', () => {
		const stack = ['Error: Test', 'at native:some_module:10:5'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('native:some_module');
	});

	it('handles bun runtime prefix', () => {
		const stack = ['Error: Test', 'at bun:internal/module:10:5'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('bun:internal/module');
	});

	it('handles rsc runtime prefix', () => {
		const stack = ['Error: Test', 'at rsc:component/file.tsx:10:5'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('rsc:component/file.tsx');
	});

	it('handles data URI', () => {
		const stack = ['Error: Test', 'at data:text/javascript,code:1:1'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('data:text/javascript,code');
	});

	it('handles vite protocol', () => {
		const stack = ['Error: Test', 'at vite://localhost/src/main.ts:33:11'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('vite://localhost/src/main.ts');
	});

	it('handles trailing slashes in paths', () => {
		const stack = ['Error: Test', 'at /path/to/dir/:10:5'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		// This should fail to parse as there's no file after the trailing slash
		expect(result).toHaveLength(1);
		// The path should be extracted up to the coordinate
		expect(result[0]?.path).toBe('/path/to/dir/');
	});

	it('handles async function names', () => {
		const stack = ['Error: Test', 'at async Promise.all (index 0)'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBeNull();
	});

	it('handles anonymous function indicator', () => {
		const stack = ['Error: Test', 'at <anonymous>'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBeNull();
	});

	it('handles new Function constructor', () => {
		const stack = ['Error: Test', 'at new Function (<anonymous>)'].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBeNull();
	});

	it('handles Function.executeUserCode', () => {
		const stack = ['Error: Test', 'at Function.executeUserCode (node:vm:132:12)'].join(
			'\n',
		);

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('node:vm');
		expect(result[0]?.line).toBe(132);
		expect(result[0]?.column).toBe(12);
	});

	it('handles processTicksAndRejections', () => {
		const stack = [
			'Error: Test',
			'at processTicksAndRejections (node:internal/process/task_queues:96:5)',
		].join('\n');

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('node:internal/process/task_queues');
	});

	it('handles runMainModule', () => {
		const stack = ['Error: Test', 'at node:internal/main/run_main_module:23:47'].join(
			'\n',
		);

		const result = parseError(createErrorWithStack(stack));

		expect(result).toHaveLength(1);
		expect(result[0]?.path).toBe('node:internal/main/run_main_module');
	});
});
