const fs = require('node:fs');
const path = require('node:path');

const pkgBaseDir = path.resolve(__dirname, '..', 'packages');
const rootBaseDir = path.resolve(__dirname, '..', '..');

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
				const latestVerDir = path.join(srcDir, latestVer);
				const latestLink = path.join(srcDir, 'latest');

				// Sync README.md to index.md
				const readmePath = path.join(rootBaseDir, 'packages', pkg, 'README.md');
				if (fs.existsSync(readmePath)) {
					const indexDocPath = path.join(latestVerDir, 'index.md');
					fs.copyFileSync(readmePath, indexDocPath);
					console.log(`Synced ${pkg}/README.md -> ${pkg}/src/${latestVer}/index.md`);
				}

				// Sync CHANGELOG.md to changelog.md
				const changelogPath = path.join(rootBaseDir, 'packages', pkg, 'CHANGELOG.md');
				if (fs.existsSync(changelogPath)) {
					const changelogDocPath = path.join(latestVerDir, 'changelog.md');
					fs.copyFileSync(changelogPath, changelogDocPath);
					console.log(
						`Synced ${pkg}/CHANGELOG.md -> ${pkg}/src/${latestVer}/changelog.md`,
					);
				}

				// Update symlink
				try {
					if (fs.existsSync(latestLink)) {
						const stats = fs.lstatSync(latestLink);
						if (stats.isSymbolicLink()) {
							fs.unlinkSync(latestLink);
						} else {
							console.warn(`Warning: ${latestLink} is a directory, skip.`);
							continue;
						}
					}

					// Create relative symlink
					fs.symlinkSync(latestVer, latestLink, 'dir');
					console.log(`Synced ${pkg}/latest -> ${latestVer}`);
				} catch (err) {
					console.error(`Failed to sync ${pkg} latest link:`, err.message);
				}
			}
		}
	}
}

sync();
