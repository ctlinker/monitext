import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';

const pkgBaseDir = path.resolve(__dirname, '..', 'packages');

/**
 * Discovers packages and versions in the docs/packages directory.
 * Structure: docs/packages/<pkg>/src/<version>
 */
function discover() {
	const data: Record<string, string[]> = {};
	if (!fs.existsSync(pkgBaseDir)) return data;

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
			data[pkg] = versions;
		}
	}
	return data;
}

const packages = discover();

function generateRewrites() {
	const rewrites: Record<string, string> = {};

	for (const [pkg, versions] of Object.entries(packages)) {
		// Map specific versions
		for (const ver of versions) {
			rewrites[`packages/${pkg}/src/${ver}/:slug*`] = `${pkg}/${ver}/:slug*`;
		}
		// Map latest (via symlink directory)
		rewrites[`packages/${pkg}/src/latest/:slug*`] = `${pkg}/latest/:slug*`;
	}

	return rewrites;
}

function generateSidebar() {
	const sidebar: any = {};

	for (const [pkg, versions] of Object.entries(packages)) {
		const latestVer = versions[0];
		for (const ver of versions) {
			const pkgPath = `/${pkg}/${ver}/`;
			const latestPath = `/${pkg}/latest/`;

			const items: any[] = [
				{
					text: 'Getting Started',
					items: [{ text: 'Quick Start', link: `${pkgPath}index` }],
				},
			];

			// Add version switcher if multiple versions exist
			if (versions.length > 1) {
				items.push({
					text: 'Versions',
					collapsed: true,
					items: versions.map((v) => ({
						text: v === latestVer ? `${v} (latest)` : v,
						link: `/${pkg}/${v}/index`,
					})),
				});
			}

			// Try to find more files in the version directory
			const verDir = path.join(pkgBaseDir, pkg, 'src', ver);
			const files = fs
				.readdirSync(verDir)
				.filter((f) => f.endsWith('.md') && f !== 'index.md');

			if (files.length > 0) {
				items.push({
					text: 'Guides',
					items: files.map((f) => ({
						text: f.replace('.md', '').charAt(0).toUpperCase() + f.slice(1, -3),
						link: `${pkgPath}${f.replace('.md', '')}`,
					})),
				});
			}

			sidebar[pkgPath] = items;
			if (ver === latestVer) {
				sidebar[latestPath] = items.map((group) => {
					if (group.text === 'Versions') return group; // Keep version links as absolute versioned links
					return {
						...group,
						items: group.items.map((item: any) => ({
							...item,
							link: item.link.replace(pkgPath, latestPath),
						})),
					};
				});
			}
		}
	}

	return sidebar;
}

function generateNav() {
	const nav = [
		{ text: 'Home', link: '/' },
		{
			text: 'Packages',
			items: Object.keys(packages).map((pkg) => ({
				text: pkg,
				link: `/${pkg}/latest/`,
			})),
		},
		{ text: 'Guidelines', link: '/agent' },
	];

	return nav;
}

export default defineConfig({
	title: 'Monitext.Docs',
	description: 'Documentation for the Monitext ecosystem',
	base: process.env.NODE_ENV === 'production' ? '/monitext/' : '/',
	themeConfig: {
		nav: generateNav(),
		sidebar: generateSidebar(),
		socialLinks: [{ icon: 'github', link: 'https://github.com/ctlinker/monitext' }],
	},
	rewrites: generateRewrites(),
});
