const fs = require('node:fs');
const path = require('node:path');

const pkgBaseDir = path.resolve(__dirname, '..', 'packages');

function sync() {
	if (!fs.existsSync(pkgBaseDir)) return;

	const pkgs = fs
		.readdirSync(pkgBaseDir)
		.filter((f) => fs.statSync(path.join(pkgBaseDir, f)).isDirectory());

	for (const pkg of pkgs) {
		const srcDir = path.join(pkgBaseDir, pkg, 'src');
		if (fs.existsSync(srcDir)) {
			const versions = fs
				.readdirSync(srcDir)
				.filter((v) => fs.statSync(path.join(srcDir, v)).isDirectory() && v !== 'latest')
				.sort((a, b) =>
					b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }),
				);

			if (versions.length > 0) {
				const latestVer = versions[0];
				const latestLink = path.join(srcDir, 'latest');

				// Update symlink
				try {
					if (fs.existsSync(latestLink)) {
						const stats = fs.lstatSync(latestLink);
						if (stats.isSymbolicLink()) {
							fs.unlinkSync(latestLink);
						} else {
							// If it's a real directory, we might not want to delete it without care
							// but for this setup we expect it to be managed.
							console.warn(`Warning: ${latestLink} is a directory, skip.`);
							continue;
						}
					}

					// Create relative symlink
					fs.symlinkSync(latestVer, latestLink, 'dir');
					console.log(`Synced ${pkg}/latest -> ${latestVer}`);
				} catch (err) {
					console.error(`Failed to sync ${pkg}:`, err.message);
				}
			}
		}
	}
}

sync();
