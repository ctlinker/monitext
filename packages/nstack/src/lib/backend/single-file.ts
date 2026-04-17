import type { IParse } from '../types';

const EXT = '(?:js|ts|tsx|jsx|cjs|mjs|mts|cts|json|node|map|d.ts)';

const regex = new RegExp(
	`(^|\\s)(?:\\()?([a-zA-Z_\\-0-9]+\\.${EXT})(?:\\))?(\\s|$)`,
	'g',
);

export function extractSingleFileResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw] = input;

	if (/[\/\\]/.test(raw)) {
		return null;
	}

	const matches = [...raw.matchAll(regex)];
	const match = matches.at(-1);

	if (!match || match.index == null) {
		return null;
	}

	const start = match.index;
	const end = start + match[0].length;

	// actual matched window in raw string
	const window = raw.slice(start, end);

	// real semantic file token
	const file = match[2];

	// detect wrapping safely (ignores whitespace noise)
	const isWrapped = window.trim().startsWith('(') && window.trim().endsWith(')');

	const replacement = isWrapped ? `(${file}:NaN:NaN)` : `${file}:NaN:NaN`;

	const resource =
		raw.slice(0, start) +
		(match[1] || '') +
		replacement +
		(match[3] || '') +
		raw.slice(end);

	return {
		backend: 'single-file',
		resource,
		reparse: true,
	};
}
