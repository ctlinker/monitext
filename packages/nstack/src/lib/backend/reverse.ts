import type { IParse } from '../types';

/**
 * Extract a resource path by scanning backwards from a known coordinate.
 * 
 * @description
 * This function performs a high-performance reverse scan from `coord.startIndex`.
 * It is designed to capture full file paths that may contain spaces, provided 
 * those spaces occur after an initial path anchor (forward or backslash).
 * 
 * **Scanning Logic:**
 * 1. If no path separator (`/` or `\`) exists in the line, it stops at the first space.
 * 2. If a separator exists, it allows spaces to be part of the resource until it 
 *    reaches a space that exists *before* the first separator.
 * 
 * @param {IParse.RawInput} input - Tuple containing the raw string and coordinate metadata.
 * @param {string} input[0] - The raw text line to parse.
 * @param {IParse.Coord | null} input[1] - The starting point for the reverse search.
 * 
 * @returns {IParse.ExtractedResource | null} The extracted path object or null if 
 * the resource is empty or fails validation (must look like a file or path).
 * 
 * @example
 * // Simple word extraction:
 * extractReverseResource(["error in server.js:10", { startIndex: 15 }]) 
 * // -> "server.js"
 * 
 * // Path with spaces:
 * extractReverseResource(["at /Users/Me/App Data/index.js:1", { startIndex: 25 }]) 
 * // -> "/Users/Me/App Data/index.js"
 */
export function extractReverseResource(
    input: IParse.RawInput,
): IParse.ExtractedResource | null {
    const [raw, coord] = input;

    if (coord == null || coord.startIndex <= 0) {
        return null;
    }

    const startSearch = coord.startIndex - 1;
    const firstAnchor = findFirstAnchor(raw);
    
    let leftBoundary = 0;

    if (firstAnchor === -1 || startSearch < firstAnchor) {
        // Simple case: No path separators, find the first space to the left
        leftBoundary = raw.lastIndexOf(' ', startSearch);
        leftBoundary = leftBoundary === -1 ? 0 : leftBoundary + 1;
    } else {
        // Path case: We must include spaces if they are after the first anchor
        // Example: "/var/lib/my app/server.js"
        for (let i = startSearch; i >= 0; i--) {
            if (raw[i] === ' ' && i < firstAnchor) {
                leftBoundary = i + 1;
                break;
            }
        }
    }

    const resource = raw.substring(leftBoundary, coord.startIndex);

    // Fast-path validation: Check length first, then use a single regex
    if (resource.length === 0) return null;
    
    // Combined validation logic: Must have a file-like structure
    if (!/\w+\.\w|[/\\.:]/.test(resource)) {
        return null;
    }

    return { backend: 'reverse', resource };
}

function findFirstAnchor(raw: string): number {
    const forward = raw.indexOf('/');
    const backward = raw.indexOf('\\');
    
    if (forward === -1) return backward;
    if (backward === -1) return forward;
    return Math.min(forward, backward);
}