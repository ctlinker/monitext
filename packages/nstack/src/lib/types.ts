export namespace IParse {
	export type RawCoordinate = null | {
		endIndex: number;
		startIndex: number;
		coordStr: string;
		line: number | null;
		column: number | null;
	};

	export type RawInput = [raw: string, coord: RawCoordinate];

	export type Backend =
		| 'forward'
		| 'reverse'
		| 'parenthesis'
		| 'extension'
		| 'single-file';

	export type ParsedFrame = {
		raw: string;
		path: string | null;
		line: number | null;
		column: number | null;

		resolvedBy: string | null;
		transforms: string[];
	};

	export type ExtractedResource = {
		backend: Backend;
		resource: string;
		reparse?: boolean;
	};

	export type ResourceExtractor = (input: RawInput) => ExtractedResource | null;

	export type ParsedStackLine =
		| {
				backend: Backend[];
				processed: true;
				raw: string;
				resource: string;
				coord: Exclude<RawCoordinate, null>;
		  }
		| {
				processed: false;
				raw: string;
				coord: RawCoordinate;
		  };
}
