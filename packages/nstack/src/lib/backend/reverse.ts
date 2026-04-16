import type { IParse } from '../types';

/**
 * Extracts a resource by walking backward from the coordinate span.
 *
 * This backend is best suited for filesystem-like resources where separators
 * such as `/` or `\\` give strong structure near the coordinate.
 *
 * failOn:
 * - `index.ts:10:2`
 *   why: a plain filename has no strong separator, so the backward scan stays intentionally conservative.
 * - `foo <anonymous>:1:1`
 *   why: there is no filesystem or named-resource structure to recover.
 */
/**
 * Reverse-scans a stack trace line to extract a filesystem-like or structured resource.
 *
 * This backend operates under a **bounded reverse extraction model**:
 * it walks backward from a coordinate span and reconstructs a resource string
 * until structural or whitespace-based termination conditions are met.
 *
 * ## Core behavior
 * - Starts from the end of the coordinate (`line:col`)
 * - Walks backward character-by-character
 * - Accumulates characters into a buffer
 * - Allows spaces inside valid structural regions
 * - Uses a forward anchor (first `/` or `\`) as a soft boundary constraint
 *
 * ## Anchor semantics
 * The anchor represents the first structural separator in the line.
 * It is used to prevent extracting across unrelated pre-context when spaces appear
 * outside of a meaningful path region.
 *
 * ## Acceptance rules
 * A reconstructed resource is considered valid if:
 * - It is non-empty
 * - AND it contains either:
 *   - a file-like pattern (`something.ext`)
 *   - OR a structural separator (`/`, `\`, `.`, `:`)
 *
 * This allows:
 * - filesystem paths
 * - URLs / protocols
 * - runtime / internal node identifiers
 * - bundled / transformed stack traces (webpack, vite, etc.)
 *
 * ## Fail cases
 * Returns `null` when:
 * - No coordinate context is provided
 * - No meaningful structured signal is recovered
 * - The extracted segment is purely noise or unstructured text
 *
 * Example failures:
 * - `<anonymous>` → no recoverable resource
 *
 * ## Design note
 * This extractor is intentionally **lenient in reconstruction but strict in validation**.
 * It favors recovering degraded stack information over precision slicing.
 *
 * @param input Raw stack trace line and coordinate metadata
 * @returns Extracted resource string or null if invalid
 */
export function extractReverseResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw, coord] = input;

	if (coord == null) {
		return null;
	}
	const buffer: string[] = [];
	const startAnchor = findFirstAnchor(raw);

	if (startAnchor === -1)
		for (let index = coord.startIndex - 1; index >= 0; index--) {
			let curr = raw[index]!;
			if (curr == ' ') break;
			buffer.push(curr);
		}
	else
		for (let index = coord.startIndex - 1; index >= 0; ) {
			let curr = raw[index]!;

			if (curr != ' ') {
				buffer.push(curr);
				index--;
				continue;
			} else if (index < startAnchor) {
				break;
			}

			let offset = 0;
			while (raw[index - offset] == ' ') {
				buffer.push(raw[index - offset]!);
				offset++;
			}

			index -= Math.max(1, offset);
		}

	const resource = buffer.reverse().join('');
	if (
		resource.length === 0 ||
		(!/\w+\.\w/.test(resource) && !/[\/\\.:]/.test(resource))
	) {
		return null;
	}

	return { backend: 'reverse', resource };
}

function findFirstAnchor(raw: string, from: number = 0) {
	for (let i = from; i <= raw.length - 1; i++) {
		const c = raw[i];
		if (c === '/' || c === '\\') return i;
	}
	return -1;
}
