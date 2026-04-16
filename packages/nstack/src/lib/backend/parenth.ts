import { locateCoordinateIn } from '../coord';
import type { IParse } from '../types';

/**
 * Extracts resources enclosed in parentheses, with specific support for nested 
 * structures like 'eval' calls.
 * 
 * @description
 * This function handles cases where a file path and its coordinates are wrapped 
 * in parentheses. It is particularly robust against "eval chains" where multiple 
 * layers of source information are nested within each other.
 * 
 * **Key Behaviors:**
 * 1. **Structural Integrity:** Uses a stack-based counting method to find the 
 *    correct matching opening parenthesis, avoiding errors caused by nested parens.
 * 2. **Eval Unwrapping:** If the resource contains 'eval', it recursively 
 *    traverses inward to find the original source file hidden deep in the call stack.
 * 3. **Coord Stripping:** Removes the coordinate string from the final result 
 *    to return a clean file path/URL.
 * 
 * @param {IParse.RawInput} input - Tuple containing the raw string and coordinate metadata.
 * @returns {IParse.ExtractedResource | null} A resolution object. If an eval chain 
 * was unwrapped, `reparse` is set to `true` to trigger a secondary analysis pass.
 * 
 * @example
 * // Standard: "method (/dist/app.js:10:2)" -> "/dist/app.js"
 * // Nested Eval: "eval at load (http://host/app.js:10:2), <anonymous>:1:1" -> "http://host/app.js"
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
	const resolved = prerequisite
		? resolveNested(`(${processedResource})`)
		: processedResource;

	if (resolved === processedResource) {
		processedResource = processedResource.replace(coord.coordStr, '');
	} else {
		processedResource = resolved;
		shouldReparse = true;
	}

	return {
		backend: 'parenthesis',
		reparse: shouldReparse,
		resource: processedResource,
	};
}

/**
 * Implements a reverse-scanning balance algorithm to find the start of a 
 * parenthesized block.
 * 
 * @param {string} str - The string to scan.
 * @param {number} closeIndex - The index of the known closing parenthesis.
 * @returns {number} The index of the matching opening parenthesis, or -1 if unbalanced.
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
 * Recursively unwraps nested structures to locate the inner-most resource.
 * 
 * @description
 * In stack traces like `eval at (source.js:1:1), <anonymous>:2:2`, the "true" 
 * source is the one inside the nested parenthesis. This function iteratively 
 * peels back layers of wrapping until no further coordinates or parentheses 
 * can be resolved.
 * 
 * @param {string} input - The string potentially containing nested source definitions.
 * @returns {string} The inner-most resolved resource string.
 */
function resolveNested(input: string): string {
	let current = input;
	let coordinate = '';
	let getResult = () => current + coordinate;

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
