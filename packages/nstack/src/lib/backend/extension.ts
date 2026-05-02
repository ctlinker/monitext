import type { IParse } from '../types';

const VALID_EXTENSION = String.raw`js|jsx|cjs|mjs|ts|cts|mts|tsx|svelte|ripple|c|cpp|rs|vue|json|map|node|wasm|mdx|md|html`

const END_WITH_EXTENSION = new RegExp(String.raw`\.(${VALID_EXTENSION})$`, "i")

const END_WITH_ANCHORED_EXTENSTION = new RegExp(
	String.raw`\.(${VALID_EXTENSION})((\:\d+)|(:null)){1,2}$`, "i"
)

/**
 * Resolves file paths in raw error strings by identifying valid extensions 
 * preceded by directory separators, specifically for strings lacking line/column anchors.
 * 
 * @description
 * This resolver acts as a heuristic fallback for stack traces where standard 
 * `:line:col` metadata is missing. It uses a state-machine approach to find dots (`.`)
 * that are preceded by a slash (`/` or `\`) and followed by a known source extension.
 * 
 * **Rules:**
 * - Only triggers if a separator (`/` or `\`) exists before the extension.
 * - Skips segments that already contain line/column anchors (e.g., `.js:10:5`).
 * - Validates extensions against a predefined list of source/web types.
 * 
 * @param {IParse.RawInput} input - A tuple containing the raw string to be parsed.
 * @returns {Object|undefined} Returns a resolution object with `:null:null` appended 
 * to matches, or undefined if no valid unanchored paths are found.
 * 
 *  => from : (/var/www/app/dist/server.js) /.js:2 (server.js) /app.jsx
 *  => to : (/var/www/app/dist/server.js:null:null) /.js:2 (server.js) /app.jsx:null:null
*/
export function extensionBasedPathResolution(input: IParse.RawInput): IParse.ExtractedResource | null {
	const [raw] = input;
	const ExtEndIndexes = new Set<number>(); // Set provides O(1) lookup
	let seenSperatorBeforeDot: boolean = false; // seen "/|\" before "."

	for (let idx = 0; idx < raw.length;) {

		let char = raw[idx] as string

		if (/[\\/]/.test(char)) {
			seenSperatorBeforeDot = true
			idx += 1
			continue
		}

		if (!seenSperatorBeforeDot || char != ".") {
			idx += 1
			continue
		}

		let extension = "";
		let offset = idx;

		// consume till " " | ")"
		while (!/[\s)]/.test(raw[offset] || " ")) {
			extension += raw[offset]
			offset++
		}

		// the while loop cause the offset to always overshoot by one
		// no need to offset + 1
		idx = offset;

		// if it does end like .js:19:2
		if (END_WITH_ANCHORED_EXTENSTION.test(extension)) {
			// skip & forget the separator
			seenSperatorBeforeDot = false
			continue
		}
		// if it doesn't end like .js
		else if (!END_WITH_EXTENSION.test(extension)) {
			// only skip the chars
			continue
		}

		// note the end index of extension & forget separator
		ExtEndIndexes.add(offset - 1)
		seenSperatorBeforeDot = false;
	}

	if (ExtEndIndexes.size === 0) { return null };

	// Efficient string building
	const buffer: string[] = [];
	for (let i = 0; i < raw.length; i++) {
		buffer.push(raw[i] as string);
		if (ExtEndIndexes.has(i)) {
			buffer.push(":null:null");
		}
	}

	const resource = buffer.join("");

	return {
		backend: 'extension',
		resource,
		reparse: true
	};
}

// Updated Regex: Handles filenames better and ensures it matches the whole "word"
const SINGLE_FILE_WITH_EXTENSION = new RegExp(
	String.raw`((?<=\(|\s|^)[\w\d\-_.]+\.(${VALID_EXTENSION})(?=\)|\s|$))`,
	"gi"
);

/**
 * Fallback resolver for standalone filenames without directory information.
 * 
 * @description
 * Identifies "naked" filenames (e.g., `server.js`) that appear in isolation 
 * within parentheses, at the end of a string, or surrounded by whitespace.
 * 
 * **Heuristic:**
 * Unlike `extensionBasedPathResolution2`, this does NOT require a directory 
 * separator. It is designed to catch simple filenames often found in top-level 
 * error messages or simplified console logs.
 * 
 * @param {IParse.RawInput} input - A tuple containing the raw string to be parsed.
 * @returns {IParse.ExtractedResource|null} A resolution object with the transformed resource string, 
 * or null if no matches are found.
 * 
 * @example
 * // Input: "Error in server.js"
 * // Output: { backend: "single-file", resource: "Error in server.js:null:null" }
 */
export function singleFileExtensionBasedPathResolution(input: IParse.RawInput): IParse.ExtractedResource | null {
	const [raw] = input;

	// Check if we have any matches first
	if (!SINGLE_FILE_WITH_EXTENSION.test(raw)) return null;

	// Use the callback version of replace to avoid the double-injection bug
	// and to handle all matches in a single pass.
	const resource = raw.replaceAll(SINGLE_FILE_WITH_EXTENSION, (match) => {
		return `${match}:null:null`;
	});

	return {
		backend: "single-file",
		resource,
		reparse: true
	};
}