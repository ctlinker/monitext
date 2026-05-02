import type { IParse } from '../types';

// A consolidated "Master" regex for all start patterns.
// Captures groups: 1: Protocol, 2: Drive, 3: Runtime, 4: Blobs
const RESOURCE_START_PATTERN = /([a-z][a-z0-9+\-.]*:\/\/)|([a-z]:[\\/])|((?:node|bun|native|rsc|webpack|vite):)|((?:blob|data):)/iy;

/**
 * Identifies the start of a resource path by scanning forward from the beginning of a line.
 * 
 * @description
 * This function searches for "High-Confidence" entry points (anchors) like protocols, 
 * drive letters, or runtime prefixes. It helps resolve paths that have a clear 
 * starting point but are embedded in complex log lines.
 * 
 * **Scoring Hierarchy:**
 * 1. Explicit Protocols (10) - e.g., `http://`, `webpack://`
 * 2. Windows Drive Paths (9) - e.g., `C:\`, `D:/`
 * 3. Runtime Prefixes (8) - e.g., `node:`, `bun:`, `vite:`
 * 4. Virtual URIs (7) - e.g., `blob:`, `data:`
 * 
 * @param {IParse.RawInput} input - Tuple containing the raw string and coordinate metadata.
 * @returns {IParse.ExtractedResource | null} The extracted resource string (from anchor 
 * to coordinate) or null if no valid start pattern is recognized.
 */
export function extractForwardResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw, coord] = input;

	if (coord == null || coord.startIndex <= 0) {
		return null;
	}

	let bestIndex = -1;
	let bestScore = -1;

	// Reset sticky index
	RESOURCE_START_PATTERN.lastIndex = 0;

	for (let index = 0; index < coord.startIndex;) {
		RESOURCE_START_PATTERN.lastIndex = index;
		const match = RESOURCE_START_PATTERN.exec(raw);

		if (!match) {
			index++;
			continue
		}

		let score = 0;

		// Determine score based on which group matched
		if (match[1]) score = 10;      // Protocol
		else if (match[2]) score = 9;  // Windows Drive
		else if (match[3]) score = 8;  // Runtime
		else if (match[4]) score = 7;  // Blob/Data

		if (score > bestScore) {
			bestScore = score;
			bestIndex = index;
		}

		// Skip the length of the match
		index += match[0].length;
	}

	if (bestIndex < 0) return null;

	const resource = raw.slice(bestIndex, coord.startIndex);

	return resource.length > 0
		? { backend: 'forward', resource }
		: null;
}
