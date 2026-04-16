import { describe, expect, it } from 'vitest';
import { interpretErrorStack } from '../src/lib/parse';

function createErrorWithStack(stack: string) {
	const err = new Error('fixture');
	err.stack = stack;
	return err;
}

describe('interpretErrorStack', () => {
	it('returns an empty array for header-only stacks', () => {
		expect(interpretErrorStack(createErrorWithStack('Error'))).toEqual([]);
	});

	it('uses resource as the public field instead of path', () => {
		expect(
			interpretErrorStack(
				createErrorWithStack(
					['Error: boom', '    at /home/cat/project/src/index.ts:12:8'].join('\n'),
				),
			),
		).toEqual([
			{
				backend: ['reverse'],
				processed: true,
				raw: 'at /home/cat/project/src/index.ts:12:8',
				resource: '/home/cat/project/src/index.ts',
				coord: {
					endIndex: 37,
					coordStr: ':12:8',
					line: 12,
					column: 8,
					startIndex: 33,
				},
			},
		]);
	});

	it('parses parenthesized frames without keeping coordinates in the resource', () => {
		expect(
			interpretErrorStack(
				createErrorWithStack(
					['Error: boom', '    at readConfig (/home/cat/with space/app.ts:44:2)'].join(
						'\n',
					),
				),
			),
		).toEqual([
			{
				backend: ['parenthesis'],
				processed: true,
				raw: 'at readConfig (/home/cat/with space/app.ts:44:2)',
				resource: '/home/cat/with space/app.ts',
				coord: {
					endIndex: 46,
					coordStr: ':44:2',
					line: 44,
					column: 2,
					startIndex: 42,
				},
			},
		]);
	});

	it('supports firefox style frames', () => {
		expect(
			interpretErrorStack(
				createErrorWithStack(
					['TypeError: boom', 'at render@http://localhost:3000/src/main.ts:42:17'].join(
						'\n',
					),
				),
			),
		).toEqual([
			{
				backend: ['forward'],
				processed: true,
				raw: 'at render@http://localhost:3000/src/main.ts:42:17',
				resource: 'http://localhost:3000/src/main.ts',
				coord: {
					endIndex: 48,
					coordStr: ':42:17',
					line: 42,
					column: 17,
					startIndex: 43,
				},
			},
		]);
	});

	it("does not treat arbitrary '@' inside a resource-like string as firefox format", () => {
		expect(
			interpretErrorStack(
				createErrorWithStack(
					['Error: boom', 'prefix /tmp/file.js@myprefix:12:3'].join('\n'),
				),
			),
		).toEqual([
			{
				backend: ['reverse'],
				processed: true,
				raw: 'prefix /tmp/file.js@myprefix:12:3',
				resource: '/tmp/file.js@myprefix',
				coord: {
					endIndex: 32,
					coordStr: ':12:3',
					line: 12,
					column: 3,
					startIndex: 28,
				},
			},
		]);
	});

	it('handles windows paths with spaces without relying on token splitting', () => {
		expect(
			interpretErrorStack(
				createErrorWithStack(
					['Error: boom', '    at load (C:\\Program Files\\My App\\index.js:20:5)'].join(
						'\n',
					),
				),
			),
		).toEqual([
			{
				backend: ['parenthesis'],
				processed: true,
				raw: 'at load (C:\\Program Files\\My App\\index.js:20:5)',
				resource: 'C:\\Program Files\\My App\\index.js',
				coord: {
					endIndex: 45,
					coordStr: ':20:5',
					line: 20,
					column: 5,
					startIndex: 41,
				},
			},
		]);
	});

	it("keeps nested eval lines intact instead of splitting on inner 'at'", () => {
		expect(
			interpretErrorStack(
				createErrorWithStack(
					[
						'Error: boom',
						'    at eval (eval at loadConfig (http://localhost:5173/src/main.ts:30:12), <anonymous>:1:1)',
					].join('\n'),
				),
			),
		).toEqual([
			{
				backend: ['parenthesis', 'forward'],
				processed: true,
				raw: 'at eval (eval at loadConfig (http://localhost:5173/src/main.ts:30:12), <anonymous>:1:1)',
				resource: 'http://localhost:5173/src/main.ts',
				coord: {
					endIndex: 38,
					coordStr: ':30:12',
					line: 30,
					column: 12,
					startIndex: 33,
				},
			},
		]);
	});
});
