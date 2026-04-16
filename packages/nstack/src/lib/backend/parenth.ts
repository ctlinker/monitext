import { locateCoordinateIn } from '../coord';
import type { IParse } from '../types';

/**
 * Extracts a resource wrapped in parentheses, including nested eval chains.
 *
 * Handles:
 * - method (/tmp/file.ts:10:2)
 * - eval (eval at load (http://host/app.js:10:2), <anonymous>:1:1)
 */
export function extractParenthesizedResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw, coord] = input;

	if (!coord) return null;
	if (raw[coord.endIndex + 1] !== ')') return null;

	const closeParenIndex = coord.endIndex + 1;

	// 🔥 correct structural matching
	const openParenIndex = findMatchingOpenParen(raw, closeParenIndex);
	if (openParenIndex < 0) return null;

	let processedResource = raw.slice(openParenIndex + 1, closeParenIndex);
	if (!processedResource.length) return null;

	let shouldReparse = false;
	let prerequisite =
		processedResource.includes('eval') &&
		processedResource.includes('(') &&
		processedResource.includes(')');

	// unwrap nested structures
	const resolved = !prerequisite
		? processedResource
		: resolveNested(`(${processedResource})`);

	if (resolved !== processedResource) {
		processedResource = resolved;
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

/**
 * Find the matching "(" for a given ")"
 */
function findMatchingOpenParen(str: string, closeIndex: number): number {
	let depth = 0;

	for (let i = closeIndex; i >= 0; i--) {
		const char = str[i];

		if (char === ')') depth++;
		else if (char === '(') {
			depth--;
			if (depth === 0) return i;
		}
	}

	return -1;
}

/**
 * Recursively unwrap nested "(...coord...)" structures
 */
function resolveNested(input: string): string {
	let current = input;
	let coordinate = '';
	let getResult = () => current + coordinate;

	console.log('inp:', input);

	while (true) {
		const coord = locateCoordinateIn(current);
		if (!coord) {
			return getResult();
		}

		const close = coord.endIndex + 1;
		if (current[close] !== ')') return getResult();

		const open = findMatchingOpenParen(current, close);
		if (open < 0) return current;

		// slice inside this layer
		coordinate = coord.coordStr;
		const next = current.slice(open + 1, coord.startIndex);

		// if nothing changes → stop
		if (next === current) return getResult();

		current = next;
	}
}
