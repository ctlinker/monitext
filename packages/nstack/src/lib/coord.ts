import type { IParse } from './types';

export function locateCoordinateIn(line: string): IParse.RawCoordinate {
	const matches = [...line.matchAll(/:(\d+|\?|null)(?::(\d+|\?|null))?(?=$|\s|\))/g)];
	const lastMatch = matches.at(-1);

	if (lastMatch?.index == null) {
		return null;
	}

	const coordStr = lastMatch[0];

	return {
		startIndex: lastMatch.index,
		endIndex: lastMatch.index + coordStr.length - 1,
		coordStr,
		line: parseCoordinatePart(lastMatch[1]),
		column: parseCoordinatePart(lastMatch[2]),
	};
}

function parseCoordinatePart(value: string | undefined): number | null {
	if (value == null || value == '?' || value == "null") {
		return null;
	}

	return Number.parseInt(value, 10);
}
