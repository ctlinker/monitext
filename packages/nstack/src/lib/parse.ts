import { extractExtensionBasedResource } from './backend/extension';
import { extractForwardResource } from './backend/forward';
import { extractParenthesizedResource } from './backend/parenth';
import { extractReverseResource } from './backend/reverse';
import { locateCoordinateIn } from './coord';
import type { IParse } from './types';

const resourceExtractors: IParse.ResourceExtractor[] = [
	extractExtensionBasedResource,
	extractParenthesizedResource,
	extractForwardResource,
	extractReverseResource,
];

export function interpretErrorStack(raw: Error): IParse.ParsedStackLine[] {
	const stack = typeof raw.stack === 'string' ? raw.stack : '';
	const lines = normalizeStackLines(stack);

	return lines.map((line) => parseStackLine(line));
}

export function parseError(raw: Error): IParse.ParsedFrame[] {
	const stack = typeof raw.stack === 'string' ? raw.stack : '';
	const lines = normalizeStackLines(stack);
	return lines.map((line) => {
		const curr = parseStackLine(line);

		if (curr.processed == false)
			return {
				raw: curr.raw,
				path: null,
				line: null,
				column: null,
				resolvedBy: null,
				transforms: [] as IParse.Backend[],
			};

		const transforms =
			curr.backend.length == 1 ? [] : curr.backend.slice(0, curr.backend.length - 1);

		return {
			raw: curr.raw,
			path: curr.resource,
			line: curr.coord.line,
			column: curr.coord.column,
			resolvedBy: curr.backend.at(-1)!,
			transforms,
		};
	});
}

function parseStackLine(rawLine: string): IParse.ParsedStackLine {
	const input: IParse.RawInput = [rawLine, locateCoordinateIn(rawLine)];

	let maxReparse = 5;
	let parseCount = 0;
	const backend: IParse.Backend[] = [];

	for (let index = 0; index <= resourceExtractors.length - 1; index++) {
		const result = resourceExtractors[index]!(input);
		if (result == null) {
			continue;
		}

		backend.push(result.backend);

		if (result?.reparse == true && parseCount < maxReparse) {
			input[0] = result.resource;
			input[1] = locateCoordinateIn(result.resource);
			parseCount++;
			index = 0;
			continue;
		}

		return {
			backend,
			processed: true,
			raw: rawLine,
			resource: result.resource,
			coord: input[1]!,
		};
	}

	return {
		processed: false,
		raw: rawLine,
		coord: input[1],
	};
}

function normalizeStackLines(stack: string): string[] {
	const rawLines = stack
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (rawLines.length === 0) {
		return [];
	}

	if (looksLikeKnownErrorHeader(rawLines[0]!)) {
		rawLines.shift();
	}

	return rawLines.filter((line) => line.length > 0);
}

function looksLikeKnownErrorHeader(line: string): boolean {
	return /^(?:[\w$.]+)?(?:Error|Exception)(?::.*)?$/.test(line);
}

export type ParsedStackLine = IParse.ParsedStackLine;
