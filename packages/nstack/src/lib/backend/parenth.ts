import type { IParse } from '../types';

/**
 * Extracts a resource wrapped in trailing parentheses, for example
 * `method (/tmp/file.ts:10:2)`.
 *
 * This backend is intentionally strict: the coordinate must be immediately
 * followed by `)` and the matching `(` must appear before the coordinate span.
 *
 * failOn:
 * - `eval (eval at load (http://host/app.js:10:2), <anonymous>:1:1)`
 *   why: nested parentheses make the captured slice heuristic rather than structurally exact.
 * - `method (/tmp/file.ts:10:2`
 *   why: missing closing `)` means the wrapper shape is incomplete.
 */
export function extractParenthesizedResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw, coord] = input;
	let shouldReparse = false;

	if (coord == null || raw[coord.endIndex + 1] !== ')') {
		return null;
	}

	const closeParenIndex = raw.indexOf(')', coord.endIndex);
	if (closeParenIndex !== coord.endIndex + 1) {
		return null;
	}

	const openParenIndex = raw.indexOf('(');
	if (openParenIndex < 0 || openParenIndex >= coord.startIndex) {
		return null;
	}

	let processedResource = raw.slice(openParenIndex + 1, closeParenIndex);
	if (processedResource.length === 0) {
		return null;
	}

	if (raw.includes('eval') && findBounding(processedResource)) {
		processedResource = resolveNestedEval(processedResource);
		shouldReparse = true;
	} else {
		processedResource = processedResource.replace(coord.coordStr, '');
	}

	return {
		backend: 'parenthesis',
		reparse: shouldReparse,
		resource: processedResource,
	};
}

function findBounding(s: string): null | [number, number] {
	const start = s.indexOf('(');
	const matches = [...s.matchAll(/:\d+\)/g)];
	const match = matches.at(-1)?.[0];
	const end = match ? s.lastIndexOf(match) + match.length - 1 : -1;
	if (start < 0 || end < 0) {
		return null;
	}

	return [start, end];
}

function resolveNestedEval(res: string): string {
	let curResult = res;

	while (true) {
		const bound = findBounding(curResult);
		if (!bound) {
			return curResult;
		}
		curResult = curResult.slice(bound[0] + 1, bound[1]);
	}
}
