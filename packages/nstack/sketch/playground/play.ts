import { interpretErrorStack, parseError } from '@/lib/parse';

export const playGround = {
	parseError(input: string) {
		try {
			const err = new Error('Something went wrong');
			err.stack = input.trim();

			throw err;
		} catch (err) {
			const stack = parseError(err as Error); // Parsed Frame[]

			stack.forEach((f) => {
				console.log(`- Frame`);
				console.log(`  Raw       : ${f.raw}`);
				console.log(`  Path      : ${f.path ?? 'unknown'}`);
				console.log(`  Line/Col  : ${f.line ?? '?'}:${f.column ?? '?'}`);
				console.log(`  Resolved  : ${f.resolvedBy}`);

				if (f.transforms.length) {
					console.log(`  Via       : ${f.transforms.join(' -> ')}`);
				}

				console.log('');
			});
		}
	},

	interpretErrorStack(input: string) {
		try {
			const err = new Error('Something went wrong');
			err.stack = input.trim();

			throw err;
		} catch (err) {
			const stack = interpretErrorStack(err as Error);

			stack.forEach((line) => {
				if (line.processed) {
					const chain = Array.isArray(line.backend) ? line.backend : [line.backend];

					const final = chain.at(-1);
					const transforms = chain.slice(0, -1);

					console.log(`- Backend: ${chain.join(',')}`);
					console.log(`  Raw: ${line.raw}`);
					console.log(`  Path: ${line.resource}`);
					console.log(`  Line/Col: ${line.coord.line}:${line.coord.column}`);

					if (transforms.length) {
						console.log(`  Via: ${transforms.join(' -> ')}`);
					}

					console.log(`  Resolved by: ${final}`);
				} else {
					console.warn(`- Unparsed line: ${line.raw}`);
				}

				console.log('');
			});
		}
	},
};
