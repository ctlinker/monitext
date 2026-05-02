import type { IParse } from '../types';

/**
 * Extracts a resource by scanning forward for strong, explicit resource starts.
 *
 * This backend is best for protocol and runtime-prefixed resources like
 * `http://`, `file://`, `webpack:///`, `node:`, `bun:`, `native:`,
 * and Windows drive paths.
 *
 * failOn:
 * - `/home/user/app.ts:10:2`
 *   why: bare `/` is not treated as a reliable start marker, so Unix paths are intentionally ignored here.
 * - `relative/file.ts:10:2`
 *   why: relative paths do not have a strong enough forward anchor.
 */
export function extractForwardResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw, coord] = input;

	if (coord == null) {
		return null;
	}

	let bestIndex = -1;
	let bestScore = -1;

	for (let index = 0; index < coord.startIndex; ) {
		// Remove automatic index++
		const [score, skip] = scoreResourceStart(raw, index);

		if (score > bestScore) {
			bestScore = score;
			bestIndex = index;
		}

		// Jump ahead by 'skip' or at least 1 to avoid infinite loops
		index += Math.max(1, skip);
	}

	if (bestIndex < 0 || bestScore < 0) {
		return null;
	}

	const resource = raw.slice(bestIndex, coord.startIndex);
	if (resource.length === 0) {
		return null;
	}

	return {
		backend: 'forward',
		resource,
	};
}

/**
 * Scores whether a given character index looks like the start of a resource.
 */
function scoreResourceStart(line: string, index: number): [number, number] {
	const remaining = line.slice(index);

	// 1. Explicit Protocols (e.g., http://, webpack://)
	const protocolMatch = /^[a-z][a-z0-9+\-.]*:\/\//i.exec(remaining);
	if (protocolMatch) {
		return [10, protocolMatch[0].length];
	}

	// 2. Windows Drive Paths (e.g., C:\)
	if (/^[a-z]:[\\/]/i.test(remaining)) {
		return [9, 3]; // "C:\" is 3 chars
	}

	// 3. Runtime/Virtual Prefixes (e.g., node:, bun:)
	const runtimeMatch = /^(node|bun|native|rsc|webpack|vite):/i.exec(remaining);
	if (runtimeMatch) {
		return [8, runtimeMatch[0].length];
	}

	// 4. Data/Blob URIs
	const blobMatch = /^(blob|data):/i.exec(remaining);
	if (blobMatch) {
		return [7, blobMatch[0].length];
	}

	// No match: skip 1 char to try the next position
	return [-1, 1];
}
