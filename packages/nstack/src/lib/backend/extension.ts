import type { IParse } from '../types';

export function extractExtensionBasedResource(
	input: IParse.RawInput,
): IParse.ExtractedResource | null {
	const [raw] = input;
	let anchorIndex = NaN;
	let rawInput = [...raw];
	let inpLength = raw.length;

	const extentionEndIndex: number[] = [];

	for (let idx = 0; idx < inpLength; ) {
		const char = rawInput[idx];
		if (char === '/' || char === '\\') {
			anchorIndex = idx;
			idx++;
			continue;
		}

		if (Number.isNaN(anchorIndex) || char != '.') {
			idx++;
			continue;
		}

		if (extentionEndIndex.at(-1) != null && extentionEndIndex.at(-1)! > anchorIndex) {
			idx++;
			continue;
		}

		let ext = char;
		let offset = idx + 1;
		let nextChar = rawInput[offset];
		let extEndWithIndicator = false;

		while (nextChar) {
			if (nextChar == ' ' || nextChar == ')') {
				extEndWithIndicator = true;
				break;
			}
			offset += 1;
			ext += nextChar;
			nextChar = rawInput[offset];
		}

		const conditions = extEndWithIndicator || offset == inpLength;

		if (conditions && ext.match(/\.[a-zA-Z0-9\_\-\.]+$/)) {
			extentionEndIndex.push(offset - 1);
		}

		idx = offset + 1;
	}

	if (extentionEndIndex.length == 0) {
		return null;
	}

	const resource = [...raw]
		.map((char, index) => (extentionEndIndex.includes(index) ? `${char}:NaN:NaN` : char))
		.join('');

	return {
		backend: 'extension',
		resource,
		reparse: true,
	};
}
